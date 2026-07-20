import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { updates } = body; // Array of { id, parent_id, sort_order, level }

        if (!updates || !Array.isArray(updates)) {
            return NextResponse.json({ success: false, error: 'Invalid updates format' }, { status: 400 });
        }

        // Using a transaction/loop to update all affected categories
        const promises = updates.map(update => {
            const { id, parent_id, sort_order, level } = update;
            return supabaseService.from('categories').update({
                parent_id: parent_id || null,
                sort_order: sort_order,
                level: level,
                updated_at: new Date().toISOString()
            }).eq('id', id);
        });

        await Promise.all(promises);

        return NextResponse.json({ success: true, count: updates.length });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
