import { NextResponse } from 'next/server';
import { supabaseService } from '@/src/lib/supabase/service';
import { createClient } from '@/src/lib/supabase/server';
import { createTicketLog } from '@/src/lib/logger';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
            return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
        }

        // Get public user id
        const { data: publicUser } = await supabaseService.from('users').select('id, name').eq('auth_id', authUser.id).single();
        if (!publicUser) {
            return NextResponse.json({ status: 'error', message: 'User not found in public database' }, { status: 401 });
        }
        
        const userId = publicUser.id;

        // Support both JSON body and FormData (for the form submission in the detail page)
        let ticketId = '';
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const body = await request.json();
            ticketId = body.ticketId;
        } else {
            const formData = await request.formData();
            ticketId = formData.get('ticketId') as string;
        }

        if (!ticketId) {
            return NextResponse.json({ status: 'error', message: 'Missing ticketId' }, { status: 400 });
        }

        // Update ticket technician
        const { data: updatedTicket, error } = await supabaseService
            .from('tickets')
            .update({ technician_id: userId })
            .eq('id', ticketId)
            .is('technician_id', null) // Prevent overriding if someone else already took it
            .select()
            .single();

        if (error || !updatedTicket) {
            return NextResponse.json({ status: 'error', message: 'Tiket sudah diambil oleh teknisi lain atau terjadi kesalahan.' }, { status: 400 });
        }

        // Audit Log
        await createTicketLog(supabaseService, {
            ticket_id: ticketId,
            user_id: userId,
            user_name: publicUser?.name,
            role: 'TEKNISI',
            action: 'ASSIGN_TECHNICIAN',
            description: `Tiket diambil oleh teknisi ${publicUser?.name || ''}`,
            new_value: { technician_id: userId }
        });

        // If it was a form submission, redirect back to the detail page
        if (!contentType.includes('application/json')) {
            return NextResponse.redirect(new URL(`/dashboard/tickets/${updatedTicket.ticket_number}`, request.url), 303);
        }

        return NextResponse.json({ status: 'success' });

    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}