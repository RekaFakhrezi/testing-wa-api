import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId } = await request.json();
    const staffName = user.user_metadata?.full_name ?? user.email;

    const { error, data } = await supabase
        .from('wa_tickets')
        .update({
            assigned_to: user.id,
            assigned_staff_name: staffName,
            assigned_at: new Date().toISOString(),
            status: 'in_progress',
        })
        .eq('id', ticketId)
        .is('assigned_to', null) // biar gak ke-rebut staff lain kalau race condition
        .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.length) return NextResponse.json({ error: 'Tiket sudah diambil staff lain' }, { status: 409 });

    return NextResponse.json({ success: true });
}