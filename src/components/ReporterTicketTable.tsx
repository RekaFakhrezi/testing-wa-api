'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

type Ticket = {
    id: string;
    ticket_number: string;
    subject: string | null;
    status: string;
    updated_at: string;
    created_at: string;
    category: { department_id: string | null } | null;
    technician_id: string | null;
};

type Department = {
    id: string;
    name: string;
};

export default function ReporterTicketTable({ 
    tickets, 
    departments 
}: { 
    tickets: Ticket[],
    departments: Department[]
}) {
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const processedTickets = useMemo(() => {
        let filtered = [...tickets];
        
        if (sortConfig) {
            filtered.sort((a, b) => {
                let aVal: any = '';
                let bVal: any = '';

                if (sortConfig.key === 'ticket_number') {
                    aVal = a.ticket_number; bVal = b.ticket_number;
                } else if (sortConfig.key === 'updated_at') {
                    aVal = new Date(a.updated_at || a.created_at).getTime();
                    bVal = new Date(b.updated_at || b.created_at).getTime();
                } else if (sortConfig.key === 'status') {
                    aVal = a.status; bVal = b.status;
                } else if (sortConfig.key === 'subject') {
                    aVal = a.subject || ''; bVal = b.subject || '';
                } else if (sortConfig.key === 'department') {
                    aVal = departments.find(d => d.id === a.category?.department_id)?.name || '';
                    bVal = departments.find(d => d.id === b.category?.department_id)?.name || '';
                } else if (sortConfig.key === 'assignee') {
                    const deptA = departments.find(d => d.id === a.category?.department_id)?.name || '';
                    const deptB = departments.find(d => d.id === b.category?.department_id)?.name || '';
                    aVal = (a.status === 'Open' && !a.technician_id) ? '' : deptA;
                    bVal = (b.status === 'Open' && !b.technician_id) ? '' : deptB;
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [tickets, sortConfig, departments]);

    const getSortIndicator = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <span className="text-slate-300 ml-1">↕</span>;
        }
        return sortConfig.direction === 'asc' ? <span className="text-blue-600 ml-1">↑</span> : <span className="text-blue-600 ml-1">↓</span>;
    };

    const handleExport = () => {
        if (processedTickets.length === 0) return;
        
        const headers = ['Ticket', 'Last Updated', 'Status', 'Subject', 'Department', 'Assignee'];
        
        const rows = processedTickets.map((t: any) => {
            const isWaiting = t.status === 'Open' && !t.technician_id;
            const deptName = departments.find(d => d.id === t.category?.department_id)?.name || '-';
            const assignee = isWaiting ? '-' : deptName;

            return [
                t.ticket_number,
                new Date(t.updated_at || t.created_at).toLocaleString('id-ID'),
                t.status,
                `"${(t.subject || '').replace(/"/g, '""')}"`,
                `"${deptName.replace(/"/g, '""')}"`,
                `"${assignee.replace(/"/g, '""')}"`
            ];
        });

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `riwayat_tiket.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-semibold cursor-pointer group hover:bg-slate-100" onClick={() => requestSort('ticket_number')}>
                                Ticket {getSortIndicator('ticket_number')}
                            </th>
                            <th className="px-6 py-4 font-semibold cursor-pointer group hover:bg-slate-100" onClick={() => requestSort('updated_at')}>
                                Last Updated {getSortIndicator('updated_at')}
                            </th>
                            <th className="px-6 py-4 font-semibold cursor-pointer group hover:bg-slate-100" onClick={() => requestSort('status')}>
                                Status {getSortIndicator('status')}
                            </th>
                            <th className="px-6 py-4 font-semibold cursor-pointer group hover:bg-slate-100" onClick={() => requestSort('subject')}>
                                Subject {getSortIndicator('subject')}
                            </th>
                            <th className="px-6 py-4 font-semibold cursor-pointer group hover:bg-slate-100" onClick={() => requestSort('department')}>
                                Department {getSortIndicator('department')}
                            </th>
                            <th className="px-6 py-4 font-semibold cursor-pointer group hover:bg-slate-100" onClick={() => requestSort('assignee')}>
                                Assignee {getSortIndicator('assignee')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {processedTickets.map(ticket => {
                            const isWaiting = ticket.status === 'Open' && !ticket.technician_id;
                            const deptName = departments.find(d => d.id === ticket.category?.department_id)?.name || '-';
                            const assignee = isWaiting ? '-' : deptName;

                            return (
                                <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                                        <Link href={`/dashboard/tickets/${ticket.ticket_number}`} className="text-blue-600 hover:underline">
                                            #{ticket.ticket_number}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                        {new Date(ticket.updated_at || ticket.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                                            ticket.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                                            ticket.status === 'Diproses' ? 'bg-orange-100 text-orange-700' :
                                            'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-800 max-w-[200px] truncate font-medium">
                                        <Link href={`/dashboard/tickets/${ticket.ticket_number}`} className="hover:text-blue-600 transition-colors">
                                            {ticket.subject || 'Tanpa Subjek'}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">
                                        {deptName}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">
                                        {assignee}
                                    </td>
                                </tr>
                            );
                        })}
                        {processedTickets.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">
                                    Pengguna ini belum pernah mengirimkan tiket.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer / Export */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button 
                    onClick={handleExport}
                    disabled={processedTickets.length === 0}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    <span>Export CSV</span>
                </button>
            </div>
        </div>
    );
}
