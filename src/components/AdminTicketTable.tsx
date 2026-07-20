'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

type Ticket = any;
type Category = { id: string, name: string };

export default function AdminTicketTable({
    tickets,
    categories,
    departments
}: {
    tickets: Ticket[],
    categories: Category[],
    departments?: { id: string, name: string }[]
}) {
    // States for tabs
    const [activeTab, setActiveTab] = useState<'search' | 'waiting' | 'open' | 'closed'>('search');

    // States for filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // States for sorting
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    // Reset handler
    const handleReset = () => {
        setSearchQuery('');
        setSelectedCategory('');
        setSelectedStatus('');
        setStartDate('');
        setEndDate('');
        setSelectedDepartment('');
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

    const handleExportCSV = () => {
        if (processedTickets.length === 0) {
            alert('Tidak ada data untuk diekspor.');
            return;
        }

        const headers = ['No. Tiket', 'Last Update', 'Subject', 'From', 'Priority', 'Assign To', 'Status', 'Overdue'];
        
        const rows = processedTickets.map((t: any) => {
            const isWaiting = t.status === 'Open' && !t.technician_id;
            const assignTo = isWaiting ? '-' : (departments?.find(d => d.id === t.category?.department_id)?.name || '-');
            const priority = isWaiting ? '-' : (t.priority || '-');

            return [
                t.ticket_number,
                new Date(t.updated_at || t.created_at).toLocaleString('id-ID'),
                `"${(t.subject || '').replace(/"/g, '""')}"`,
                `"${(t.reporter?.name || '').replace(/"/g, '""')}"`,
                priority,
                `"${assignTo.replace(/"/g, '""')}"`,
                t.status,
                t.is_overdue ? 'Ya' : 'Tidak'
            ];
        });

        const csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `export_tiket_admin_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const processedTickets = useMemo(() => {
        let filtered = [...tickets];
        
        // 0. Tab filter
        if (activeTab === 'waiting') {
            filtered = filtered.filter(t => t.status === 'Open' && !t.technician_id);
        } else if (activeTab === 'open') {
            filtered = filtered.filter(t => (t.status === 'Open' && t.technician_id) || t.status === 'Diproses');
        } else if (activeTab === 'closed') {
            filtered = filtered.filter(t => t.status === 'Selesai' || t.status === 'Selesai/Close' || t.status === 'Ditolak');
        }

        // 1. Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(t => 
                t.ticket_number?.toLowerCase().includes(q) ||
                t.subject?.toLowerCase().includes(q) ||
                t.reporter?.name?.toLowerCase().includes(q) ||
                t.technician?.name?.toLowerCase().includes(q)
            );
        }
        
        // 2. Category filter
        if (selectedCategory) {
            filtered = filtered.filter(t => t.category_id === selectedCategory);
        }

        // 3. Status filter
        if (selectedStatus) {
            filtered = filtered.filter(t => t.status === selectedStatus);
        }

        // 4. Date Range filter (Advanced)
        if (startDate) {
            filtered = filtered.filter(t => new Date(t.created_at) >= new Date(startDate));
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1);
            filtered = filtered.filter(t => new Date(t.created_at) <= end);
        }

        // 5. Department filter (Advanced)
        if (selectedDepartment) {
            filtered = filtered.filter(t => t.category?.department_id === selectedDepartment);
        }

        // 6. Sorting
        if (sortConfig) {
            filtered.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                // Handle nested keys for sorting (e.g. reporter.name)
                if (sortConfig.key === 'reporter.name') {
                    aVal = a.reporter?.name || '';
                    bVal = b.reporter?.name || '';
                } else if (sortConfig.key === 'assignTo') {
                    const deptA = departments?.find(d => d.id === a.category?.department_id)?.name || '';
                    const deptB = departments?.find(d => d.id === b.category?.department_id)?.name || '';
                    aVal = (a.status === 'Open' && !a.technician_id) ? '' : deptA;
                    bVal = (b.status === 'Open' && !b.technician_id) ? '' : deptB;
                } else if (sortConfig.key === 'updated_at') {
                    aVal = new Date(a.updated_at || a.created_at).getTime();
                    bVal = new Date(b.updated_at || b.created_at).getTime();
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        } else {
            // Default sort: newest first
            filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }

        return filtered;
    }, [tickets, activeTab, searchQuery, selectedCategory, selectedStatus, startDate, endDate, selectedDepartment, sortConfig]);

    const getSortIndicator = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <span className="text-slate-300 ml-1 inline-block w-3 opacity-0 group-hover:opacity-100">↕</span>;
        }
        return sortConfig.direction === 'asc' 
            ? <span className="text-blue-500 ml-1 inline-block w-3">↑</span> 
            : <span className="text-blue-500 ml-1 inline-block w-3">↓</span>;
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto scrollbar-hide">
                <button
                    onClick={() => setActiveTab('search')}
                    className={`px-6 py-4 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'search' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    Search (All)
                </button>
                <button
                    onClick={() => setActiveTab('waiting')}
                    className={`px-6 py-4 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'waiting' ? 'bg-white text-orange-600 border-b-2 border-orange-600' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    Waiting Verification
                </button>
                <button
                    onClick={() => setActiveTab('open')}
                    className={`px-6 py-4 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'open' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    Open Ticket
                </button>
                <button
                    onClick={() => setActiveTab('closed')}
                    className={`px-6 py-4 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'closed' ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    Closed
                </button>
            </div>

            {/* Filters Section */}
            <div className="p-6 border-b border-slate-200 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-grow">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Cari Tiket</label>
                        <input 
                            type="text" 
                            placeholder="Nomor tiket, subjek, pelapor, teknisi..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full text-sm border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    {/* Category Filter */}
                    <div className="w-full md:w-64">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Kategori</label>
                        <select 
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full text-sm border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            <option value="">Semua Kategori</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    {/* Status Filter */}
                    <div className="w-full md:w-48">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                        <select 
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full text-sm border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            <option value="">Semua Status</option>
                            <option value="Open">Open</option>
                            <option value="Diproses">Diproses</option>
                            <option value="Selesai/Close">Selesai/Close</option>
                            <option value="Selesai">Selesai</option>
                        </select>
                    </div>
                </div>

                {/* Advanced Filter Toggle */}
                <div className="flex items-center justify-between pt-2">
                    <button 
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        {showAdvanced ? '- Sembunyikan Filter Lanjut' : '+ Filter Lanjut (Tanggal)'}
                    </button>
                    {(searchQuery || selectedCategory || selectedStatus || startDate || endDate || sortConfig) && (
                        <button 
                            onClick={handleReset}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Reset Semua
                        </button>
                    )}
                </div>

                {/* Advanced Filters */}
                {showAdvanced && (
                    <div className="pt-4 flex flex-col md:flex-row gap-4 border-t border-slate-100">
                        <div className="w-full md:w-64">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Departemen / Unit</label>
                            <select 
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                className="w-full text-sm border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value="">Semua Departemen</option>
                                {departments?.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full md:w-48">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Dari Tanggal</label>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full text-sm border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Sampai Tanggal</label>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full text-sm border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-semibold cursor-pointer group hover:bg-slate-100" onClick={() => requestSort('ticket_number')}>
                                No. Tiket {getSortIndicator('ticket_number')}
                            </th>
                            <th className="px-6 py-4 font-semibold cursor-pointer group hover:bg-slate-100" onClick={() => requestSort('updated_at')}>
                                Last Update {getSortIndicator('updated_at')}
                            </th>
                            <th className="px-6 py-4 font-semibold cursor-pointer group hover:bg-slate-100" onClick={() => requestSort('subject')}>
                                Subject {getSortIndicator('subject')}
                            </th>
                            <th className="px-6 py-4 font-semibold cursor-pointer group hover:bg-slate-100" onClick={() => requestSort('reporter.name')}>
                                From {getSortIndicator('reporter.name')}
                            </th>
                            <th className="px-6 py-4 font-semibold cursor-pointer group hover:bg-slate-100" onClick={() => requestSort('priority')}>
                                Priority {getSortIndicator('priority')}
                            </th>
                            <th className="px-6 py-4 font-semibold cursor-pointer group hover:bg-slate-100" onClick={() => requestSort('assignTo')}>
                                Assign To {getSortIndicator('assignTo')}
                            </th>
                            <th className="px-6 py-4 font-semibold cursor-pointer group hover:bg-slate-100" onClick={() => requestSort('status')}>
                                Status {getSortIndicator('status')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {processedTickets.map(ticket => {
                            const isWaiting = ticket.status === 'Open' && !ticket.technician_id;
                            const assignTo = isWaiting ? '-' : (departments?.find(d => d.id === ticket.category?.department_id)?.name || '-');
                            const priority = isWaiting ? '-' : (ticket.priority || '-');

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
                                    <td className="px-6 py-4 text-slate-800 max-w-[200px] truncate font-medium">
                                        <Link href={`/dashboard/tickets/${ticket.ticket_number}`} className="hover:text-blue-600 transition-colors">
                                            {ticket.subject || 'Tanpa Subjek'}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-800">{ticket.reporter?.name}</div>
                                        <div className="text-xs text-slate-500">{ticket.reporter?.faculty_unit || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {priority}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">
                                        {assignTo}
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
                                </tr>
                            );
                        })}

                        {processedTickets.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-500 italic">
                                    Tidak ada tiket yang ditemukan dengan filter tersebut.
                                </td>
                            </tr>
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
