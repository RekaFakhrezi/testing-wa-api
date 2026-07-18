import { NextResponse } from 'next/server';
import { supabaseService } from '@/src/lib/supabase/service';

// Fungsi Kirim Pesan WA
async function sendWhatsAppMessage(to: string, text: string) {
    const url = 'https://www.wasenderapi.com/api/send-message';
    const token = process.env.WASENDER_BEARER_TOKEN;

    await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to, text }),
    }).catch(console.error);
}

export async function POST(request: Request) {
    try {
        const { ticketId, solution } = await request.json();

        if (!ticketId || !solution) {
            return NextResponse.json({ status: 'error', message: 'Data tidak lengkap' }, { status: 400 });
        }

        // 1. Ambil data tiket untuk mendapatkan reporter_id dan ticket_number
        const { data: ticket } = await supabaseService
            .from('tickets')
            .select('*, reporter:reporter_id(phone_number)')
            .eq('id', ticketId)
            .single();

        if (!ticket) {
            return NextResponse.json({ status: 'error', message: 'Tiket tidak ditemukan' }, { status: 404 });
        }

        // 2. Update status tiket
        const { data: updatedTicket, error } = await supabaseService
            .from('tickets')
            .update({
                status: 'Selesai/Close',
                resolved_at: new Date().toISOString(),
                // Menyimpan catatan solusi di deskripsi atau tabel terpisah? Kita gabungkan di audit log atau tambahkan ke sub_status sementara.
                sub_status: solution.substring(0, 50) 
            })
            .eq('id', ticketId)
            .select()
            .single();

        if (error) throw error;

        // 3. Catat di audit log
        await supabaseService.from('audit_logs').insert([{
            ticket_id: ticketId,
            user_id: ticket.technician_id || ticket.reporter_id, // Harusnya ID teknisi yang login
            action_type: 'TICKET_RESOLVED',
            new_value: { ...updatedTicket, solution_note: solution } // Simpan solusi utuh di JSONB
        }]);

        // 4. Kirim WA ke pelapor
        const pelaporPhone = ticket.reporter?.phone_number;
        if (pelaporPhone) {
            const waMsg = `✅ *Tiket Selesai (#${ticket.ticket_number})*\n\nKendala Anda telah berhasil ditangani oleh teknisi kami.\n\n*Catatan Solusi:*\n_${solution}_\n\nJika Anda merasa masalah sudah benar-benar teratasi, silakan balas dengan ketik *ThanksDesk* untuk menutup sesi ini dan memberikan penilaian layanan (Survei).`;
            await sendWhatsAppMessage(pelaporPhone, waMsg);
        }

        return NextResponse.json({ status: 'success' });

    } catch (error: any) {
        console.error('Error resolve tiket:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
