import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId } = await request.json();

    const { error, data } = await supabase
        .from('wa_tickets')
        .update({
            status: 'waiting_for_user',
            resolved_at: new Date().toISOString(),
        })
        .eq('id', ticketId)
        .eq('assigned_to', user.id) // cuma staff yang assigned yang boleh nutup tiketnya
        .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.length) return NextResponse.json({ error: 'Tiket ini bukan tanggung jawab kamu' }, { status: 403 });

    return NextResponse.json({ success: true });
}