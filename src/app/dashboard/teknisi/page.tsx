import { createClient } from '@/src/lib/supabase/server';
import React from 'react';
import { cookies } from 'next/headers';
import TechnicianTicketTable from '@/src/components/TechnicianTicketTable';

export const dynamic = 'force-dynamic';

export default async function TeknisiDashboard(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams;
    const tab = searchParams.tab === 'tasks' ? 'tasks' : 'dashboard';
    
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
        return <div className="p-10">Harap login terlebih dahulu.</div>;
    }

    // Ambil data teknisi dan department-nya berdasarkan auth_id
    const { data: user } = await supabase
        .from('users')
        .select('*, department:department_id(name)')
        .eq('auth_id', authUser.id)
        .single();

    if (!user) return <div className="p-10">User tidak ditemukan di database publik.</div>;

    // Ambil tiket Open (Diproses) yang BELUM ada teknisinya tapi ditugaskan ke departemen user
    const { data: openTickets } = await supabase
        .from('tickets')
        .select(`
            *,
            reporter:reporter_id (name, identity_number, faculty_unit),
            category:category_id (name)
        `)
        .eq('status', 'Diproses')
        .eq('department_id', user.department_id)
        .is('technician_id', null)
        .order('created_at', { ascending: false });

    // Ambil tiket yang sudah diambil oleh teknisi ini (My Tasks)
    const { data: myTasks } = await supabase
        .from('tickets')
        .select(`
            *,
            reporter:reporter_id (name, identity_number, faculty_unit),
            category:category_id (name)
        `)
        .eq('technician_id', user.id) // using public.users.id
        .order('created_at', { ascending: false });

    // Ambil SEMUA kategori untuk di-format menjadi "Parent / Child"
    const { data: rawCategories } = await supabase
        .from('categories')
        .select('*');

    // Build hierarchical names (e.g. "Aplikasi / SSO / Lupa Password")
    // Lalu FILTER HANYA yang termasuk ke dalam departemen teknisi ini!
    const relevantCategories = (rawCategories || [])
        .filter(cat => cat.department_id === user.department_id)
        .map(cat => {
            const breadcrumb = [];
            let current = cat;
            while (current) {
                breadcrumb.unshift(current.name);
                current = rawCategories?.find(c => c.id === current.parent_id);
            }
            return {
                id: cat.id,
                name: breadcrumb.join(' / ')
            };
        }).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="w-full h-full text-slate-800 font-sans p-6 md:p-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Teknisi</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Halo, <strong>{user.name}</strong>. Anda tergabung dalam <strong>{user.department?.name || 'Tanpa Departemen'}</strong>.
                </p>
            </div>

            {tab !== 'tasks' && (
                <div className="flex gap-4 mb-8">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 flex-1 shadow-sm">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Open Tickets (Unit Anda)</div>
                        <div className="text-3xl font-bold text-slate-800">{openTickets?.length || 0}</div>
                        <div className="text-xs text-slate-500 mt-1">Menunggu diambil</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 flex-1 shadow-sm">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sedang Diproses</div>
                        <div className="text-3xl font-bold text-orange-600">{myTasks?.filter(t => t.status === 'Diproses').length || 0}</div>
                        <div className="text-xs text-slate-500 mt-1">Tugas aktif Anda</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 flex-1 shadow-sm">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Closed Tiket</div>
                        <div className="text-3xl font-bold text-emerald-600">{myTasks?.filter(t => t.status === 'Selesai').length || 0}</div>
                        <div className="text-xs text-slate-500 mt-1">Selesai dikerjakan</div>
                    </div>
                </div>
            )}

            <TechnicianTicketTable 
                openTickets={openTickets || []} 
                myTasks={myTasks || []} 
                categories={relevantCategories}
                currentUserId={user.id}
                activeTab={tab === 'tasks' ? 'my_tasks' : 'open'}
            />
        </div>
    );
}