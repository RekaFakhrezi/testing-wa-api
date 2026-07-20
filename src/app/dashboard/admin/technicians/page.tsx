import { createClient } from '@/src/lib/supabase/server';
import React from 'react';
import Link from 'next/link';
import TechnicianTabContent from '@/src/components/admin/TechnicianTabContent';
import DepartmentTabContent from '@/src/components/admin/DepartmentTabContent';

export const dynamic = 'force-dynamic';

export default async function AdminTechniciansPage({
    searchParams
}: {
    searchParams: Promise<{ tab?: string }>
}) {
    const supabase = await createClient();
    const resolvedParams = await searchParams;
    const currentTab = resolvedParams.tab || 'teknisi';

    // Fetch departments
    const { data: departments } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true });

    // Fetch technicians
    const { data: technicians } = await supabase
        .from('users')
        .select('id, name, phone_number, department_id, is_active')
        .eq('role', 'TEKNISI')
        .order('name', { ascending: true });

    // Fetch all tickets currently 'Diproses'
    const { data: ticketsInProgress } = await supabase
        .from('tickets')
        .select('technician_id, id')
        .eq('status', 'Diproses')
        .not('technician_id', 'is', null);

    // Count workload
    const workloadCount: Record<string, number> = {};
    if (ticketsInProgress) {
        ticketsInProgress.forEach(t => {
            if (t.technician_id) {
                workloadCount[t.technician_id] = (workloadCount[t.technician_id] || 0) + 1;
            }
        });
    }

    // Attach workload to technicians
    const techniciansWithWorkload = technicians?.map(tech => ({
        ...tech,
        workload: workloadCount[tech.id] || 0
    })) || [];

    return (
        <div className="w-full h-full p-6 md:p-10 font-sans text-slate-800">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Header & Tabs Navigation */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Teknisi & Departemen</h1>
                    <p className="text-slate-500 mt-1">Kelola data teknisi (agen) dan struktur departemen penugasan.</p>
                    
                    <div className="mt-8 border-b border-slate-200 flex gap-8">
                        <Link 
                            href="?tab=teknisi"
                            className={`pb-4 font-semibold text-sm transition-colors relative ${currentTab === 'teknisi' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Daftar Teknisi
                            {currentTab === 'teknisi' && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
                            )}
                        </Link>
                        <Link 
                            href="?tab=departemen"
                            className={`pb-4 font-semibold text-sm transition-colors relative ${currentTab === 'departemen' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Daftar Departemen
                            {currentTab === 'departemen' && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
                            )}
                        </Link>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="pt-2">
                    {currentTab === 'teknisi' ? (
                        <TechnicianTabContent 
                            techniciansWithWorkload={techniciansWithWorkload}
                            departments={departments || []}
                        />
                    ) : (
                        <DepartmentTabContent 
                            departments={departments || []}
                            technicians={technicians || []}
                        />
                    )}
                </div>

            </div>
        </div>
    );
}
