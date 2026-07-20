import { NextResponse } from 'next/server';
import { supabaseService } from '@/src/lib/supabase/service';
import { sendTicketNotification } from '@/src/lib/services/notification';
import { createTicketLog } from '@/src/lib/logger';

// --- UTILS ---
async function sendWhatsAppMessage(to: string, text: string) {
    let status = 'SUCCESS';
    let errorMessage = null;

    if (process.env.NEXT_PUBLIC_USE_SIMULATOR === 'true') {
        await supabaseService.from('mock_wa_messages').insert({
            phone_number: to,
            message: text,
            direction: 'out'
        });
        // Log to webhook_logs for simulator
        await supabaseService.from('webhook_logs').insert({
            direction: 'OUTGOING',
            phone_number: to,
            payload: text,
            status: 'SUCCESS'
        });
        return; // Bypass WASender
    }

    const url = 'https://www.wasenderapi.com/api/send-message';
    const token = process.env.WASENDER_BEARER_TOKEN;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ to, text }),
        });
        if (!res.ok) {
            status = 'FAILED';
            errorMessage = await res.text();
        }
    } catch (e: any) {
        status = 'FAILED';
        errorMessage = e.message;
        console.error(e);
    }

    // Insert Log
    await supabaseService.from('webhook_logs').insert({
        direction: 'OUTGOING',
        phone_number: to,
        payload: text,
        status: status,
        error_message: errorMessage
    });
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

async function extractAttachment(msg: any, senderNumber: string) {
    let uploadedAttachmentUrl = null;
    let fileName = null;
    let mimeType = null;

    const imageMsg = msg?.message?.imageMessage;
    const docMsg = msg?.message?.documentMessage;

    if (imageMsg) {
        mimeType = imageMsg.mimetype || 'image/jpeg';
        fileName = `image-${Date.now()}.jpg`;
        const hdBase64 = await getDecryptedMediaBase64(msg);
        if (hdBase64) {
            uploadedAttachmentUrl = await uploadMediaToSupabase(hdBase64, mimeType, senderNumber);
        } else if (imageMsg.jpegThumbnail) {
            uploadedAttachmentUrl = await uploadMediaToSupabase(imageMsg.jpegThumbnail, mimeType, senderNumber);
        }
    } else if (docMsg) {
        mimeType = docMsg.mimetype || 'application/pdf';
        fileName = docMsg.fileName || `document-${Date.now()}.pdf`;
        const hdBase64 = await getDecryptedMediaBase64(msg);
        if (hdBase64) {
            uploadedAttachmentUrl = await uploadMediaToSupabase(hdBase64, mimeType, senderNumber);
        }
    }
    
    if (uploadedAttachmentUrl) {
        return { file_url: uploadedAttachmentUrl, file_name: fileName, mime_type: mimeType, file_size: 0 };
    }
    return null;
}

// --- WEBHOOK MAIN ROUTE ---
export async function POST(request: Request) {
    try {
        const signature = request.headers.get('x-webhook-signature');
        if (signature !== process.env.WASENDER_WEBHOOK_SECRET && process.env.NEXT_PUBLIC_USE_SIMULATOR !== 'true') {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const body = await request.json();
        if (body.event !== 'messages.received') return NextResponse.json({ status: 'ignored' });

        const msg = body.data?.messages;
        const messageText = typeof msg?.messageBody === 'string' ? msg.messageBody.trim() : '';
        const senderNumber = msg?.key?.cleanedSenderPn ?? msg?.key?.cleanedParticipantPn;

        if (!messageText || !senderNumber) return NextResponse.json({ status: 'ignored' });
        const textLower = messageText.toLowerCase();

        // LOG INCOMING WEBHOOK
        await supabaseService.from('webhook_logs').insert({
            direction: 'INCOMING',
            phone_number: senderNumber,
            payload: messageText,
            status: 'SUCCESS'
        });

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
                    const { data: rootCategories } = await supabaseService.from('faq_categories')
                        .select('*')
                        .is('parent_id', null)
                        .eq('is_active', true)
                        .order('sort_order', { ascending: true });

                    let msg = `💡 *FAQ & Panduan*\nPilih topik:\n`;
                    const options: any = {};
                    if (rootCategories) {
                        rootCategories.forEach((cat, index) => {
                            msg += `${index + 1}. ${cat.name}\n`;
                            options[(index + 1).toString()] = { id: cat.id, name: cat.name, type: 'category' };
                        });
                    }
                    msg += `\n0. Kembali`;

                    await updateState('AWAITING_FAQ_CATEGORY', { 
                        faq_options: options,
                        faq_stack: [{ parent_id: null, name: 'FAQ & Panduan' }]
                    });
                    await sendWhatsAppMessage(senderNumber, msg);
                } else if (textLower === '5') {
                    await sendWhatsAppMessage(senderNumber, `📞 *Hubungi Petugas*\nLokasi: Gedung DSTI Universitas Diponegoro\nJam Operasional: Senin - Jumat (08.00 - 16.00)\nTelepon: (024) 1234567\n\n_Ketik HaloDesk untuk menu utama._`);
                } else if (textLower === '0') {
                    await sendWhatsAppMessage(senderNumber, `👋 Terima kasih telah menghubungi Helpdesk IT UNDIP. Sesi diakhiri.`);
                } else {
                    let { data: configData } = await supabaseService.from('system_configs').select('value').eq('key', 'bot_welcome_message').maybeSingle();
                    const welcomeMsg = configData?.value || `🤖 *Halo! Pusat Bantuan IT Universitas Diponegoro.*\nSilakan balas dengan *angka*:\n*1.* 📝 Buat Tiket\n*2.* 🔍 Cek Status\n*3.* ➕ Tambah Info\n*4.* 📚 FAQ & Panduan\n*5.* 📞 Hubungi Petugas\n*0.* ❌ Akhiri\n\n⚠️ Jangan pernah mengirimkan Password / OTP!`;
                    await sendWhatsAppMessage(senderNumber, welcomeMsg);
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
                const { data: rootCategories } = await supabaseService.from('categories')
                    .select('*')
                    .is('parent_id', null)
                    .eq('is_active', true)
                    .order('sort_order', { ascending: true });

                let msg = `📌 *Kategori Layanan*\n`;
                const options: any = {};
                if (rootCategories) {
                    rootCategories.forEach((cat, index) => {
                        msg += `${index + 1}. ${cat.name}\n`;
                        options[(index + 1).toString()] = { id: cat.id, name: cat.name };
                    });
                }
                msg += `0. Kembali`;

                await updateState('AWAITING_CATEGORY', { 
                    name: parts[0], nim: parts[1], faculty: parts[2],
                    category_options: options,
                    category_path: '',
                    category_stack: [{ parent_id: null, name: 'Kategori Layanan' }]
                });
                await sendWhatsAppMessage(senderNumber, msg);
                break;
            }
            case 'AWAITING_CATEGORY': {
                let stack = session.temp_data.category_stack || [{ parent_id: null, name: 'Kategori Layanan' }];

                if (textLower === '0') {
                    if (stack.length > 1) {
                        stack.pop(); // remove current level
                        const previous = stack[stack.length - 1];
                        
                        let query = supabaseService.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true });
                        if (previous.parent_id === null) {
                            query = query.is('parent_id', null);
                        } else {
                            query = query.eq('parent_id', previous.parent_id);
                        }
                        
                        const { data: prevCategories } = await query;
                        
                        let msg = previous.parent_id === null ? `📌 *Kategori Layanan*\n` : `📌 *Sub Kategori - ${previous.name}*\n`;
                        const newOptions: any = {};
                        if (prevCategories) {
                            prevCategories.forEach((cat, index) => {
                                msg += `${index + 1}. ${cat.name}\n`;
                                newOptions[(index + 1).toString()] = { id: cat.id, name: cat.name };
                            });
                        }
                        msg += `0. Kembali`;
                        
                        let pathParts = session.temp_data.category_path ? session.temp_data.category_path.split(' / ') : [];
                        if (pathParts.length > 0) pathParts.pop();
                        const newPath = pathParts.join(' / ');
                        
                        await updateState('AWAITING_CATEGORY', {
                            ...session.temp_data,
                            category_options: newOptions,
                            category_stack: stack,
                            category_path: newPath
                        });
                        await sendWhatsAppMessage(senderNumber, msg);
                        break;
                    } else {
                        await updateState('IDLE');
                        await sendWhatsAppMessage(senderNumber, `Kembali ke Menu Utama. Ketik HaloDesk.`);
                        break;
                    }
                }

                const options = session.temp_data.category_options || {};
                const selected = options[textLower];

                if (!selected) {
                    await sendWhatsAppMessage(senderNumber, `⚠️ Pilihan tidak valid.`);
                    break;
                }

                // Check for children
                const { data: childCategories } = await supabaseService.from('categories')
                    .select('*')
                    .eq('parent_id', selected.id)
                    .eq('is_active', true)
                    .order('sort_order', { ascending: true });

                const newPath = session.temp_data.category_path ? `${session.temp_data.category_path} / ${selected.name}` : selected.name;

                if (childCategories && childCategories.length > 0) {
                    let msg = `📌 *Sub Kategori - ${selected.name}*\n`;
                    const newOptions: any = {};
                    childCategories.forEach((cat, index) => {
                        msg += `${index + 1}. ${cat.name}\n`;
                        newOptions[(index + 1).toString()] = { id: cat.id, name: cat.name };
                    });
                    msg += `0. Kembali`;

                    stack.push({ parent_id: selected.id, name: selected.name });

                    await updateState('AWAITING_CATEGORY', { 
                        ...session.temp_data,
                        category_options: newOptions,
                        category_path: newPath,
                        category_stack: stack
                    });
                    await sendWhatsAppMessage(senderNumber, msg);
                } else {
                    await updateState('AWAITING_COMPLAINT', { 
                        ...session.temp_data, 
                        topic: newPath,
                        category_id: selected.id
                    });
                    await sendWhatsAppMessage(senderNumber, `✍️ *Tulis Kendala Anda*\nAnda memilih: ${newPath}\nSilakan ketik detail keluhan atau kirimkan screenshot dengan format:\n\n*Subject*\n\n*Detail Kendala*`);
                }
                break;
            }

            case 'AWAITING_COMPLAINT': {
                if (textLower === '0') {
                    await updateState('IDLE');
                    await sendWhatsAppMessage(senderNumber, `Kembali ke Menu Utama. Ketik HaloDesk.`);
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

                const newAttachment = await extractAttachment(msg, senderNumber);
                const currentAttachments = session.temp_data.attachments || [];
                if (newAttachment) {
                    currentAttachments.push(newAttachment);
                }

                // If user only sent an image without text (caption empty), WhatsApp text might be empty.
                // We'll proceed to AWAITING_ATTACHMENT.
                if (newAttachment || fullText !== '(Ada Lampiran)') {
                    await updateState('AWAITING_ATTACHMENT', { 
                        ...session.temp_data,
                        subject: complaintSubject !== '(Ada Lampiran)' ? complaintSubject : session.temp_data.subject || 'Tanpa Subjek', 
                        complaint: complaintDesc !== '(Ada Lampiran)' ? complaintDesc : session.temp_data.complaint || '', 
                        attachments: currentAttachments
                    });
                    await sendWhatsAppMessage(senderNumber, `Keluhan diterima. ${currentAttachments.length > 0 ? `\n\n(${currentAttachments.length} lampiran tersimpan)` : ''}\n\nApakah ada tambahan lampiran (Gambar/PDF)?\nJika ada, silakan kirimkan sekarang.\nJika sudah selesai, balas *1* untuk Kirim Tiket.\nBalas *0* untuk Batal.`);
                } else {
                    await sendWhatsAppMessage(senderNumber, `⚠️ Format pesan tidak dikenali. Silakan ketik keluhan Anda atau kirim lampiran.`);
                }
                break;
            }

            case 'AWAITING_ATTACHMENT': {
                if (textLower === '0') {
                    await updateState('IDLE');
                    await sendWhatsAppMessage(senderNumber, `Kembali ke Menu Utama. Ketik HaloDesk.`);
                    break;
                }

                if (textLower === '1') {
                    // Cek FAQ Recommendation dlu sebelum konfirmasi
                    const { subject, complaint, attachments } = session.temp_data;
                    const { data: recommendedFaqs } = await supabaseService.from('faqs')
                        .select('*')
                        .eq('is_active', true)
                        .or(`title.ilike.%${subject}%,keywords.ilike.%${subject}%`)
                        .limit(3);

                    if (recommendedFaqs && recommendedFaqs.length > 0) {
                        let msg = `--------------------------------\nKami menemukan panduan yang mungkin membantu:\n\n`;
                        const options: any = {};
                        recommendedFaqs.forEach((faq, index) => {
                            msg += `${index + 1}. ${faq.title}\n`;
                            options[(index + 1).toString()] = { id: faq.id, title: faq.title, content: faq.content, url: faq.url };
                        });
                        const lastIdx = recommendedFaqs.length + 1;
                        msg += `${lastIdx}. Tetap Buat Ticket\n--------------------------------`;
                        options[lastIdx.toString()] = { action: 'continue_ticket' };

                        await updateState('AWAITING_FAQ_RECOMMENDATION', {
                            ...session.temp_data,
                            recommendation_options: options
                        });
                        await sendWhatsAppMessage(senderNumber, msg);
                    } else {
                        // Langsung konfirmasi
                        await updateState('AWAITING_CONFIRMATION', { ...session.temp_data });
                        const { name, nim, faculty, topic } = session.temp_data;
                        await sendWhatsAppMessage(senderNumber, `📋 *RINGKASAN TIKET*\n👤 Nama: ${name}\n🏢 Unit: ${faculty}\n📌 Kategori: ${topic}\n🏷️ Subjek: ${subject}\n📝 Keluhan: ${complaint}\n📎 Lampiran: ${attachments?.length || 0} file\n\n1. KIRIM\n2. BATAL`);
                    }
                    break;
                }

                // Terus tampung lampiran
                const newAttachment = await extractAttachment(msg, senderNumber);
                if (newAttachment) {
                    const currentAttachments = session.temp_data.attachments || [];
                    currentAttachments.push(newAttachment);
                    await updateState('AWAITING_ATTACHMENT', { ...session.temp_data, attachments: currentAttachments });
                    await sendWhatsAppMessage(senderNumber, `✅ ${currentAttachments.length} lampiran berhasil diterima.\n\nKirim lampiran lagi, atau balas *1* untuk Kirim Tiket.\nBalas *0* untuk Batal.`);
                } else {
                    await sendWhatsAppMessage(senderNumber, `⚠️ File tidak didukung. Harap kirimkan Gambar atau PDF.\nBalas *1* untuk Kirim Tiket.`);
                }
                break;
            }

            case 'AWAITING_FAQ_RECOMMENDATION': {
                const options = session.temp_data.recommendation_options || {};
                const selected = options[textLower];

                if (!selected) {
                    await sendWhatsAppMessage(senderNumber, `⚠️ Pilihan tidak valid.`);
                    break;
                }

                if (selected.action === 'continue_ticket') {
                    await updateState('AWAITING_CONFIRMATION', { ...session.temp_data });
                    const { name, faculty, topic, subject, complaint, attachments } = session.temp_data;
                    await sendWhatsAppMessage(senderNumber, `📋 *RINGKASAN TIKET*\n👤 Nama: ${name}\n🏢 Unit: ${faculty}\n📌 Kategori: ${topic}\n🏷️ Subjek: ${subject}\n📝 Keluhan: ${complaint}\n📎 Lampiran: ${attachments?.length || 0} file\n\n1. KIRIM\n2. BATAL`);
                } else {
                    let msg = `📖 *${selected.title}*\n\n${selected.content}`;
                    if (selected.url) msg += `\n\nLink referensi: ${selected.url}`;
                    msg += `\n\n--------------------------------\nApakah masalah sudah selesai?\n1. Ya\n2. Belum`;
                    
                    await updateState('AWAITING_FAQ_RECOMMENDATION_CONFIRM', { ...session.temp_data });
                    await sendWhatsAppMessage(senderNumber, msg);
                }
                break;
            }

            case 'AWAITING_FAQ_RECOMMENDATION_CONFIRM': {
                if (textLower === '1') {
                    await updateState('IDLE');
                    await sendWhatsAppMessage(senderNumber, `✅ Selesai. Tiket dibatalkan karena masalah sudah teratasi oleh FAQ. Terima kasih!`);
                } else if (textLower === '2') {
                    await updateState('AWAITING_CONFIRMATION', { ...session.temp_data });
                    const { name, faculty, topic, subject, complaint, attachments } = session.temp_data;
                    await sendWhatsAppMessage(senderNumber, `📋 *RINGKASAN TIKET*\n👤 Nama: ${name}\n🏢 Unit: ${faculty}\n📌 Kategori: ${topic}\n🏷️ Subjek: ${subject}\n📝 Keluhan: ${complaint}\n📎 Lampiran: ${attachments?.length || 0} file\n\n1. KIRIM\n2. BATAL`);
                } else {
                    await sendWhatsAppMessage(senderNumber, `⚠️ Pilihan tidak valid. 1. Ya 2. Belum`);
                }
                break;
            }

            case 'AWAITING_CONFIRMATION': {
                if (textLower === '1') {
                    const { name, nim, faculty, topic, subject, complaint, attachments, category_id } = session.temp_data;

                    // 2. Insert User (Upsert)
                    const { data: user, error: userError } = await supabaseService.from('users').upsert({
                        phone_number: senderNumber,
                        name: name,
                        identity_number: nim,
                        faculty_unit: faculty,
                        role: 'PELAPOR'
                    }, { onConflict: 'phone_number' }).select().single();

                    if (userError) {
                        console.error("User insert error:", userError);
                        await sendWhatsAppMessage(senderNumber, `⚠️ Maaf, terjadi kesalahan sistem saat mendaftarkan data Anda.`);
                        break;
                    }

                    // 3. Insert Ticket using category_id instead of string matching
                    const { data: ticket, error: ticketError } = await supabaseService.from('tickets').insert({
                        reporter_id: user.id,
                        category_id: category_id,
                        subject: subject,
                        description: complaint,
                        status: 'Open',
                        attachment_url: attachments && attachments.length > 0 ? attachments[0].file_url : null // Backward compatibility
                    }).select().single();

                    if (ticketError) {
                        console.error("Ticket insert error:", ticketError);
                        await sendWhatsAppMessage(senderNumber, `❌ Gagal menyimpan tiket.`);
                    } else {
                        // 4. Insert first message to ticket_messages
                        const { data: firstMessage, error: msgError } = await supabaseService.from('ticket_messages').insert({
                            ticket_id: ticket.id,
                            sender_type: 'USER',
                            sender_id: user.id,
                            message: complaint,
                            attachment_url: attachments && attachments.length > 0 ? attachments[0].file_url : null,
                            is_internal: false
                        }).select().single();

                        if (!msgError && firstMessage && attachments && attachments.length > 0) {
                            // Insert to ticket_attachments
                            const attachmentsToInsert = attachments.map((att: any) => ({
                                ticket_message_id: firstMessage.id,
                                file_name: att.file_name,
                                file_url: att.file_url,
                                mime_type: att.mime_type,
                                file_size: att.file_size,
                                uploaded_by: user.id
                            }));
                            await supabaseService.from('ticket_attachments').insert(attachmentsToInsert);
                        }

                        // 5. Audit Log (Ticket Created)
                        await createTicketLog(supabaseService, {
                            ticket_id: ticket.id,
                            user_id: user.id,
                            user_name: name,
                            role: 'USER',
                            action: 'CREATE_TICKET',
                            description: 'Tiket berhasil dibuat melalui WhatsApp',
                        });

                        await updateState('IDLE');
                        await sendTicketNotification(ticket.ticket_number, 'Open', senderNumber);
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
                const fullText = messageText || '(Ada Lampiran)';

                const newAttachment = await extractAttachment(msg, senderNumber);
                const currentAttachments = session.temp_data.attachments || [];
                if (newAttachment) {
                    currentAttachments.push(newAttachment);
                }

                if (newAttachment || fullText !== '(Ada Lampiran)') {
                    await updateState('AWAITING_TAMBAH_INFO_ATTACHMENT', {
                        ...session.temp_data,
                        tambah_info_msg: fullText !== '(Ada Lampiran)' ? fullText : session.temp_data.tambah_info_msg || '',
                        attachments: currentAttachments
                    });
                    await sendWhatsAppMessage(senderNumber, `Info diterima. ${currentAttachments.length > 0 ? `(${currentAttachments.length} lampiran tersimpan)` : ''}\n\nApakah ada tambahan lampiran (Gambar/PDF)?\nJika ada, silakan kirimkan sekarang.\nBalas *1* untuk Kirim Info.\nBalas *0* untuk Batal.`);
                } else {
                    await sendWhatsAppMessage(senderNumber, `⚠️ Format pesan tidak dikenali.`);
                }
                break;
            }

            case 'AWAITING_TAMBAH_INFO_ATTACHMENT': {
                if (textLower === '0') {
                    await updateState('IDLE');
                    await sendWhatsAppMessage(senderNumber, `Batal tambah info.`);
                    break;
                }

                if (textLower === '1') {
                    const { ticket_id, ticketNum, tambah_info_msg, attachments } = session.temp_data;
                    
                    // Cek user pengirim (pelapor)
                    const { data: user } = await supabaseService.from('users').select('id').eq('phone_number', senderNumber).maybeSingle();

                    // Simpan pesan
                    const { data: newMessage, error: msgError } = await supabaseService.from('ticket_messages').insert({
                        ticket_id: ticket_id,
                        sender_type: 'USER',
                        sender_id: user?.id || null,
                        message: tambah_info_msg || '(Mengirim Lampiran)',
                        attachment_url: attachments && attachments.length > 0 ? attachments[0].file_url : null,
                        is_internal: false
                    }).select().single();

                    if (!msgError && newMessage && attachments && attachments.length > 0) {
                        const attachmentsToInsert = attachments.map((att: any) => ({
                            ticket_message_id: newMessage.id,
                            file_name: att.file_name,
                            file_url: att.file_url,
                            mime_type: att.mime_type,
                            file_size: att.file_size,
                            uploaded_by: user?.id || null
                        }));
                        await supabaseService.from('ticket_attachments').insert(attachmentsToInsert);
                    }

                    await createTicketLog(supabaseService, {
                        ticket_id: ticket_id,
                        user_id: user?.id,
                        role: 'USER',
                        action: 'REPLY_TICKET',
                        description: `Pelapor menambahkan informasi baru (${attachments?.length || 0} lampiran).`,
                    });
                    
                    await updateState('IDLE');
                    await sendWhatsAppMessage(senderNumber, `✅ Informasi berhasil ditambahkan ke tiket *${ticketNum}*. Operator/Teknisi akan segera mengeceknya.`);
                    break;
                }

                const newAttachment = await extractAttachment(msg, senderNumber);
                if (newAttachment) {
                    const currentAttachments = session.temp_data.attachments || [];
                    currentAttachments.push(newAttachment);
                    await updateState('AWAITING_TAMBAH_INFO_ATTACHMENT', { ...session.temp_data, attachments: currentAttachments });
                    await sendWhatsAppMessage(senderNumber, `✅ ${currentAttachments.length} lampiran berhasil diterima.\n\nKirim lampiran lagi, atau balas *1* untuk Kirim Info.\nBalas *0* untuk Batal.`);
                } else {
                    await sendWhatsAppMessage(senderNumber, `⚠️ File tidak didukung. Harap kirimkan Gambar atau PDF.\nBalas *1* untuk Kirim Info.`);
                }
                break;
            }

            // --- ALUR 4: FAQ ---
            case 'AWAITING_FAQ_CATEGORY': {
                let stack = session.temp_data.faq_stack || [{ parent_id: null, name: 'FAQ & Panduan' }];

                if (textLower === '0') {
                    if (stack.length > 1) {
                        stack.pop(); // remove current level
                        const previous = stack[stack.length - 1];
                        
                        let query = supabaseService.from('faq_categories').select('*').eq('is_active', true).order('sort_order', { ascending: true });
                        if (previous.parent_id === null) {
                            query = query.is('parent_id', null);
                        } else {
                            query = query.eq('parent_id', previous.parent_id);
                        }
                        
                        const { data: prevCategories } = await query;
                        
                        let msg = previous.parent_id === null ? `💡 *FAQ & Panduan*\nPilih topik:\n` : `📚 *FAQ - ${previous.name}*\n`;
                        const newOptions: any = {};
                        if (prevCategories) {
                            prevCategories.forEach((cat, index) => {
                                msg += `${index + 1}. ${cat.name}\n`;
                                newOptions[(index + 1).toString()] = { id: cat.id, name: cat.name, type: 'category' };
                            });
                        }
                        
                        // If returning to a category that might also have FAQs (not just subcategories)
                        // Actually, to keep it simple, we only fetch FAQs if no subcategories exist (or we just list both).
                        // Let's assume if it has subcategories, we don't list FAQs, or we just list FAQs after categories.
                        if (previous.parent_id !== null) {
                            const { data: faqs } = await supabaseService.from('faqs').select('*').eq('category_id', previous.parent_id).eq('is_active', true).order('sort_order', { ascending: true });
                            if (faqs && faqs.length > 0) {
                                let offset = prevCategories ? prevCategories.length : 0;
                                faqs.forEach((faq, idx) => {
                                    msg += `${offset + idx + 1}. [FAQ] ${faq.title}\n`;
                                    newOptions[(offset + idx + 1).toString()] = { id: faq.id, name: faq.title, type: 'faq', content: faq.content, url: faq.url };
                                });
                            }
                        }

                        msg += `\n0. Kembali`;
                        
                        await updateState('AWAITING_FAQ_CATEGORY', {
                            ...session.temp_data,
                            faq_options: newOptions,
                            faq_stack: stack
                        });
                        await sendWhatsAppMessage(senderNumber, msg);
                        break;
                    } else {
                        await updateState('IDLE');
                        await sendWhatsAppMessage(senderNumber, `Kembali ke Menu Utama. Ketik HaloDesk.`);
                        break;
                    }
                }

                const options = session.temp_data.faq_options || {};
                const selected = options[textLower];

                if (!selected) {
                    await sendWhatsAppMessage(senderNumber, `⚠️ Pilihan tidak valid.`);
                    break;
                }

                if (selected.type === 'faq') {
                    let msg = `📖 *${selected.name}*\n\n${selected.content}`;
                    if (selected.url) msg += `\n\nLink referensi: ${selected.url}`;
                    msg += `\n\n0. Kembali`;
                    
                    // We don't push to stack for FAQ reading, just stay in AWAITING_FAQ_CATEGORY
                    // But we need a dummy option for "0" to go back without reading FAQ options again.
                    // Actually, if we just push the FAQ as a pseudo-level:
                    stack.push({ parent_id: 'FAQ_ITEM', name: selected.name });
                    await updateState('AWAITING_FAQ_CATEGORY', {
                        ...session.temp_data,
                        faq_options: {}, // Only 0 is valid
                        faq_stack: stack
                    });
                    await sendWhatsAppMessage(senderNumber, msg);
                } else if (selected.type === 'category') {
                    // Check for subcategories
                    const { data: childCategories } = await supabaseService.from('faq_categories')
                        .select('*')
                        .eq('parent_id', selected.id)
                        .eq('is_active', true)
                        .order('sort_order', { ascending: true });
                        
                    const { data: faqs } = await supabaseService.from('faqs')
                        .select('*')
                        .eq('category_id', selected.id)
                        .eq('is_active', true)
                        .order('sort_order', { ascending: true });

                    let msg = `📚 *FAQ - ${selected.name}*\n\n`;
                    const newOptions: any = {};
                    let optionIdx = 1;
                    
                    if (childCategories && childCategories.length > 0) {
                        childCategories.forEach((cat) => {
                            msg += `${optionIdx}. ${cat.name}\n`;
                            newOptions[optionIdx.toString()] = { id: cat.id, name: cat.name, type: 'category' };
                            optionIdx++;
                        });
                    }
                    
                    if (faqs && faqs.length > 0) {
                        faqs.forEach((faq) => {
                            msg += `${optionIdx}. [FAQ] ${faq.title}\n`;
                            newOptions[optionIdx.toString()] = { id: faq.id, name: faq.title, type: 'faq', content: faq.content, url: faq.url };
                            optionIdx++;
                        });
                    }

                    if (optionIdx === 1) {
                        msg += `_Kategori ini masih kosong._\n`;
                    }
                    
                    msg += `\n0. Kembali`;

                    stack.push({ parent_id: selected.id, name: selected.name });

                    await updateState('AWAITING_FAQ_CATEGORY', { 
                        ...session.temp_data,
                        faq_options: newOptions,
                        faq_stack: stack
                    });
                    await sendWhatsAppMessage(senderNumber, msg);
                }
                break;
            }

            // --- ALUR 6: SURVEI & RESOLVED ---
            case 'AWAITING_TICKET_RESOLVED_CONFIRMATION': {
                if (textLower === '1') {
                    await updateState('AWAITING_SURVEY_RATING', { ...session.temp_data });
                    await sendWhatsAppMessage(senderNumber, `📊 *Survei Kepuasan*\nBerapa bintang yang Anda berikan untuk layanan kami dalam menangani tiket ini? (1-5)\n\n1 = Sangat Buruk\n5 = Sangat Baik\n\n0. Lewati`);
                } else if (textLower === '2') {
                    // Kembalikan tiket ke Diproses
                    const ticketId = session.temp_data.ticket_id;
                    const ticketNum = session.temp_data.ticket_number;
                    await supabaseService.from('tickets').update({ status: 'Diproses' }).eq('id', ticketId);
                    
                    await supabaseService.from('ticket_messages').insert({
                        ticket_id: ticketId,
                        sender_type: 'USER',
                        sender_id: null,
                        message: `[KENDALA BELUM SELESAI] Pelapor menyatakan kendala belum terselesaikan. Tiket dikembalikan ke status Diproses.`,
                        is_internal: false
                    });

                    await updateState('IDLE');
                    await sendTicketNotification(ticketNum, 'Dibuka Kembali/Reopen', senderNumber);
                } else {
                    await sendWhatsAppMessage(senderNumber, `⚠️ Pilihan tidak valid. Ketik 1 untuk Ya, 2 untuk Belum.`);
                }
                break;
            }

            case 'AWAITING_SURVEY_RATING': {
                if (textLower === '0') {
                    await updateState('IDLE');
                    await sendWhatsAppMessage(senderNumber, `Terima kasih! Sesi diakhiri.`);
                } else if (['1','2','3','4','5'].includes(textLower)) {
                    await updateState('AWAITING_SURVEY_SARAN', { ...session.temp_data, rating: parseInt(textLower) });
                    await sendWhatsAppMessage(senderNumber, `Terima kasih! Anda memberi rating ⭐ ${textLower}.\nSilakan ketik saran/masukan Anda untuk layanan kami.\n\n0. Lewati`);
                } else {
                    await sendWhatsAppMessage(senderNumber, `⚠️ Masukkan angka 1 sampai 5.`);
                }
                break;
            }

            case 'AWAITING_SURVEY_SARAN': {
                const comment = textLower === '0' ? null : messageText;
                const ticketId = session.temp_data.ticket_id;
                const rating = session.temp_data.rating;

                if (ticketId) {
                    await supabaseService.from('ticket_feedback').insert({
                        ticket_id: ticketId,
                        rating: rating,
                        comment: comment
                    });
                }

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