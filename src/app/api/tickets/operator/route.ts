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
        const body = await request.json();
        const { ticketId, categoryId, priority, technicianId, actionType } = body;

        if (!ticketId || !actionType) {
            return NextResponse.json({ status: 'error', message: 'Data tidak lengkap' }, { status: 400 });
        }

        // Tentukan status baru sesuai Enum DB
        const newStatus = actionType === 'accept' ? 'Diproses' : 'Ditolak/Dibatalkan';

        // Update objek payload
        const updatePayload: any = { status: newStatus };
        if (actionType === 'accept') {
            updatePayload.priority = priority;
            updatePayload.technician_id = technicianId;
            if (categoryId) updatePayload.category_id = categoryId;
        }

        // Ambil data tiket sekalian gabung ke tabel users untuk nomor WA pelapor
        const { data: updatedTicket, error } = await supabaseService
            .from('tickets')
            .update(updatePayload)
            .eq('id', ticketId)
            .select('*, reporter:reporter_id(phone_number, name)')
            .single();

        if (error) throw error;

        // Kirim Notifikasi WA ke Pelapor
        const pelaporPhone = updatedTicket.reporter?.phone_number;
        const pelaporName = updatedTicket.reporter?.name;
        const ticketNum = updatedTicket.ticket_number;

        if (pelaporPhone) {
            let waMsg = '';
            if (actionType === 'accept') {
                waMsg = `✅ *Tiket Diterima (#${ticketNum})*\n\nHalo ${pelaporName},\nLaporan Anda telah berhasil diverifikasi oleh Operator dan saat ini berstatus *${newStatus}*.\n\nTiket Anda sedang ditugaskan ke Teknisi kami dengan tingkat prioritas: *${priority}*.\n\n_Silakan tunggu pembaruan pesan otomatis dari Teknisi kami ya!_ 👷‍♂️`;
            } else {
                waMsg = `❌ *Tiket Ditolak (#${ticketNum})*\n\nHalo ${pelaporName},\nMohon maaf, tiket Anda telah ditolak atau dibatalkan oleh Operator Helpdesk.\n\nJika ini adalah sebuah kesalahan, silakan buat tiket baru dengan informasi yang lebih detail.`;
            }
            await sendWhatsAppMessage(pelaporPhone, waMsg);
        }

        // Mencatat log ke audit_logs
        const { data: adminUser } = await supabaseService.from('users').select('id').eq('role', 'OPERATOR_HELPDESK').limit(1).maybeSingle();
        const fallbackUserId = adminUser?.id || updatedTicket.reporter_id;

        await supabaseService.from('audit_logs').insert([{
            ticket_id: ticketId,
            user_id: fallbackUserId,
            action_type: actionType === 'accept' ? 'TICKET_DISPATCHED' : 'TICKET_REJECTED',
            new_value: updatedTicket
        }]);

        return NextResponse.json({ status: 'success' });

    } catch (error: any) {
        console.error('Error proses tiket operator:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}