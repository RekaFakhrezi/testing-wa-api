import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parent_id');
    const all = searchParams.get('all');

    try {
        let query = supabaseService.from('categories').select('*').order('sort_order', { ascending: true });
        
        if (all !== 'true') {
             if (parentId) {
                 query = query.eq('parent_id', parentId);
             } else {
                 query = query.is('parent_id', null);
             }
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
        const { parent_id, name, description, level, sort_order, is_active } = body;

        const { data, error } = await supabaseService.from('categories').insert({
            parent_id: parent_id || null,
            name,
            description,
            level: level || 1,
            sort_order: sort_order || 0,
            is_active: is_active !== false
        }).select().single();

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, parent_id, name, description, level, sort_order, is_active } = body;

        if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

        const updateData: any = {};
        if (parent_id !== undefined) updateData.parent_id = parent_id || null;
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (level !== undefined) updateData.level = level;
        if (sort_order !== undefined) updateData.sort_order = sort_order;
        if (is_active !== undefined) updateData.is_active = is_active;
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabaseService.from('categories').update(updateData).eq('id', id).select().single();

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

    try {
        // Check if there are tickets using this category
        const { count, error: countError } = await supabaseService
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', id);

        if (countError) throw countError;
        
        if (count && count > 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'Kategori ini tidak dapat dihapus karena masih digunakan oleh beberapa tiket.' 
            }, { status: 400 });
        }

        const { error } = await supabaseService.from('categories').delete().eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
