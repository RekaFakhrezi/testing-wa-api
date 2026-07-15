import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// Fungsi untuk membalas pesan via WaSenderAPI
async function sendWhatsAppMessage(to: string, text: string) {
    const url = 'https://wasenderapi.com/api/send-message'; // [cite: 139, 140, 141]
    const token = process.env.WASENDER_BEARER_TOKEN;

    await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // [cite: 52, 54]
        },
        body: JSON.stringify({
            phone: to,
            message: text
        })
    });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // WaSenderAPI menggunakan field 'messageBody' untuk isi teks [cite: 37, 38]
        const messageText = body.messageBody?.trim();
        const senderNumber = body.from;

        if (!messageText || !senderNumber) {
            return NextResponse.json({ status: 'ignored', reason: 'Bukan pesan teks' });
        }

        const textLower = messageText.toLowerCase();

        // SKENARIO 1: User ketik "HaloDesk" (Hanya merespons ini di awal)
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

        // SKENARIO 3: User mengirim format laporan (mengandung tanda " - ")
        if (textLower.includes(' - ')) {
            const parts = messageText.split(' - ');

            if (parts.length >= 3) {
                const name = parts[0].trim();
                const nim = parts[1].trim();
                const complaint = parts.slice(2).join(' - ').trim(); // Gabungkan sisa teks jika keluhannya panjang

                // Simpan ke Supabase ke tabel wa_tickets yang tadi kita buat
                const { error } = await supabase
                    .from('wa_tickets')
                    .insert([
                        {
                            wa_number: senderNumber,
                            reporter_name: name,
                            reporter_nim: nim,
                            description: complaint
                        }
                    ]);

                if (error) {
                    console.error('Supabase Error:', error);
                    await sendWhatsAppMessage(senderNumber, 'Maaf, sistem sedang gangguan. Coba lagi nanti.');
                } else {
                    await sendWhatsAppMessage(senderNumber, `✅ *Laporan Diterima!*\n\nNama: ${name}\nNIM: ${nim}\nKendala: ${complaint}\n\nTiket kamu sudah masuk ke antrean staf IT kami.`);
                }
                return NextResponse.json({ status: 'success', action: 'ticket_created' });
            }
        }

        // SKENARIO 4: Jika chat selain di atas, bot akan MENGABAIKANNYA (sesuai permintaan kamu)
        return NextResponse.json({ status: 'ignored', reason: 'Perintah tidak dikenali' });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}