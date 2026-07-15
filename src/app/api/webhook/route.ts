import { NextResponse } from 'next/server';
import { supabaseService } from '@/src/lib/supabase/service';

// Fungsi Kirim Pesan WA
async function sendWhatsAppMessage(to: string, text: string) {
    const url = 'https://www.wasenderapi.com/api/send-message';
    const token = process.env.WASENDER_BEARER_TOKEN;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to, text }),
    });

    if (!res.ok) console.error('Gagal kirim pesan:', await res.text());
}

// Upload base64 to Supabase Storage
async function uploadMediaToSupabase(base64Data: string, mimeType: string, senderNumber: string): Promise<string | null> {
    try {
        const base64Content = base64Data.replace(/^data:([A-Za-z-+/]+);base64,/, '');
        const buffer = Buffer.from(base64Content, 'base64');
        const ext = mimeType.split('/')[1] || 'jpg';
        const fileName = `${senderNumber}-${Date.now()}.${ext}`;

        const { data, error } = await supabaseService
            .storage
            .from('ticket-attachments')
            .upload(fileName, buffer, {
                contentType: mimeType,
                upsert: true
            });

        if (error) {
            console.error('Gagal upload media ke Supabase:', error);
            return null;
        }

        const { data: publicUrlData } = supabaseService
            .storage
            .from('ticket-attachments')
            .getPublicUrl(fileName);

        return publicUrlData.publicUrl;
    } catch (e) {
        console.error('Error handling base64 upload:', e);
        return null;
    }
}

// Daftar Topik Bantuan
const TOPICS = [
    "Infrastruktur & Jaringan Internet (WiFi)",
    "Pelayanan IT / Akun SSO",
    "Keamanan Siber",
    "SISTER, BKD, atau Sinta",
    "Lainnya"
];

export async function POST(request: Request) {
    try {
        const signature = request.headers.get('x-webhook-signature');
        if (signature !== process.env.WASENDER_WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const body = await request.json();
        if (body.event !== 'messages.received') {
            return NextResponse.json({ status: 'ignored' });
        }

        const msg = body.data?.messages;
        const messageText = typeof msg?.messageBody === 'string' ? msg.messageBody.trim() : '';
        const senderNumber = msg?.key?.cleanedSenderPn ?? msg?.key?.cleanedParticipantPn;

        if (!messageText || !senderNumber) {
            return NextResponse.json({ status: 'ignored' });
        }

        const textLower = messageText.toLowerCase();

        // 0. INTERCEPT: JIKA USER KETIK "THANKSDESK" UNTUK CLOSING TIKET
        if (textLower === 'thanksdesk') {
            const { data: resolvedTicket } = await supabaseService
                .from('wa_tickets')
                .select('id')
                .eq('wa_number', senderNumber)
                .eq('status', 'resolved')
                .order('resolved_at', { ascending: false })
                .limit(1)
                .single();

            if (resolvedTicket) {
                await supabaseService.from('wa_tickets').update({ status: 'closed' }).eq('id', resolvedTicket.id);
                await sendWhatsAppMessage(senderNumber, "✅ Tiket Anda telah resmi ditutup. Terima kasih telah menghubungi Helpdesk IT Undip!");
                return NextResponse.json({ status: 'success', action: 'ticket_closed' });
            }
        }

        // 1. AMBIL DATA USER DAN SESSION
        const { data: user } = await supabaseService.from('wa_users').select('*').eq('phone_number', senderNumber).single();
        let { data: session } = await supabaseService.from('wa_sessions').select('*').eq('phone_number', senderNumber).single();

        // Jika tidak ada sesi, buat sesi IDLE baru
        if (!session) {
            const { data: newSession } = await supabaseService
                .from('wa_sessions')
                .insert([{ phone_number: senderNumber, step: 'IDLE', temp_data: {} }])
                .select().single();
            session = newSession;
        }

        // 2. JIKA USER KETIK "HALODESK" (RESET KE AWAL)
        if (textLower === 'halodesk') {
            await supabaseService.from('wa_sessions').update({ step: 'AWAITING_ACTION', temp_data: {} }).eq('phone_number', senderNumber);

            const greeting = user
                ? `🤖 Halo, selamat datang kembali, *${user.name}*!\n\nAda yang bisa dibantu hari ini?\n\n*1.* 📝 Buat Tiket Bantuan\n*2.* 🔍 Cek Status Tiket`
                : `🤖 Halo! Selamat datang di Pusat Bantuan IT Undip.\n\nAda yang bisa kami bantu?\n\n*1.* 📝 Buat Tiket Bantuan\n*2.* 🔍 Cek Status Tiket`;

            await sendWhatsAppMessage(senderNumber, greeting);
            return NextResponse.json({ status: 'success' });
        }

        // 3. STATE MACHINE PERCAKAPAN
        switch (session.step) {

            case 'AWAITING_ACTION':
                if (textLower === '1') {
                    if (user) {
                        // Tanya apakah pakai data lama atau baru
                        await supabaseService.from('wa_sessions').update({ step: 'CONFIRM_USER' }).eq('phone_number', senderNumber);
                        await sendWhatsAppMessage(senderNumber, `Kamu akan membuat tiket. Gunakan data identitas atas nama *${user.name} (${user.nim})*?\n\n*1.* Ya, gunakan data saya\n*2.* Tidak, buat identitas baru`);
                    } else {
                        // User baru, langsung minta Nama - NIM
                        await supabaseService.from('wa_sessions').update({ step: 'AWAITING_NAMA_NIM' }).eq('phone_number', senderNumber);
                        await sendWhatsAppMessage(senderNumber, `Baik, mari buat tiket baru.\n\nSilakan balas dengan format:\n*NAMA - NIM*\n\nContoh: Budi - 21120124140146`);
                    }
                } else if (textLower === '2') {
                    await sendWhatsAppMessage(senderNumber, `Fitur cek status masih dikembangkan. Ketik *HaloDesk* untuk kembali ke menu.`);
                    await supabaseService.from('wa_sessions').update({ step: 'IDLE' }).eq('phone_number', senderNumber);
                }
                break;

            case 'CONFIRM_USER':
                if (textLower === '1') {
                    // Lanjut ke Pilih Topik dengan data lama
                    const tempData = { name: user.name, nim: user.nim };
                    await supabaseService.from('wa_sessions').update({ step: 'AWAITING_TOPIC', temp_data: tempData }).eq('phone_number', senderNumber);
                    await sendWhatsAppMessage(senderNumber, `Baik. Silakan pilih *Kategori Topik Bantuan* dengan membalas angkanya:\n\n1. 🌐 Jaringan Internet (WiFi)\n2. 🔑 Pelayanan IT / SSO\n3. 🛡️ Keamanan Siber\n4. 📚 SISTER / BKD / Sinta\n5. ❓ Lainnya`);
                } else if (textLower === '2') {
                    // Minta data baru
                    await supabaseService.from('wa_sessions').update({ step: 'AWAITING_NAMA_NIM' }).eq('phone_number', senderNumber);
                    await sendWhatsAppMessage(senderNumber, `Silakan balas dengan identitas baru berformat:\n*NAMA - NIM*\n\nContoh: Reka - 21120124140146`);
                }
                break;

            case 'AWAITING_NAMA_NIM':
                if (messageText.includes('-')) {
                    const parts = messageText.split('-');
                    if (parts.length >= 2) {
                        const name = parts[0].trim();
                        const nim = parts[1].trim();

                        await supabaseService.from('wa_sessions').update({
                            step: 'AWAITING_TOPIC',
                            temp_data: { name, nim }
                        }).eq('phone_number', senderNumber);

                        await sendWhatsAppMessage(senderNumber, `Halo ${name}. Silakan pilih *Kategori Topik Bantuan* dengan membalas angkanya:\n\n1. 🌐 Jaringan Internet (WiFi)\n2. 🔑 Pelayanan IT / SSO\n3. 🛡️ Keamanan Siber\n4. 📚 SISTER / BKD / Sinta\n5. ❓ Lainnya`);
                    } else {
                        await sendWhatsAppMessage(senderNumber, `Format salah. Harap gunakan tanda strip. Contoh: Budi - 21120124`);
                    }
                } else {
                    await sendWhatsAppMessage(senderNumber, `Harap ketik dengan format: NAMA - NIM`);
                }
                break;

            case 'AWAITING_TOPIC':
                const topicIndex = parseInt(textLower) - 1;
                if (topicIndex >= 0 && topicIndex < TOPICS.length) {
                    const selectedTopic = TOPICS[topicIndex];
                    const newData = { ...session.temp_data, topic: selectedTopic };

                    await supabaseService.from('wa_sessions').update({
                        step: 'AWAITING_COMPLAINT',
                        temp_data: newData
                    }).eq('phone_number', senderNumber);

                    await sendWhatsAppMessage(senderNumber, `Topik: *${selectedTopic}*.\n\nSilakan ketikkan detail kendala yang kamu alami secara lengkap. (Kamu juga bisa melampirkan screenshot).`);
                } else {
                    await sendWhatsAppMessage(senderNumber, `Pilihan tidak valid. Silakan balas dengan angka 1 sampai 5.`);
                }
                break;

            case 'AWAITING_COMPLAINT':
                const complaint = messageText || '(Ada Lampiran)';
                const { name, nim, topic } = session.temp_data;
                const ticketNumber = `TKT-${Math.floor(1000 + Math.random() * 9000)}`; // Generate random ticket ID

                // Handle media upload
                let attachmentUrl = null;
                const mediaBase64 = msg?.mediaBase64 || body.data?.mediaBase64;
                if (mediaBase64) {
                    const mimeType = msg?.mimetype || 'image/jpeg';
                    attachmentUrl = await uploadMediaToSupabase(mediaBase64, mimeType, senderNumber);
                }

                // 1. Simpan/Update user profile
                await supabaseService.from('wa_users').upsert({ phone_number: senderNumber, name, nim });

                // 2. Simpan tiket
                await supabaseService.from('wa_tickets').insert([{
                    wa_number: senderNumber,
                    reporter_name: name,
                    reporter_nim: nim,
                    help_topic: topic,
                    description: complaint,
                    ticket_number: ticketNumber,
                    status: 'open',
                    attachment_url: attachmentUrl
                }]);

                // 3. Reset Session ke IDLE
                await supabaseService.from('wa_sessions').update({ step: 'IDLE', temp_data: {} }).eq('phone_number', senderNumber);

                await sendWhatsAppMessage(senderNumber, `✅ *Laporan Berhasil Diterima!*\n\nNomor Tiket: *#${ticketNumber}*\nTopik: ${topic}\nKendala: ${complaint}\n\n👨‍💻 _Silakan menunggu, Staff IT kami akan segera mengecek dan membalas pesan ini._`);
                break;

            default:
                // Cek apakah user punya tiket aktif (in_progress atau resolved)
                const { data: activeTicket } = await supabaseService
                    .from('wa_tickets')
                    .select('id, status')
                    .eq('wa_number', senderNumber)
                    .in('status', ['in_progress', 'resolved'])
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (activeTicket) {
                    if (activeTicket.status === 'resolved') {
                        // User membalas saat status resolved tapi bukan thanksdesk -> Reopen tiket
                        await supabaseService.from('wa_tickets').update({ status: 'in_progress' }).eq('id', activeTicket.id);
                        await sendWhatsAppMessage(senderNumber, `🔄 *Tiket Dibuka Kembali*\n\nPesan Anda telah kami terima. Tim Helpdesk IT akan segera mengeceknya kembali.`);
                        return NextResponse.json({ status: 'success', action: 'ticket_reopened' });
                    } else if (activeTicket.status === 'in_progress') {
                        // User sedang chat dengan admin, bot diam saja
                        return NextResponse.json({ status: 'ignored', reason: 'chat_with_admin' });
                    }
                }

                await sendWhatsAppMessage(senderNumber, `Ketik *HaloDesk* untuk memulai layanan Helpdesk IT Undip.`);
                break;
        }

        return NextResponse.json({ status: 'success' });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}