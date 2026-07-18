import { createClient } from '@/src/lib/supabase/server';
import React from 'react';
import OperatorTicketTable from '@/src/components/OperatorTicketTable';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OperatorDashboard() {
    const supabase = await createClient();

    // Mengambil tiket yang berstatus 'Open' beserta relasi users dan categories
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
            *,
            reporter:reporter_id (name, identity_number, faculty_unit),
            category:category_id (name)
        `)
        .eq('status', 'Open')
        .order('created_at', { ascending: false });

    // Mengambil daftar teknisi
    const { data: technicians } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'TEKNISI');

    // Mengambil daftar kategori untuk dikoreksi operator
    const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

    return (
        <div className="p-6 max-w-[95%] mx-auto min-h-screen bg-slate-50 text-slate-800 font-sans">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tickets</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage and monitor all support tickets.</p>
                </div>
            </div>

            {/* Statistik / Tab (Placeholder UI sederhana) */}
            <div className="flex gap-4 mb-8">
                <div className="bg-white border border-slate-200 rounded-xl p-5 flex-1 shadow-sm">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Open Tickets</div>
                    <div className="text-3xl font-bold text-slate-800">{tickets?.length || 0}</div>
                    <div className="text-xs text-slate-500 mt-1">Needs action</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 flex-1 shadow-sm opacity-60">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">In Progress</div>
                    <div className="text-3xl font-bold text-slate-800">-</div>
                    <div className="text-xs text-slate-500 mt-1">Currently active</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 flex-1 shadow-sm opacity-60">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Closed</div>
                    <div className="text-3xl font-bold text-slate-800">-</div>
                    <div className="text-xs text-slate-500 mt-1">Completed tickets</div>
                </div>
            </div>

            {/* Komponen Tabel Client-Side dengan Filter/Sorting */}
            <OperatorTicketTable 
                initialTickets={tickets || []} 
                categories={categories || []} 
                technicians={technicians || []} 
            />
        </div>
    );
}