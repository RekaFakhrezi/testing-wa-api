import { NextResponse } from 'next/server';
import { supabaseService } from '@/src/lib/supabase/service';
import { sendTicketNotification } from '@/src/lib/services/notification';
import { createTicketLog } from '@/src/lib/logger';

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

        // 3. Catat di audit log & ticket_messages
        const userId = ticket.technician_id || ticket.reporter_id;
        
        await createTicketLog(supabaseService, {
            ticket_id: ticketId,
            user_id: userId,
            role: 'TEKNISI',
            action: 'CLOSE_TICKET',
            description: `Tiket diselesaikan. Solusi: ${solution.substring(0, 50)}...`,
            new_value: { ...updatedTicket, solution_note: solution } // Simpan solusi utuh di JSONB
        });

        await supabaseService.from('ticket_messages').insert({
            ticket_id: ticketId,
            sender_type: 'TEKNISI',
            sender_id: userId,
            message: `[TIKET DISELESAIKAN]\nSolusi: ${solution}`,
            is_internal: false
        });

        // 4. Kirim WA ke pelapor
        const pelaporPhone = ticket.reporter?.phone_number;
        if (pelaporPhone) {
            await supabaseService.from('wa_sessions').upsert({
                phone_number: pelaporPhone,
                step: 'AWAITING_TICKET_RESOLVED_CONFIRMATION',
                temp_data: { ticket_id: ticketId, ticket_number: ticket.ticket_number },
                updated_at: new Date().toISOString()
            }, { onConflict: 'phone_number' });

            await sendTicketNotification(ticket.ticket_number, 'Selesai/Close', pelaporPhone);
        }

        return NextResponse.json({ status: 'success' });

    } catch (error: any) {
        console.error('Error resolve tiket:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
