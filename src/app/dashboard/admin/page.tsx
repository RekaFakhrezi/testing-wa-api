import { createClient } from '@/src/lib/supabase/server';
import React from 'react';
import Link from 'next/link';
import AdminDashboardStats from '@/src/components/AdminDashboardStats';
import { calculateIsOverdue } from '@/src/lib/utils/sla';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const supabase = await createClient();

    // 1. Fetch Summary Widgets Data
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
            id, status, category_id, priority, created_at, technician_id,
            category:category_id (name, department:department_id(name)),
            technician:technician_id(name)
        `);
        
    const todayStr = new Date().toISOString().split('T')[0];
    const createdToday = tickets?.filter(t => t.created_at.startsWith(todayStr)).length || 0;
    
    // Belum diverifikasi = Status Open & belum ada teknisi
    const belumDiverifikasi = tickets?.filter(t => t.status === 'Open' && !t.technician_id).length || 0;
    
    // Tiket Open = Status Open & sudah ada teknisi (atau cukup 'Open' secara general)
    const tiketOpen = tickets?.filter(t => t.status === 'Open' && t.technician_id).length || 0;
    
    const progressTickets = tickets?.filter(t => t.status === 'Diproses').length || 0;

    // Fetch SLA for Overdue calculation
    const { data: slaConfigs } = await supabase.from('sla_configs').select('*');
    const overdueTickets = tickets?.filter(t => calculateIsOverdue(t, slaConfigs || [])).length || 0;

    // 2. Fetch Recent Activity
    const { data: logs } = await supabase
        .from('ticket_logs')
        .select('*, tickets(ticket_number)')
        .order('created_at', { ascending: false })
        .limit(10);

    // 3. Top Categories Logic
    const categoryCounts: Record<string, number> = {};
    if (tickets) {
        tickets.forEach(t => {
            if (t.category_id) {
                categoryCounts[t.category_id] = (categoryCounts[t.category_id] || 0) + 1;
            }
        });
    }

    const { data: categories } = await supabase.from('categories').select('id, name');
    const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([catId, count]) => {
            const cat = categories?.find(c => c.id === catId);
            return { name: cat?.name || 'Unknown', count };
        });

    return (
        <div className="w-full h-full p-6 md:p-10 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Administrator</h1>
                        <p className="text-slate-500 mt-1">Ringkasan aktivitas dan metrik sistem Helpdesk.</p>
                    </div>
                </div>

                {/* Summary Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between border-b-4 border-b-blue-500">
                        <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">Tiket Created (Hari Ini)</div>
                        <div className="text-4xl font-black text-slate-800">{createdToday}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between border-b-4 border-b-orange-500">
                        <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">Belum Diverifikasi</div>
                        <div className="text-4xl font-black text-orange-600">{belumDiverifikasi}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between border-b-4 border-b-indigo-500">
                        <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">Tiket Open</div>
                        <div className="text-4xl font-black text-indigo-600">{tiketOpen}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between border-b-4 border-b-emerald-500">
                        <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">Diproses</div>
                        <div className="text-4xl font-black text-emerald-600">{progressTickets}</div>
                    </div>
                </div>

                {/* Charts & Statistics */}
                <AdminDashboardStats tickets={tickets || []} slaConfigs={slaConfigs || []} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800">Aktivitas Terkini (Audit Log)</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-6">
                                {logs?.map(log => (
                                    <div key={log.id} className="flex gap-4 items-start">
                                        <div className="w-16 shrink-0 text-slate-400 text-xs mt-1 font-mono">
                                            {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                                                    log.role === 'SYSTEM' ? 'bg-slate-200 text-slate-700' :
                                                    log.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                                    log.role === 'USER' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                    {log.role}
                                                </span>
                                                <span className="text-slate-400 text-xs mx-1">•</span>
                                                <span className="text-slate-500 text-xs font-mono">{log.tickets?.ticket_number || '-'}</span>
                                            </div>
                                            <div className="text-slate-700 text-sm">
                                                {log.description || log.action}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!logs || logs.length === 0) && (
                                    <div className="text-center text-slate-400 text-sm py-4 italic">Belum ada log aktivitas.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Top Categories */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800">Top Kategori Keluhan</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-5">
                                {topCategories.map((cat, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                {idx + 1}
                                            </div>
                                            <span className="font-semibold text-slate-700 text-sm">{cat.name}</span>
                                        </div>
                                        <div className="text-slate-900 font-bold text-sm bg-slate-100 px-3 py-1 rounded-full">
                                            {cat.count}
                                        </div>
                                    </div>
                                ))}
                                {topCategories.length === 0 && (
                                    <div className="text-center text-slate-400 text-sm py-4 italic">Belum ada data tiket.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
