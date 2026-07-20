import { NextResponse } from 'next/server';
import { supabaseService } from '@/src/lib/supabase/service';
import { sendTicketNotification } from '@/src/lib/services/notification';
import { createTicketLog } from '@/src/lib/logger';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { ticketId, categoryId, priority, departmentId, actionType } = body;

        if (!ticketId || !actionType) {
            return NextResponse.json({ status: 'error', message: 'Data tidak lengkap' }, { status: 400 });
        }

        // Tentukan status baru sesuai Enum DB
        const newStatus = actionType === 'accept' ? 'Diproses' : 'Ditolak/Dibatalkan';

        // Update objek payload
        const updatePayload: any = { status: newStatus };
        if (actionType === 'accept') {
            updatePayload.priority = priority;
            updatePayload.department_id = departmentId;
            updatePayload.technician_id = null; // Reset if reassigned
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
        const ticketNum = updatedTicket.ticket_number;

        if (pelaporPhone) {
            await sendTicketNotification(ticketNum, newStatus, pelaporPhone);
        }

        // Mencatat log ke audit_logs
        const { data: adminUser } = await supabaseService.from('users').select('id').eq('role', 'OPERATOR_HELPDESK').limit(1).maybeSingle();
        const fallbackUserId = adminUser?.id || updatedTicket.reporter_id;

        await createTicketLog(supabaseService, {
            ticket_id: ticketId,
            user_id: adminUser?.id || null,
            user_name: 'Operator',
            role: 'HELPDESK',
            action: actionType === 'accept' ? 'CHANGE_STATUS' : 'REJECT_TICKET',
            description: actionType === 'accept' ? 'Tiket diterima dan diteruskan ke unit terkait' : 'Tiket ditolak oleh operator',
            new_value: updatedTicket
        });

        return NextResponse.json({ status: 'success' });

    } catch (error: any) {
        console.error('Error proses tiket operator:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}