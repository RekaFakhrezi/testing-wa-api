'use client';

import React, { useState, useMemo } from 'react';
import { calculateIsOverdue } from '@/src/lib/utils/sla';

type TabType = 'Department' | 'Topics' | 'Agent';

export default function AdminStatisticsTable({ tickets, slaConfigs, dateRange }: { tickets: any[], slaConfigs: any[], dateRange: {start: string, end: string} }) {
    const [activeTab, setActiveTab] = useState<TabType>('Department');

    // Aggregate Data
    const aggregatedData = useMemo(() => {
        const result: Record<string, any> = {};

        tickets.forEach(t => {
            let key = 'Unknown';
            if (activeTab === 'Department') {
                key = t.category?.department?.name || 'Tanpa Departemen';
            } else if (activeTab === 'Topics') {
                key = t.category?.name || 'Tanpa Topik';
            } else if (activeTab === 'Agent') {
                key = t.technician?.name || (t.technician_id ? 'Teknisi ID ' + t.technician_id : 'Belum Ditunjuk');
            }

            if (!result[key]) {
                result[key] = {
                    name: key,
                    opened: 0,
                    assigned: 0,
                    closed: 0,
                    overdue: 0
                };
            }

            // Opened: Any ticket that was created (since all tickets in the filtered array were opened in this range)
            // Or should opened mean status = 'Open'? The image implies "Opened" is total tickets created? 
            // In typical helpdesks, "Opened" means total new tickets in this period. "Assigned" means tickets currently in progress or assigned. 
            // Let's stick to status counts for simplicity as it's less confusing.
            if (t.status === 'Open') result[key].opened += 1;
            if (t.status === 'Diproses') result[key].assigned += 1;
            if (t.status === 'Selesai' || t.status === 'Selesai/Close') result[key].closed += 1;

            if (calculateIsOverdue(t, slaConfigs)) {
                result[key].overdue += 1;
            }
        });

        return Object.values(result).sort((a, b) => b.opened - a.opened);
    }, [tickets, activeTab, slaConfigs]);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        Statistics 
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs cursor-help" title="Statistik berdasarkan rentang tanggal">?</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Statistics of tickets organized by department, help topic, and agent.
                    </p>
                    <p className="text-xs font-semibold text-slate-600 mt-2">
                        Range: {dateRange.start} - {dateRange.end}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 px-6 pt-4 gap-2 bg-slate-50">
                {(['Department', 'Topics', 'Agent'] as TabType[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border border-b-0 ${
                            activeTab === tab 
                                ? 'bg-white border-slate-200 text-blue-600' 
                                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        style={{ marginBottom: activeTab === tab ? '-1px' : '0' }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="p-6 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-slate-200">
                            <th className="py-3 px-4 font-bold text-slate-700 text-sm">{activeTab}</th>
                            <th className="py-3 px-4 font-bold text-slate-700 text-sm text-center">Opened</th>
                            <th className="py-3 px-4 font-bold text-slate-700 text-sm text-center">Assigned</th>
                            <th className="py-3 px-4 font-bold text-slate-700 text-sm text-center">Closed</th>
                            <th className="py-3 px-4 font-bold text-slate-700 text-sm text-center">Overdue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {aggregatedData.map((row, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 font-semibold text-slate-600 text-sm">{row.name}</td>
                                <td className="py-3 px-4 text-center text-slate-600 text-sm">{row.opened}</td>
                                <td className="py-3 px-4 text-center text-slate-600 text-sm">{row.assigned}</td>
                                <td className="py-3 px-4 text-center text-slate-600 text-sm">{row.closed}</td>
                                <td className="py-3 px-4 text-center text-red-600 font-medium text-sm">{row.overdue}</td>
                            </tr>
                        ))}
                        {aggregatedData.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-400 text-sm italic">
                                    Tidak ada data untuk rentang waktu ini.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
