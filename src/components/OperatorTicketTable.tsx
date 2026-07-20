'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import OperatorActions from './OperatorActions';

type Ticket = any; // simplified for this example
type Category = { id: string, name: string };
type Department = { id: string, name: string };

export default function OperatorTicketTable({
    initialTickets,
    categories,
    mainCategories,
    departments
}: {
    initialTickets: Ticket[],
    categories: Category[],
    mainCategories: Category[],
    departments: Department[]
}) {
    // States for filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Bulk action state
    const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
    const [isBulkRejecting, setIsBulkRejecting] = useState(false);

    // States for sorting
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    // Reset handler
    const handleReset = () => {
        setSearchQuery('');
        setSelectedCategory('');
        setStartDate('');
        setEndDate('');
        setSortConfig(null);
        setSelectedTickets([]);
    };

    // Sorting handler
    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Bulk actions
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedTickets(processedTickets.map(t => t.id));
        } else {
            setSelectedTickets([]);
        }
    };

    const handleSelect = (id: string) => {
        if (selectedTickets.includes(id)) {
            setSelectedTickets(selectedTickets.filter(tId => tId !== id));
        } else {
            setSelectedTickets([...selectedTickets, id]);
        }
    };

    const handleBulkReject = async () => {
        if (selectedTickets.length === 0) return;
        if (!confirm(`Apakah Anda yakin ingin MENOLAK ${selectedTickets.length} tiket yang dipilih secara otomatis?`)) return;

        setIsBulkRejecting(true);
        try {
            // Because we don't have a bulk API yet, we can Promise.all the existing endpoint for simplicity,
            // or create a bulk endpoint. Since there's an existing endpoint, let's just loop.
            const promises = selectedTickets.map(ticketId => 
                fetch('/api/tickets/operator', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        ticketId, 
                        actionType: 'reject'
                    })
                })
            );

            await Promise.all(promises);
            
            // Reload page to reflect changes
            window.location.reload();
        } catch (error) {
            console.error('Bulk reject error:', error);
            alert('Terjadi kesalahan saat memproses bulk reject.');
        } finally {
            setIsBulkRejecting(false);
            setSelectedTickets([]);
        }
    };

    const handleExportCSV = () => {
        if (processedTickets.length === 0) {
            alert('Tidak ada data untuk diekspor.');
            return;
        }

        const headers = ['No. Tiket', 'Waktu Masuk', 'Subjek', 'Status', 'Pelapor', 'Unit/Fakultas', 'Kategori', 'Overdue'];
        
        const rows = processedTickets.map(t => [
            t.ticket_number,
            new Date(t.created_at).toLocaleString('id-ID'),
            `"${(t.subject || t.category?.name || 'Tanpa Subjek').replace(/"/g, '""')}"`,
            t.status,
            `"${(t.reporter?.name || '').replace(/"/g, '""')}"`,
            `"${(t.reporter?.faculty_unit || '').replace(/"/g, '""')}"`,
            `"${(t.category?.name || '').replace(/"/g, '""')}"`,
            t.is_overdue ? 'Ya' : 'Tidak'
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `export_tiket_operator_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter and Sort Logic
    const processedTickets = useMemo(() => {
        let filtered = [...initialTickets];

        // 1. Search filter
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(t => 
                t.ticket_number?.toLowerCase().includes(lowerQuery) ||
                t.subject?.toLowerCase().includes(lowerQuery) ||
                t.reporter?.name?.toLowerCase().includes(lowerQuery)
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
            // End date inclusive (add 1 day to cover the whole day)
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1);
            filtered = filtered.filter(t => new Date(t.created_at) <= end);
        }

        // 4. Sorting
        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle nested relations for sorting
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
    }, [initialTickets, searchQuery, selectedCategory, startDate, endDate, sortConfig]);

    // UI Helper for Sort Arrows
    const getSortArrow = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return <span className="text-slate-300 ml-1">↕</span>;
        return sortConfig.direction === 'asc' ? <span className="text-blue-600 ml-1">↑</span> : <span className="text-blue-600 ml-1">↓</span>;
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            
            {/* Filter Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center gap-3">
                <div className="relative flex-grow max-w-sm">
                    <input 
                        type="text" 
                        placeholder="Search ticket..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
                </div>

                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
                >
                    <option value="">All Categories</option>
                    {mainCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`py-2 px-4 border rounded-lg text-sm font-medium transition-colors ${showAdvanced ? 'bg-slate-200 border-slate-300 text-slate-800' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                >
                    ⚙️ Advanced
                </button>

                <button 
                    onClick={handleReset}
                    className="py-2 px-4 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    ↺ Reset
                </button>

                <div className="ml-auto flex items-center gap-3">
                    {selectedTickets.length > 0 && (
                        <button 
                            onClick={handleBulkReject}
                            disabled={isBulkRejecting}
                            className="py-2 px-4 bg-red-600 border border-red-700 rounded-lg text-sm font-bold text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {isBulkRejecting ? 'Memproses...' : `Tolak Terpilih (${selectedTickets.length})`}
                        </button>
                    )}
                    <span className="text-sm text-slate-500 font-medium whitespace-nowrap hidden sm:block">
                        Showing {processedTickets.length} tickets
                    </span>
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
                    <thead className="text-xs text-slate-500 bg-white border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap w-10">
                                <input 
                                    type="checkbox" 
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    checked={selectedTickets.length === processedTickets.length && processedTickets.length > 0}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-50 transition-colors whitespace-nowrap" onClick={() => requestSort('ticket_number')}>
                                <div className="flex items-center gap-1">Ticket {getSortArrow('ticket_number')}</div>
                            </th>
                            <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-50 transition-colors whitespace-nowrap" onClick={() => requestSort('created_at')}>
                                <div className="flex items-center gap-1">Last Updated {getSortArrow('created_at')}</div>
                            </th>
                            <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-50 transition-colors whitespace-nowrap" onClick={() => requestSort('subject')}>
                                <div className="flex items-center gap-1">Subject {getSortArrow('subject')}</div>
                            </th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Status</th>
                            <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-50 transition-colors whitespace-nowrap" onClick={() => requestSort('reporter')}>
                                <div className="flex items-center gap-1">From {getSortArrow('reporter')}</div>
                            </th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Category</th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Priority</th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">Assigned To</th>
                            <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {processedTickets.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="text-center py-20 text-slate-400">
                                    Tidak ada tiket yang sesuai dengan filter.
                                </td>
                            </tr>
                        ) : (
                            processedTickets.map((ticket) => (
                                <tr key={ticket.id} className={`transition-colors ${selectedTickets.includes(ticket.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                                    <td className="px-4 py-3 align-middle w-10">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            checked={selectedTickets.includes(ticket.id)}
                                            onChange={() => handleSelect(ticket.id)}
                                        />
                                    </td>
                                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                                        <Link href={`/dashboard/tickets/${ticket.ticket_number}`} className="font-semibold text-blue-600 hover:underline">
                                            {ticket.ticket_number}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 align-middle text-slate-500 whitespace-nowrap">
                                        {new Date(ticket.created_at).toISOString().split('T')[0]} <span className="text-xs ml-1">{new Date(ticket.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                        <Link href={`/dashboard/tickets/${ticket.ticket_number}`} className="font-semibold text-slate-800 hover:text-blue-600 hover:underline block mb-1 leading-tight line-clamp-2">
                                            {ticket.subject || ticket.category?.name || 'Tanpa Subjek'}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col gap-1 items-start">
                                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                                            ticket.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                                            ticket.status === 'Diproses' ? 'bg-orange-100 text-orange-700' :
                                            'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {ticket.status}
                                        </span>
                                        {ticket.is_overdue && (
                                            <span className="px-3 py-0.5 text-[9px] font-black rounded-full uppercase tracking-widest bg-red-600 text-white shadow-sm shadow-red-200 animate-pulse">
                                                OVERDUE
                                            </span>
                                        )}
                                    </div>
                                </td>
                                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                                        <div className="font-semibold text-slate-700 leading-tight">{ticket.reporter?.name}</div>
                                    </td>
                                    <OperatorActions 
                                        ticketId={ticket.id} 
                                        departments={departments} 
                                        categories={categories}
                                        currentCategoryId={ticket.category_id}
                                    />
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
