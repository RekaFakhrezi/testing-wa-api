import { createClient } from '@/src/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    const supabase = await createClient();

    // Check user auth (should be Admin/Pimpinan)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    let query = supabase
        .from('tickets')
        .select(`
            id,
            ticket_number,
            description,
            status,
            sub_status,
            priority,
            created_at,
            resolved_at,
            reporter:reporter_id (name, faculty_unit),
            category:category_id (name),
            operator:operator_id (name),
            technician:technician_id (name)
        `)
        .order('created_at', { ascending: false });

    if (startDate) {
        query = query.gte('created_at', startDate);
    }
    if (endDate) {
        // Add 1 day to include the end date fully
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        query = query.lt('created_at', end.toISOString());
    }
    if (status) {
        query = query.eq('status', status);
    }

    const { data: tickets, error } = await query;

    if (error) {
        return new NextResponse(error.message, { status: 500 });
    }

    // Convert to CSV
    // Columns: No Tiket, Waktu Masuk, Pelapor, Unit Kerja, Kategori, Prioritas, Status, Waktu Selesai, Operator, Teknisi
    const header = [
        'No Tiket',
        'Waktu Masuk',
        'Pelapor',
        'Unit Kerja',
        'Kategori',
        'Prioritas',
        'Status',
        'Waktu Selesai',
        'Operator',
        'Teknisi'
    ].join(',');

    const rows = (tickets || []).map(t => {
        const waktuMasuk = new Date(t.created_at).toLocaleString('id-ID');
        const waktuSelesai = t.resolved_at ? new Date(t.resolved_at).toLocaleString('id-ID') : '';
        
        return [
            t.ticket_number,
            `"${waktuMasuk}"`,
            `"${t.reporter?.name || ''}"`,
            `"${t.reporter?.faculty_unit || ''}"`,
            `"${t.category?.name || ''}"`,
            t.priority || '',
            t.status || '',
            `"${waktuSelesai}"`,
            `"${t.operator?.name || ''}"`,
            `"${t.technician?.name || ''}"`
        ].join(',');
    });

    const csvContent = [header, ...rows].join('\n');

    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="Report_Tickets_${new Date().toISOString().slice(0,10)}.csv"`
        }
    });
}
