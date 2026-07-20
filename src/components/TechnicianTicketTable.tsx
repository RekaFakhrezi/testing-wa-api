'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

type Ticket = any;
type Category = { id: string, name: string };

export default function TechnicianTicketTable({
    openTickets,
    myTasks,
    categories,
    currentUserId,
    activeTab
}: {
    openTickets: Ticket[],
    myTasks: Ticket[],
    categories: Category[],
    currentUserId: string,
    activeTab: 'open' | 'my_tasks'
}) {
    
    // States for filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // States for sorting
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const [isLoading, setIsLoading] = useState(false);

    // Reset handler
    const handleReset = () => {
        setSearchQuery('');
        setSelectedCategory('');
        setStartDate('');
        setEndDate('');
        setSortConfig(null);
    };

    // Sorting handler
    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleAssignToMe = async (ticketId: string) => {
        if (!confirm('Ambil tiket ini? Tiket akan masuk ke daftar tugas Anda.')) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/tickets/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId })
            });
            if (res.ok) {
                window.location.reload();
            } else {
                alert('Gagal mengambil tiket.');
            }
        } catch (e) {
            alert('Terjadi kesalahan.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportCSV = () => {
        const ticketsToExport = activeTab === 'open' ? openTickets : myTasks;
        if (ticketsToExport.length === 0) {
            alert('Tidak ada data untuk diekspor.');
            return;
        }

        const headers = ['No. Tiket', 'Waktu Masuk', 'Subjek', 'Status', 'Pelapor', 'Kategori'];
        
        const rows = ticketsToExport.map((t: any) => [
            t.ticket_number,
            new Date(t.created_at).toLocaleString('id-ID'),
            `"${(t.subject || t.category?.name || 'Tanpa Subjek').replace(/"/g, '""')}"`,
            t.status,
            `"${(t.reporter?.name || '').replace(/"/g, '""')}"`,
            `"${(t.category?.name || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `export_tiket_teknisi_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const ticketsToDisplay = activeTab === 'open' ? openTickets : myTasks;

    const processedTickets = useMemo(() => {
        let filtered = [...ticketsToDisplay];
        // 1. Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(t => 
                t.ticket_number?.toLowerCase().includes(q) ||
                t.subject?.toLowerCase().includes(q) ||
                t.reporter?.name?.toLowerCase().includes(q)
            );
        }
        
        // 2. Category filter
        if (selectedCategory) {
            filtered = filtered.filter(t => t.category_id === selectedCategory);
        }

        // 3. Date Range filter (Advanced)
        if (startDate) {
            filtered = filtered.filter(t => new Date(t.created_at) >= new Date(startDate));
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1);
            filtered = filtered.filter(t => new Date(t.created_at) <= end);
        }

        // 4. Sorting
        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'reporter') aValue = a.reporter?.name || '';
                if (sortConfig.key === 'reporter') bValue = b.reporter?.name || '';
                if (sortConfig.key === 'subject') aValue = a.subject || a.category?.name || '';
                if (sortConfig.key === 'subject') bValue = b.subject || b.category?.name || '';

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filtered;
    }, [ticketsToDisplay, searchQuery, selectedCategory, startDate, endDate, sortConfig]);

    // UI Helper for Sort Arrows
    const getSortArrow = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return <span className="text-slate-300 ml-1">↕</span>;
        return sortConfig.direction === 'asc' ? <span className="text-blue-600 ml-1">↑</span> : <span className="text-blue-600 ml-1">↓</span>;
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            {/* Filter Toolbar */}
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
                <div className="relative flex-grow max-w-sm">
                    <input 
                        type="text" 
                        placeholder="Search ticket..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500"
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
                </div>
                <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-600 outline-none focus:border-blue-500"
                >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`py-2 px-4 border rounded-lg text-sm font-medium transition-colors ${showAdvanced ? 'bg-slate-200 border-slate-300 text-slate-800' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                >
                    ⚙️ Advanced
                </button>

                {(searchQuery || selectedCategory || startDate || endDate || sortConfig) && (
                    <button 
                        onClick={handleReset}
                        className="py-2 px-4 border border-slate-300 rounded-lg text-sm font-medium bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        ↺ Reset
                    </button>
                )}
                
                <div className="ml-auto text-sm text-slate-500">
                    Showing {processedTickets.length} tickets
                </div>
            </div>

            {/* Advanced Filters Pane */}
            {showAdvanced && (
                <div className="p-4 border-b border-slate-200 bg-slate-100 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="text-sm font-medium text-slate-700">Date Range:</div>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="py-1.5 px-3 border border-slate-300 rounded-md text-sm outline-none"
                    />
                    <span className="text-slate-400">-</span>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="py-1.5 px-3 border border-slate-300 rounded-md text-sm outline-none"
                    />
                </div>
            )}
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap" onClick={() => requestSort('ticket_number')}>
                                <div className="flex items-center gap-1">Ticket {getSortArrow('ticket_number')}</div>
                            </th>
                            <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap" onClick={() => requestSort('created_at')}>
                                <div className="flex items-center gap-1">Date {getSortArrow('created_at')}</div>
                            </th>
                            <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap" onClick={() => requestSort('subject')}>
                                <div className="flex items-center gap-1">Subject {getSortArrow('subject')}</div>
                            </th>
                            <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap" onClick={() => requestSort('reporter')}>
                                <div className="flex items-center gap-1">From {getSortArrow('reporter')}</div>
                            </th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Priority</th>
                            <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {processedTickets.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-20 text-slate-400">
                                    Tidak ada tiket yang ditemukan.
                                </td>
                            </tr>
                        ) : (
                            processedTickets.map(ticket => (
                                <tr key={ticket.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                                        <Link href={`/dashboard/tickets/${ticket.ticket_number}`} className="font-semibold text-blue-600 hover:underline">
                                            {ticket.ticket_number}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 align-middle text-slate-500 whitespace-nowrap">
                                        {new Date(ticket.created_at).toISOString().split('T')[0]}
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                        <Link href={`/dashboard/tickets/${ticket.ticket_number}`} className="font-semibold text-slate-800 hover:text-blue-600 hover:underline block mb-1">
                                            {ticket.subject || ticket.category?.name}
                                        </Link>
                                        <div className="text-xs text-slate-500">{ticket.category?.name}</div>
                                    </td>
                                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                                        <div className="font-medium text-slate-700">{ticket.reporter?.name}</div>
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-md border border-slate-200">
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 align-middle text-right">
                                        {activeTab === 'open' ? (
                                            <button 
                                                onClick={() => handleAssignToMe(ticket.id)}
                                                disabled={isLoading}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                Ambil Tiket
                                            </button>
                                        ) : (
                                            <Link 
                                                href={`/dashboard/tickets/${ticket.ticket_number}`}
                                                className="px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-semibold rounded-lg transition-colors inline-block"
                                            >
                                                Lihat / Kerjakan
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer / Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                <button 
                    onClick={handleExportCSV}
                    className="py-2 px-4 bg-emerald-600 border border-emerald-700 rounded-lg text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
                >
                    ⬇ Export CSV
                </button>
            </div>
        </div>
    );
}
