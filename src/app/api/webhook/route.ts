import { NextResponse } from 'next/server';
import { supabaseService } from '@/src/lib/supabase/service';

async function sendWhatsAppMessage(to: string, text: string) {
    const url = 'https://www.wasenderapi.com/api/send-message';
    const token = process.env.WASENDER_BEARER_TOKEN;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            to,
            text,
        }),
    });

    if (!res.ok) {
        console.error('Gagal kirim pesan:', await res.text());
    }
}

export async function POST(request: Request) {
    try {
        // Verifikasi signature webhook
        const signature = request.headers.get('x-webhook-signature');

        if (signature !== process.env.WASENDER_WEBHOOK_SECRET) {
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Hanya proses pesan masuk
        if (body.event !== 'messages.received') {
            return NextResponse.json({
                status: 'ignored',
                reason: 'Bukan event pesan',
            });
        }

        const msg = body.data?.messages;

        const messageText =
            typeof msg?.messageBody === 'string'
                ? msg.messageBody.trim()
                : undefined;

        const senderNumber =
            msg?.key?.cleanedSenderPn ??
            msg?.key?.cleanedParticipantPn;

        if (!messageText || !senderNumber) {
            return NextResponse.json({
                status: 'ignored',
                reason: 'Bukan pesan teks',
            });
        }

        const textLower = messageText.toLowerCase();

        // ==========================
        // MENU AWAL
        // ==========================
        if (textLower === 'halodesk') {
            const menu = `🤖 *Bot Helpdesk IT Undip*

Halo! Selamat datang di Pusat Bantuan IT.

Silakan pilih menu:

*1.* 📝 Lapor Kendala
*2.* 🔍 Cek Status

_Ketik HaloDesk kapan saja untuk kembali ke menu._`;

            await sendWhatsAppMessage(senderNumber, menu);

            return NextResponse.json({
                status: 'success',
                action: 'menu_sent',
            });
        }

        // ==========================
        // MENU 1
        // ==========================
        if (textLower === '1') {
            const instruction = `Baik, mari kita buat tiket baru.

Silakan balas dengan format berikut:

*NAMA - NIM - KELUHAN*

Contoh:

Budi Santoso - 2401021 - WiFi perpustakaan mati`;

            await sendWhatsAppMessage(senderNumber, instruction);

            return NextResponse.json({
                status: 'success',
                action: 'instruction_sent',
            });
        }

        // ==========================
        // MENU 2
        // ==========================
        if (textLower === '2') {
            const reply =
                'Fitur cek status tiket masih dalam pengembangan. Silakan hubungi admin Helpdesk untuk informasi sementara.';

            await sendWhatsAppMessage(senderNumber, reply);

            return NextResponse.json({
                status: 'success',
                action: 'status_info_sent',
            });
        }

        // ==========================
        // FORMAT TIKET
        // ==========================
        if (messageText.includes(' - ')) {
            const parts = messageText.split(' - ');

            if (parts.length >= 3) {
                const name = parts[0].trim();
                const nim = parts[1].trim();
                const complaint = parts.slice(2).join(' - ').trim();

                const { error } = await supabaseService
                    .from('wa_tickets')
                    .insert([
                        {
                            wa_number: senderNumber,
                            reporter_name: name,
                            reporter_nim: nim,
                            description: complaint,
                        },
                    ]);

                if (error) {
                    console.error('Supabase Error:', error);

                    await sendWhatsAppMessage(
                        senderNumber,
                        '❌ Maaf, sistem sedang mengalami gangguan. Silakan coba beberapa saat lagi.'
                    );

                    return NextResponse.json(
                        {
                            status: 'error',
                            action: 'insert_failed',
                        },
                        { status: 500 }
                    );
                }

                await sendWhatsAppMessage(
                    senderNumber,
                    `✅ *Laporan Berhasil Diterima!*

Nama: ${name}
NIM: ${nim}

Kendala:
${complaint}

Tiket kamu sudah masuk ke antrean Helpdesk IT.

Terima kasih 🙏`
                );

                return NextResponse.json({
                    status: 'success',
                    action: 'ticket_created',
                });
            }

            await sendWhatsAppMessage(
                senderNumber,
                `Format belum benar.

Gunakan format:

*NAMA - NIM - KELUHAN*

Contoh:

Budi Santoso - 2401021 - WiFi perpustakaan mati`
            );

            return NextResponse.json({
                status: 'success',
                action: 'invalid_format',
            });
        }

        // ==========================
        // HANDLE TICKET REPLY (Menunggu Balasan)
        // ==========================
        const { data: waitingTickets } = await supabaseService
            .from('wa_tickets')
            .select('id')
            .eq('wa_number', senderNumber)
            .eq('status', 'waiting_for_user')
            .order('created_at', { ascending: false })
            .limit(1);

        if (waitingTickets && waitingTickets.length > 0) {
            const ticketId = waitingTickets[0].id;
            const isClosing = ['selesai', 'sudah', 'closed', 'ok'].includes(textLower);

            if (isClosing) {
                await supabaseService
                    .from('wa_tickets')
                    .update({ status: 'closed' })
                    .eq('id', ticketId);

                await sendWhatsAppMessage(
                    senderNumber,
                    '✅ *Tiket Ditutup*\n\nTerima kasih atas konfirmasinya. Tiket Anda telah selesai dan ditutup.'
                );

                return NextResponse.json({
                    status: 'success',
                    action: 'ticket_closed_by_user',
                });
            } else {
                await supabaseService
                    .from('wa_tickets')
                    .update({ status: 'in_progress' })
                    .eq('id', ticketId);

                await sendWhatsAppMessage(
                    senderNumber,
                    '🔄 *Tiket Dibuka Kembali*\n\nPesan Anda telah kami terima. Tim Helpdesk IT akan segera mengeceknya kembali.'
                );

                return NextResponse.json({
                    status: 'success',
                    action: 'ticket_reopened_by_user',
                });
            }
        }

        return NextResponse.json({
            status: 'ignored',
            reason: 'Perintah tidak dikenali',
        });
    } catch (error) {
        console.error('Webhook Error:', error);

        return NextResponse.json(
            {
                error: 'Internal Server Error',
            },
            {
                status: 500,
            }
        );
    }
}