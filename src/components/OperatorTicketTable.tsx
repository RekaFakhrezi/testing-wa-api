'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import OperatorActions from './OperatorActions';

type Ticket = any; // simplified for this example
type Category = { id: string, name: string };
type Technician = { id: string, name: string };

export default function OperatorTicketTable({
    initialTickets,
    categories,
    technicians
}: {
    initialTickets: Ticket[],
    categories: Category[],
    technicians: Technician[]
}) {
    // States for filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // States for sorting
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

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

                <button 
                    onClick={handleReset}
                    className="py-2 px-4 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    ↺ Reset
                </button>

                <div className="ml-auto">
                    <span className="text-sm text-slate-500 font-medium">Showing {processedTickets.length} tickets</span>
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
                            <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => requestSort('ticket_number')}>
                                Ticket {getSortArrow('ticket_number')}
                            </th>
                            <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => requestSort('created_at')}>
                                Last Updated {getSortArrow('created_at')}
                            </th>
                            <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => requestSort('subject')}>
                                Subject {getSortArrow('subject')}
                            </th>
                            <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => requestSort('reporter')}>
                                From {getSortArrow('reporter')}
                            </th>
                            <th className="px-6 py-4 font-semibold">Category</th>
                            <th className="px-6 py-4 font-semibold">Priority</th>
                            <th className="px-6 py-4 font-semibold">Assigned To</th>
                            <th className="px-6 py-4 font-semibold text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {processedTickets.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-20 text-slate-400">
                                    Tidak ada tiket yang sesuai dengan filter.
                                </td>
                            </tr>
                        ) : (
                            processedTickets.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 align-top">
                                        <Link href={`/dashboard/tickets/${ticket.ticket_number}`} className="font-semibold text-blue-600 hover:underline">
                                            {ticket.ticket_number}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 align-top text-slate-500 whitespace-nowrap">
                                        {new Date(ticket.created_at).toISOString().split('T')[0]}<br/>
                                        <span className="text-xs">{new Date(ticket.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <Link href={`/dashboard/tickets/${ticket.ticket_number}`} className="font-semibold text-slate-800 hover:text-blue-600 hover:underline block mb-1">
                                            {ticket.subject || ticket.category?.name || 'Tanpa Subjek'}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 align-top whitespace-nowrap">
                                        <div className="font-semibold text-slate-700">{ticket.reporter?.name}</div>
                                    </td>
                                    <OperatorActions 
                                        ticketId={ticket.id} 
                                        technicians={technicians} 
                                        categories={categories}
                                        currentCategoryId={ticket.category_id}
                                    />
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
