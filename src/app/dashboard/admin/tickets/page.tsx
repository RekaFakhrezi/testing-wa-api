import { createClient } from '@/src/lib/supabase/server';
import React from 'react';
import AdminTicketTable from '@/src/components/AdminTicketTable';
import { calculateIsOverdue } from '@/src/lib/utils/sla';

export const dynamic = 'force-dynamic';

export default async function AdminTicketsPage() {
    const supabase = await createClient();

    // 1. Fetch All Tickets
    const { data: tickets } = await supabase
        .from('tickets')
        .select(`
            *,
            reporter:reporter_id (name, identity_number, faculty_unit),
            category:category_id (name, department_id),
            technician:technician_id (name)
        `)
        .order('created_at', { ascending: false });

    // Fetch SLA Configs
    const { data: slaConfigs } = await supabase.from('sla_configs').select('*');

    const processedTickets = (tickets || []).map(t => ({
        ...t,
        is_overdue: calculateIsOverdue(t, slaConfigs || [])
    }));

    // 2. Fetch Categories for Filter
    const { data: rawCategories } = await supabase
        .from('categories')
        .select('*');

    // 3. Fetch Departments for Filter
    const { data: departments } = await supabase
        .from('departments')
        .select('*')
        .order('name');

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
            parent_id: cat.parent_id
        };
    }).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="w-full h-full p-6 md:p-10 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Monitoring Tiket Keseluruhan</h1>
                        <p className="text-slate-500 mt-1">Pantau seluruh tiket dari berbagai departemen tanpa batasan.</p>
                    </div>
                </div>

                <AdminTicketTable 
                    tickets={processedTickets}
                    categories={formattedCategories}
                    departments={departments || []}
                /> </div>
        </div>
    );
}
