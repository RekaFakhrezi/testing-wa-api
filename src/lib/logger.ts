

type TicketLogPayload = {
    ticket_id: string;
    user_id?: string | null;
    user_name?: string | null;
    role: 'SYSTEM' | 'USER' | 'HELPDESK' | 'TEKNISI' | 'ADMIN';
    action: string;
    description: string;
    old_value?: any;
    new_value?: any;
};

export async function createTicketLog(supabase: any, payload: TicketLogPayload) {
    try {
        const { error } = await supabase.from('ticket_logs').insert([
            {
                ticket_id: payload.ticket_id,
                user_id: payload.user_id || null,
                user_name: payload.user_name || null,
                role: payload.role,
                action: payload.action,
                description: payload.description,
                old_value: payload.old_value || null,
                new_value: payload.new_value || null,
            }
        ]);
        if (error) {
            console.error('[createTicketLog] Error inserting log:', error);
        }
    } catch (e) {
        console.error('[createTicketLog] Exception:', e);
    }
}
