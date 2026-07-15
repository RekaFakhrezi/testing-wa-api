import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

async function sendWhatsAppMessage(to: string, text: string) {
    const url = 'https://www.wasenderapi.com/api/send-message';
    const token = process.env.WASENDER_BEARER_TOKEN;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ to, text }) // <-- field yang benar: to & text
    });

    if (!res.ok) {
        console.error('Gagal kirim pesan:', await res.text());
    }
}

export async function POST(request: Request) {
    try {
        // Verifikasi webhook signature dulu
        const signature = request.headers.get('x-webhook-signature');
        if (signature !== process.env.WASENDER_WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const body = await request.json();

        // Cuma proses event pesan masuk, abaikan event lain (session status, dll)
        if (body.event !== 'messages.received') {
            return NextResponse.json({ status: 'ignored', reason: 'Bukan event pesan' });
        }

        const msg = body.data?.messages;
        const messageText: string | undefined = msg?.messageBody?.trim();
        const senderNumber: string | undefined =
            msg?.key?.cleanedSenderPn ?? msg?.key?.cleanedParticipantPn;

        if (!messageText || !senderNumber) {
            return NextResponse.json({ status: 'ignored', reason: 'Bukan pesan teks' });
        }

        const textLower = messageText.toLowerCase();

        // SKENARIO 1: User ketik "HaloDesk"
        if (textLower === 'halodesk') {
            const menu = `🤖 *Bot Helpdesk IT Undip*\n\nHalo! Selamat datang di Pusat Bantuan IT. Silakan balas dengan angka:\n*1.* 📝 Lapor Kendala\n*2.* 🔍 Cek Status\n\n_Ketik HaloDesk kapan saja untuk kembali._`;
            await sendWhatsAppMessage(senderNumber, menu);
            return NextResponse.json({ status: 'success', action: 'menu_sent' });
        }

        // SKENARIO 2: User balas "1"
        if (textLower === '1') {
            const reply = `Baik, mari kita buat tiket baru.\n\nSilakan balas pesan ini dengan format:\n*NAMA - NIM - KELUHAN*\n\nContoh: Budi Santoso - 2401021 - WiFi perpus mati`;
            await sendWhatsAppMessage(senderNumber, reply);
            return NextResponse.json({ status: 'success', action: 'instruction_sent' });
        }

        // SKENARIO 3: Format laporan (mengandung " - ")
        if (textLower.includes(' - ')) {
            const parts = messageText.split(' - ');

            if (parts.length >= 3) {
                const name = parts[0].trim();
                const nim = parts[1].trim();
                const complaint = parts.slice(2).join(' - ').trim();

                const { error } = await supabase
                    .from('wa_tickets')
                    .insert([{
                        wa_number: senderNumber,
                        reporter_name: name,
                        reporter_nim: nim,
                        description: complaint
                    }]);

                if (error) {
                    console.error('Supabase Error:', error);
                    await sendWhatsAppMessage(senderNumber, 'Maaf, sistem sedang gangguan. Coba lagi nanti.');
                } else {
                    await sendWhatsAppMessage(senderNumber, `✅ *Laporan Diterima!*\n\nNama: ${name}\nNIM: ${nim}\nKendala: ${complaint}\n\nTiket kamu sudah masuk ke antrean staf IT kami.`);
                }
                return NextResponse.json({ status: 'success', action: 'ticket_created' });
            }
        }

        return NextResponse.json({ status: 'ignored', reason: 'Perintah tidak dikenali' });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}