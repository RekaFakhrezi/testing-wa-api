import { NextResponse } from 'next/server';
import { supabaseService } from '@/src/lib/supabase/service';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const parentId = searchParams.get('parent_id');
        const all = searchParams.get('all');

        let query = supabaseService.from('faq_categories').select('*').order('sort_order', { ascending: true });
        
        if (all === 'true') {
            // no filter
        } else if (parentId) {
            query = query.eq('parent_id', parentId);
        } else {
            query = query.is('parent_id', null);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { data, error } = await supabaseService.from('faq_categories').insert(body).select().single();
        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;
        updateData.updated_at = new Date().toISOString();
        
        const { data, error } = await supabaseService.from('faq_categories').update(updateData).eq('id', id).select().single();
        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: "ID missing" }, { status: 400 });

        const { error } = await supabaseService.from('faq_categories').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
