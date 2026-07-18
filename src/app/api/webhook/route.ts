import { NextResponse } from 'next/server';
import { supabaseService } from '@/src/lib/supabase/service';

// --- UTILS ---
async function sendWhatsAppMessage(to: string, text: string) {
    const url = 'https://www.wasenderapi.com/api/send-message';
    const token = process.env.WASENDER_BEARER_TOKEN;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to, text }),
    }).catch(console.error);
}

async function uploadMediaToSupabase(base64Data: string, mimeType: string, senderNumber: string): Promise<string | null> {
    try {
        const base64Content = base64Data.replace(/^data:([A-Za-z-+/]+);base64,/, '');
        const buffer = Buffer.from(base64Content, 'base64');
        const ext = mimeType.split('/')[1] || 'jpg';
        const fileName = `${senderNumber}-${Date.now()}.${ext}`;
        const { error } = await supabaseService.storage.from('ticket-attachments').upload(fileName, buffer, { contentType: mimeType, upsert: true });
        if (error) return null;
        return supabaseService.storage.from('ticket-attachments').getPublicUrl(fileName).data.publicUrl;
    } catch (e) {
        return null;
    }
}

async function getDecryptedMediaBase64(msgObject: any): Promise<string | null> {
    const url = 'https://www.wasenderapi.com/api/decrypt-media';
    const token = process.env.WASENDER_BEARER_TOKEN;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ data: { messages: msgObject } }),
        });
        if (!res.ok) return null;
        const json = await res.json();
        if (!json.publicUrl || !json.publicUrl.startsWith('http')) return null;
        const arrayBuffer = await (await fetch(json.publicUrl)).arrayBuffer();
        const mimeType = msgObject.message?.imageMessage?.mimetype || 'image/jpeg';
        return `data:${mimeType};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
    } catch {
        return null;
    }
}

// --- HELPER UNTUK MENDAPATKAN ATAU MEMBUAT KATEGORI ---
async function getOrCreateCategory(categoryName: string): Promise<string | null> {
    let { data: category } = await supabaseService.from('categories').select('id').eq('name', categoryName).limit(1).maybeSingle();
    if (!category) {
        const { data: newCat, error } = await supabaseService.from('categories').insert([{ name: categoryName, description: 'Auto-generated dari interaksi WA' }]).select('id').single();
        if (error || !newCat) return null;
        return newCat.id;
    }
    return category.id;
}

// --- WEBHOOK MAIN ROUTE ---
export async function POST(request: Request) {
    try {
        const signature = request.headers.get('x-webhook-signature');
        if (signature !== process.env.WASENDER_WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const body = await request.json();
        if (body.event !== 'messages.received') return NextResponse.json({ status: 'ignored' });

        const msg = body.data?.messages;
        const messageText = typeof msg?.messageBody === 'string' ? msg.messageBody.trim() : '';
        const senderNumber = msg?.key?.cleanedSenderPn ?? msg?.key?.cleanedParticipantPn;

        if (!messageText || !senderNumber) return NextResponse.json({ status: 'ignored' });
        const textLower = messageText.toLowerCase();

        // INIT USER & SESSION
        let { data: user } = await supabaseService.from('users').select('*').eq('phone_number', senderNumber).maybeSingle();
        let { data: session } = await supabaseService.from('wa_sessions').select('*').eq('phone_number', senderNumber).maybeSingle();

        if (!user) {
            await supabaseService.from('users').upsert({ phone_number: senderNumber, name: 'Pengguna WA', role: 'PELAPOR' }, { onConflict: 'phone_number' });
        }

        if (!session) {
            const { data: newSession } = await supabaseService.from('wa_sessions').insert([{ phone_number: senderNumber, step: 'IDLE', temp_data: {} }]).select().single();
            session = newSession;
        } else {
            // Cek Timeout 15 Menit (Memastikan parse sebagai UTC dengan menambahkan Z)
            if (session.step !== 'IDLE' && session.updated_at) {
                const safeDateStr = session.updated_at.endsWith('Z') ? session.updated_at : `${session.updated_at}Z`;
                if ((new Date().getTime() - new Date(safeDateStr).getTime()) / 60000 > 15) {
                    await supabaseService.from('wa_sessions').update({ step: 'IDLE', temp_data: {}, updated_at: new Date().toISOString() }).eq('phone_number', senderNumber);
                    await sendWhatsAppMessage(senderNumber, `⏳ *Sesi Berakhir*\nMaaf, sesi telah di-reset karena tidak ada aktivitas selama lebih dari 15 menit.\nKetik *HaloDesk* untuk memulai kembali.`);
                    return NextResponse.json({ status: 'success' });
                }
            }
        }

        // RESET PERINTAH
        if (textLower === 'halodesk') {
            const nowIso = new Date().toISOString();
            await supabaseService.from('wa_sessions').update({ step: 'IDLE', temp_data: {}, updated_at: nowIso }).eq('phone_number', senderNumber);
            session.step = 'IDLE';
            session.updated_at = nowIso;
        }

        const updateState = async (step: string, appendData = {}) => {
            const newTemp = { ...session.temp_data, ...appendData };
            const nowIso = new Date().toISOString();
            await supabaseService.from('wa_sessions').update({ step, temp_data: newTemp, updated_at: nowIso }).eq('phone_number', senderNumber);
            session.temp_data = newTemp;
            session.step = step;
            session.updated_at = nowIso;
        };

        // --- STATE MACHINE ---
        switch (session.step) {
            case 'IDLE': {
                if (textLower === '1') {
                    await updateState('AWAITING_IDENTITY');
                    await sendWhatsAppMessage(senderNumber, `📝 *Form Pembuatan Tiket*\nSilakan balas dengan identitas Anda menggunakan format:\n*Nama Lengkap - NIM/NIP - Unit Kerja*\n\nContoh: Budi - 211201 - FT\n\n_Balas 0 untuk kembali_`);
                } else if (textLower === '2') {
                    await updateState('AWAITING_CEK_STATUS');
                    await sendWhatsAppMessage(senderNumber, `🔍 *Cek Status Tiket*\nSilakan masukkan Nomor Tiket Anda.\n\nContoh: TKT-1234\n\n_Balas 0 untuk kembali_`);
                } else if (textLower === '3') {
                    await updateState('AWAITING_TAMBAH_INFO_NO');
                    await sendWhatsAppMessage(senderNumber, `➕ *Tambah Informasi Tiket*\nMasukkan Nomor Tiket yang ingin Anda tambahkan infonya.\n\nContoh: TKT-1234\n\n_Balas 0 untuk kembali_`);
                } else if (textLower === '4') {
                    await updateState('AWAITING_FAQ_L1');
                    await sendWhatsAppMessage(senderNumber, `💡 *FAQ & Panduan*\nPilih topik:\n1. Aplikasi\n2. Website & Email\n3. Jaringan & Internet\n4. Cyber Security\n\n0. Kembali`);
                } else if (textLower === '5') {
                    await sendWhatsAppMessage(senderNumber, `📞 *Hubungi Petugas*\nLokasi: Gedung DSTI Universitas Diponegoro\nJam Operasional: Senin - Jumat (08.00 - 16.00)\nTelepon: (024) 1234567\n\n_Ketik HaloDesk untuk menu utama._`);
                } else if (textLower === '6') {
                    await updateState('AWAITING_SURVEY_RATING');
                    await sendWhatsAppMessage(senderNumber, `📊 *Survei Kepuasan*\nBerapa bintang yang Anda berikan untuk layanan kami? (1-5)\n\n1 = Sangat Buruk\n5 = Sangat Baik\n\n0. Kembali`);
                } else if (textLower === '0') {
                    await sendWhatsAppMessage(senderNumber, `👋 Terima kasih telah menghubungi Helpdesk IT UNDIP. Sesi diakhiri.`);
                } else {
                    await sendWhatsAppMessage(senderNumber, `🤖 *Halo! Pusat Bantuan IT Universitas Diponegoro.*\nSilakan balas dengan *angka*:\n*1.* 📝 Buat Tiket\n*2.* 🔍 Cek Status\n*3.* ➕ Tambah Info\n*4.* 📚 FAQ & Panduan\n*5.* 📞 Hubungi Petugas\n*6.* 📊 Survei\n*0.* ❌ Akhiri\n\n⚠️ Jangan pernah mengirimkan Password / OTP!`);
                }
                break;
            }

            // --- ALUR 1: BUAT TIKET ---
            case 'AWAITING_IDENTITY': {
                if (textLower === '0') {
                    await updateState('IDLE');
                    await sendWhatsAppMessage(senderNumber, `Kembali ke Menu Utama. Ketik HaloDesk.`);
                    break;
                }
                const parts = messageText.split('-').map((s: string) => s.trim());
                if (parts.length < 3) {
                    await sendWhatsAppMessage(senderNumber, `⚠️ Format salah. Harus ada tanda strip (-).\nContoh: Budi - 211201 - FT\n0. Kembali`);
                    break;
                }
                await updateState('AWAITING_CAT_L1', { name: parts[0], nim: parts[1], faculty: parts[2] });
                await sendWhatsAppMessage(senderNumber, `📌 *Kategori Layanan (Level 1)*\n1. Aplikasi\n2. Website dan Email\n3. Jaringan dan Internet\n4. Cyber Security\n0. Kembali`);
                break;
            }
            case 'AWAITING_CAT_L1': {
                if (textLower === '0') {
                    await updateState('IDLE');
                    await sendWhatsAppMessage(senderNumber, `Kembali ke Menu Utama. Ketik HaloDesk.`);
                    break;
                }
                if (textLower === '1') {
                    await updateState('AWAITING_CAT_L2_APP');
                    await sendWhatsAppMessage(senderNumber, `📂 *Aplikasi*\n1. SSO\n2. Gentayu\n3. Mandala\n4. E-Office\n5. Lainnya\n0. Kembali`);
                } else if (textLower === '2') {
                    await updateState('AWAITING_CAT_L2_WEB');
                    await sendWhatsAppMessage(senderNumber, `📂 *Website dan Email*\n1. Domain\n2. Website\n3. Email\n4. Lisensi\n0. Kembali`);
                } else if (textLower === '3') {
                    await updateState('AWAITING_CAT_L2_NET');
                    await sendWhatsAppMessage(senderNumber, `📂 *Jaringan dan Internet*\n1. WiFi\n2. VPN\n3. VM\n0. Kembali`);
                } else if (textLower === '4') {
                    await updateState('AWAITING_CAT_L2_SEC');
                    await sendWhatsAppMessage(senderNumber, `📂 *Cyber dan Security*\n1. Backdoor\n2. Keamanan Sistem\n0. Kembali`);
                } else {
                    await sendWhatsAppMessage(senderNumber, `⚠️ Pilihan tidak valid.`);
                }
                break;
            }
            case 'AWAITING_CAT_L2_APP': {
                if (textLower === '0') {
                    await updateState('AWAITING_CAT_L1');
                    await sendWhatsAppMessage(senderNumber, `📌 *Kategori Layanan (Level 1)*\n1. Aplikasi\n2. Website dan Email\n3. Jaringan dan Internet\n4. Cyber Security\n0. Kembali`);
                } else if (textLower === '1') {
                    await updateState('AWAITING_CAT_L3_SSO');
                    await sendWhatsAppMessage(senderNumber, `📂 *Aplikasi > SSO*\n1. Pembuatan Akun\n2. Reset Akun\n3. Perubahan Profil\n4. Reset OTP\n5. SIAP\n0. Kembali`);
                } else if (textLower === '2') {
                    await updateState('AWAITING_CAT_L3_GENTAYU');
                    await sendWhatsAppMessage(senderNumber, `📂 *Aplikasi > Gentayu*\n1. Gentayu Pegawai\n2. Gentayu Mahasiswa\n0. Kembali`);
                } else if (['3','4','5'].includes(textLower)) {
                    const topic = textLower === '3' ? 'Aplikasi - Mandala' : textLower === '4' ? 'Aplikasi - E-Office' : 'Aplikasi - Lainnya';
                    await updateState('AWAITING_COMPLAINT', { topic });
                    await sendWhatsAppMessage(senderNumber, `✍️ *Tulis Kendala Anda*\nAnda memilih: ${topic}\nSilakan ketik detail keluhan atau kirimkan screenshot.\n⚠️ Dilarang mengirim Password/OTP!`);
                } else {
                    await sendWhatsAppMessage(senderNumber, `⚠️ Pilihan tidak valid.`);
                }
                break;
            }
            case 'AWAITING_CAT_L3_SSO': {
                if (textLower === '0') {
                    await updateState('AWAITING_CAT_L2_APP');
                    await sendWhatsAppMessage(senderNumber, `📂 *Aplikasi*\n1. SSO\n2. Gentayu\n3. Mandala\n4. E-Office\n5. Lainnya\n0. Kembali`);
                } else if (textLower === '5') {
                    await updateState('AWAITING_CAT_L4_SIAP');
                    await sendWhatsAppMessage(senderNumber, `📂 *Aplikasi > SSO > SIAP*\n1. Perubahan Profil SIAP\n2. Perubahan Alamat SIAP\n0. Kembali`);
                } else if (['1','2','3','4'].includes(textLower)) {
                    const topics: any = { '1': 'Pembuatan Akun SSO', '2': 'Reset Akun SSO', '3': 'Perubahan Profil SSO', '4': 'Reset OTP' };
                    await updateState('AWAITING_COMPLAINT', { topic: `Aplikasi - SSO - ${topics[textLower]}` });
                    await sendWhatsAppMessage(senderNumber, `✍️ *Tulis Kendala Anda*\nSilakan ketik detail keluhan atau kirimkan screenshot.\n⚠️ Dilarang mengirim Password/OTP!`);
                } else {
                    await sendWhatsAppMessage(senderNumber, `⚠️ Pilihan tidak valid.`);
                }
                break;
            }
            case 'AWAITING_CAT_L4_SIAP': {
                if (textLower === '0') {
                    await updateState('AWAITING_CAT_L3_SSO');
                    await sendWhatsAppMessage(senderNumber, `📂 *Aplikasi > SSO*\n1. Pembuatan Akun\n2. Reset Akun\n3. Perubahan Profil\n4. Reset OTP\n5. SIAP\n0. Kembali`);
                } else if (['1','2'].includes(textLower)) {
                    const topic = textLower === '1' ? 'Aplikasi - SSO - SIAP - Perubahan Profil' : 'Aplikasi - SSO - SIAP - Perubahan Alamat';
                    await updateState('AWAITING_COMPLAINT', { topic });
                    await sendWhatsAppMessage(senderNumber, `✍️ *Tulis Kendala Anda*\nSilakan ketik detail keluhan atau kirimkan screenshot.\n⚠️ Dilarang mengirim Password/OTP!`);
                } else {
                    await sendWhatsAppMessage(senderNumber, `⚠️ Pilihan tidak valid.`);
                }
                break;
            }
            case 'AWAITING_CAT_L3_GENTAYU':
            case 'AWAITING_CAT_L2_WEB':
            case 'AWAITING_CAT_L2_NET':
            case 'AWAITING_CAT_L2_SEC': {
                if (textLower === '0') {
                    await updateState('AWAITING_CAT_L1'); // Simplified back
                    await sendWhatsAppMessage(senderNumber, `📌 *Kategori Layanan (Level 1)*\n1. Aplikasi\n2. Website dan Email\n3. Jaringan dan Internet\n4. Cyber Security\n0. Kembali`);
                } else {
                    // For the sake of this prototype logic, any valid number input captures a generic topic
                    let categoryMap: any = {
                        'AWAITING_CAT_L3_GENTAYU': { '1': 'Gentayu Pegawai', '2': 'Gentayu Mahasiswa' },
                        'AWAITING_CAT_L2_WEB': { '1': 'Domain', '2': 'Website', '3': 'Email', '4': 'Lisensi' },
                        'AWAITING_CAT_L2_NET': { '1': 'WiFi', '2': 'VPN', '3': 'VM' },
                        'AWAITING_CAT_L2_SEC': { '1': 'Backdoor', '2': 'Keamanan Sistem' },
                    };
                    const selected = categoryMap[session.step][textLower];
                    if (selected) {
                        await updateState('AWAITING_COMPLAINT', { topic: selected });
                        await sendWhatsAppMessage(senderNumber, `✍️ *Tulis Kendala Anda*\nAnda memilih: ${selected}\nSilakan ketik detail keluhan atau kirimkan screenshot.\n⚠️ Dilarang mengirim Password/OTP!`);
                    } else {
                        await sendWhatsAppMessage(senderNumber, `⚠️ Pilihan tidak valid.`);
                    }
                }
                break;
            }

            case 'AWAITING_COMPLAINT': {
                if (textLower === '0') {
                    await updateState('IDLE');
                    await sendWhatsAppMessage(senderNumber, `Kembali ke Menu Utama. Ketik HaloDesk.`);
                    break;
                }
                if (textLower.includes('password') || textLower.includes('otp') || textLower.includes('sandi')) {
                    await sendWhatsAppMessage(senderNumber, `🚨 *PERINGATAN KEAMANAN (SEC-07)*\nSistem mendeteksi adanya indikasi pengiriman password/OTP. Mohon ulangi penjelasan Anda TANPA menyertakan data sensitif tersebut!`);
                    break;
                }

                const fullText = messageText || '(Ada Lampiran)';
                let complaintSubject = 'Tanpa Subjek';
                let complaintDesc = fullText;

                // Split by newline to get subject and description
                if (fullText.includes('\n')) {
                    const lines = fullText.split('\n');
                    complaintSubject = lines[0].trim();
                    complaintDesc = lines.slice(1).join('\n').trim() || '(Tidak ada detail tambahan)';
                } else {
                    complaintSubject = fullText;
                }

                let uploadedAttachmentUrl = null;
                const imageMsg = msg?.message?.imageMessage;

                if (imageMsg) {
                    const mimeType = imageMsg.mimetype || 'image/jpeg';
                    const hdBase64 = await getDecryptedMediaBase64(msg);
                    if (hdBase64) uploadedAttachmentUrl = await uploadMediaToSupabase(hdBase64, mimeType, senderNumber);
                    else if (imageMsg.jpegThumbnail) uploadedAttachmentUrl = await uploadMediaToSupabase(imageMsg.jpegThumbnail, mimeType, senderNumber);
                }

                await updateState('AWAITING_CONFIRMATION', { subject: complaintSubject, complaint: complaintDesc, attachmentUrl: uploadedAttachmentUrl });
                const { name, nim, faculty, topic } = session.temp_data;
                await sendWhatsAppMessage(senderNumber, `📋 *RINGKASAN TIKET*\n👤 Nama: ${name}\n🏢 Unit: ${faculty}\n📌 Kategori: ${topic}\n🏷️ Subjek: ${complaintSubject}\n📝 Keluhan: ${complaintDesc}\n📎 Lampiran: ${uploadedAttachmentUrl ? 'Tersimpan' : '-'}\n\n1. KIRIM\n2. BATAL`);
                break;
            }

            case 'AWAITING_CONFIRMATION': {
                if (textLower === '1') {
                    const { name, nim, faculty, topic, subject, complaint, attachmentUrl } = session.temp_data;
                    const ticketNumber = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;

                    const { data: savedUser } = await supabaseService.from('users').upsert({
                        phone_number: senderNumber, name, identity_number: nim, faculty_unit: faculty, role: 'PELAPOR'
                    }, { onConflict: 'phone_number' }).select().single();

                    const categoryId = await getOrCreateCategory(topic);

                    const { error } = await supabaseService.from('tickets').insert([{
                        ticket_number: ticketNumber,
                        reporter_id: savedUser?.id,
                        category_id: categoryId,
                        subject: subject,
                        description: complaint,
                        attachment_url: attachmentUrl,
                        status: 'Open'
                    }]);

                    if (error) {
                        await sendWhatsAppMessage(senderNumber, `❌ Gagal menyimpan tiket.`);
                    } else {
                        await updateState('IDLE');
                        await sendWhatsAppMessage(senderNumber, `✅ *Tiket Berhasil Dibuat!*\nNomor Tiket Anda: *${ticketNumber}*\n\nTim Helpdesk akan segera memverifikasi laporan Anda. Gunakan menu 2 untuk mengecek status.`);
                    }
                } else if (textLower === '2' || textLower === '0') {
                    await updateState('IDLE');
                    await sendWhatsAppMessage(senderNumber, `❌ Pembuatan tiket dibatalkan. Ketik *HaloDesk* untuk menu utama.`);
                }
                break;
            }

            // --- ALUR 2: CEK STATUS ---
            case 'AWAITING_CEK_STATUS': {
                if (textLower === '0') {
                    await updateState('IDLE');
                    await sendWhatsAppMessage(senderNumber, `Kembali ke Menu Utama. Ketik HaloDesk.`);
                    break;
                }
                const ticketNum = messageText.toUpperCase();
                const { data: ticket } = await supabaseService.from('tickets').select('*, categories(name), users!tickets_technician_id_fkey(name)').eq('ticket_number', ticketNum).maybeSingle();
                
                if (ticket) {
                    const techName = ticket.users?.name || 'Belum ditugaskan';
                    await sendWhatsAppMessage(senderNumber, `🔍 *Status Tiket: ${ticketNum}*\nStatus: *${ticket.status}*\nPrioritas: ${ticket.priority || '-'}\nKategori: ${ticket.categories?.name || '-'}\nTeknisi: ${techName}\nDiupdate: ${new Date(ticket.resolved_at || ticket.created_at).toLocaleString('id-ID')}\n\n0. Kembali`);
                } else {
                    await sendWhatsAppMessage(senderNumber, `⚠️ Tiket tidak ditemukan. Pastikan format benar (contoh: TKT-1234).\n0. Kembali`);
                }
                break;
            }

            // --- ALUR 3: TAMBAH INFO ---
            case 'AWAITING_TAMBAH_INFO_NO': {
                if (textLower === '0') {
                    await updateState('IDLE');
                    await sendWhatsAppMessage(senderNumber, `Kembali ke Menu Utama. Ketik HaloDesk.`);
                    break;
                }
                const ticketNum = messageText.toUpperCase();
                const { data: ticket } = await supabaseService.from('tickets').select('id, status').eq('ticket_number', ticketNum).maybeSingle();
                if (!ticket) {
                    await sendWhatsAppMessage(senderNumber, `⚠️ Tiket tidak ditemukan.\n0. Kembali`);
                } else if (ticket.status === 'Selesai/Close') {
                    await sendWhatsAppMessage(senderNumber, `⚠️ Tiket ini sudah ditutup dan tidak dapat ditambah informasinya.\n0. Kembali`);
                } else {
                    await updateState('AWAITING_TAMBAH_INFO_MSG', { ticket_id: ticket.id, ticketNum });
                    await sendWhatsAppMessage(senderNumber, `➕ *Tiket Ditemukan*\nSilakan kirimkan informasi tambahan atau lampiran untuk tiket *${ticketNum}*.\n0. Batal`);
                }
                break;
            }
            case 'AWAITING_TAMBAH_INFO_MSG': {
                if (textLower === '0') {
                    await updateState('IDLE');
                    await sendWhatsAppMessage(senderNumber, `Batal tambah info.`);
                    break;
                }
                const { ticket_id, ticketNum } = session.temp_data;
                const appendText = `\n\n[INFO TAMBAHAN]: ${messageText}`;
                
                // Coba gunakan RPC jika ada
                const { error: rpcError } = await supabaseService.rpc('append_ticket_description', { t_id: ticket_id, add_text: appendText });
                
                // Fallback manual jika RPC gagal/tidak ditemukan
                if (rpcError) {
                    const { data: oldT } = await supabaseService.from('tickets').select('description').eq('id', ticket_id).maybeSingle();
                    if (oldT) {
                        await supabaseService.from('tickets').update({ description: (oldT.description || '') + appendText }).eq('id', ticket_id);
                    }
                }
                
                await updateState('IDLE');
                await sendWhatsAppMessage(senderNumber, `✅ Informasi berhasil ditambahkan ke tiket *${ticketNum}*. Operator/Teknisi akan segera mengeceknya.`);
                break;
            }

            // --- ALUR 4: FAQ ---
            case 'AWAITING_FAQ_L1': {
                if (textLower === '0') {
                    await updateState('IDLE');
                    await sendWhatsAppMessage(senderNumber, `Kembali ke Menu Utama.`);
                } else if (['1','2','3','4'].includes(textLower)) {
                    await updateState('IDLE');
                    await sendWhatsAppMessage(senderNumber, `📚 *Panduan Anda*\nSilakan kunjungi portal panduan kami di:\nhttps://helpdesk.undip.ac.id/faq\n\nKetik HaloDesk untuk kembali.`);
                } else {
                    await sendWhatsAppMessage(senderNumber, `⚠️ Pilihan tidak valid.`);
                }
                break;
            }

            // --- ALUR 6: SURVEI ---
            case 'AWAITING_SURVEY_RATING': {
                if (textLower === '0') {
                    await updateState('IDLE');
                    await sendWhatsAppMessage(senderNumber, `Kembali ke Menu Utama.`);
                } else if (['1','2','3','4','5'].includes(textLower)) {
                    await updateState('AWAITING_SURVEY_SARAN', { rating: textLower });
                    await sendWhatsAppMessage(senderNumber, `Terima kasih! Anda memberi rating ⭐ ${textLower}.\nSilakan ketik saran/masukan Anda untuk layanan kami.\n0. Lewati`);
                } else {
                    await sendWhatsAppMessage(senderNumber, `⚠️ Masukkan angka 1 sampai 5.`);
                }
                break;
            }
            case 'AWAITING_SURVEY_SARAN': {
                await updateState('IDLE');
                await sendWhatsAppMessage(senderNumber, `✅ *Terima kasih!* Survei Anda telah disimpan. Masukan Anda sangat berarti bagi peningkatan layanan kami.\n\nKetik HaloDesk untuk kembali.`);
                break;
            }

            default:
                await sendWhatsAppMessage(senderNumber, `⚠️ Sesi tidak valid. Ketik *HaloDesk* untuk reset.`);
                break;
        }

        return NextResponse.json({ status: 'success' });
    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}