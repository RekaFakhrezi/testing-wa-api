import { createClient } from '@/src/lib/supabase/server';
import React from 'react';
import OperatorTicketTable from '@/src/components/OperatorTicketTable';
import { calculateIsOverdue } from '@/src/lib/utils/sla';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OperatorDashboard(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams;
    const tab = searchParams.tab === 'ditolak' ? 'Ditolak' : 'Open';
    
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
        return <div className="p-10">Harap login terlebih dahulu.</div>;
    }

    // Mengambil tiket yang berstatus 'Open' beserta relasi users dan categories
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
            *,
            reporter:reporter_id (name, identity_number, faculty_unit),
            category:category_id (name)
        `)
        .eq('status', tab)
        .order('created_at', { ascending: false });

    // Hitung tiket dibuat hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const { count: todayCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStr);

    // Hitung tiket diverifikasi hari ini
    const { count: verifiedCount } = await supabase
        .from('ticket_logs')
        .select('*', { count: 'exact', head: true })
        .in('action', ['CHANGE_STATUS', 'REJECT_TICKET'])
        .eq('role', 'HELPDESK')
        .gte('created_at', todayStr);

    // Mengambil SLA Configs
    const { data: slaConfigs } = await supabase.from('sla_configs').select('*');

    // Inject is_overdue
    const processedTickets = (tickets || []).map(t => ({
        ...t,
        is_overdue: calculateIsOverdue(t, slaConfigs || [])
    }));

    // Mengambil daftar departemen untuk distribusi tiket
    const { data: departments } = await supabase
        .from('departments')
        .select('id, name')
        .order('name', { ascending: true });

    // Mengambil SEMUA kategori untuk di-format menjadi "Parent / Child"
    const { data: rawCategories } = await supabase
        .from('categories')
        .select('*');

    // Build hierarchical names for the dropdown (e.g. "Aplikasi / SSO / Lupa Password")
    const formattedCategories = (rawCategories || []).map(cat => {
        const breadcrumb = [];
        let current = cat;
        while (current) {
            breadcrumb.unshift(current.name);
            current = (rawCategories || []).find(c => c.id === current.parent_id);
        }
        return {
            id: cat.id,
            name: breadcrumb.join(' / '),
            parent_id: cat.parent_id // for filter
        };
    }).sort((a, b) => a.name.localeCompare(b.name));

    // Kategori utama untuk filter pencarian (parent_id is null)
    const mainCategories = formattedCategories.filter(c => !c.parent_id);

    return (
        <div className="w-full h-full text-slate-800 font-sans p-6 md:p-10">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tickets</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage and monitor all support tickets.</p>
                </div>
            </div>
            {/* Tabs */}
            {/* Removed internal tabs, moved to sidebar */}

            {/* Statistik */}
            {tab !== 'Ditolak' && (
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 flex-1 shadow-sm">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tiket Dibuat Hari Ini</div>
                        <div className="text-3xl font-black text-slate-800">{todayCount || 0}</div>
                        <div className="text-xs text-slate-500 mt-1">Total masuk hari ini</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 flex-1 shadow-sm">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Menunggu Verifikasi</div>
                        <div className="text-3xl font-black text-orange-600">{tickets?.length || 0}</div>
                        <div className="text-xs text-slate-500 mt-1">Status {tab}</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 flex-1 shadow-sm">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Diverifikasi Hari Ini</div>
                        <div className="text-3xl font-black text-emerald-600">{verifiedCount || 0}</div>
                        <div className="text-xs text-slate-500 mt-1">Diterima / Ditolak</div>
                    </div>
                </div>
            )}

            {/* Komponen Tabel Client-Side dengan Filter/Sorting */}
            <OperatorTicketTable 
                initialTickets={processedTickets} 
                departments={departments || []}
                categories={formattedCategories}
                mainCategories={mainCategories}
            />
        </div>
    );
}