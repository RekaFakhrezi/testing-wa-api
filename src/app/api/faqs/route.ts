import { NextResponse } from 'next/server';
import { supabaseService } from '@/src/lib/supabase/service';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('category_id');
        const search = searchParams.get('search');

        let query = supabaseService.from('faqs').select('*, faq_categories(name)').order('sort_order', { ascending: true });
        
        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }
        if (search) {
            query = query.ilike('title', `%${search}%`);
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
        const { data, error } = await supabaseService.from('faqs').insert(body).select().single();
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
        
        const { data, error } = await supabaseService.from('faqs').update(updateData).eq('id', id).select().single();
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

        const { error } = await supabaseService.from('faqs').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
