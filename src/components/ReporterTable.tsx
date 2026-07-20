'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

type Reporter = {
    id: string;
    name: string;
    phone_number: string;
    first_ticket_date: string;
};

export default function ReporterTable({ reporters }: { reporters: Reporter[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(reporters.map(r => r.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const toggleOne = (id: string, checked: boolean) => {
        const next = new Set(selectedIds);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedIds(next);
    };

    const processedReporters = useMemo(() => {
        let filtered = [...reporters];
        
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(r => 
                (r.name && r.name.toLowerCase().includes(q)) ||
                (r.phone_number && r.phone_number.includes(q))
            );
        }

        if (sortConfig) {
            filtered.sort((a, b) => {
                let aVal: any = a[sortConfig.key as keyof Reporter];
                let bVal: any = b[sortConfig.key as keyof Reporter];

                if (sortConfig.key === 'first_ticket_date') {
                    aVal = new Date(aVal).getTime();
                    bVal = new Date(bVal).getTime();
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [reporters, searchQuery, sortConfig]);

    const getSortIndicator = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <span className="text-slate-300 ml-1">↕</span>;
        }
        return sortConfig.direction === 'asc' ? <span className="text-blue-600 ml-1">↑</span> : <span className="text-blue-600 ml-1">↓</span>;
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
                    <input 
                        type="text" 
                        placeholder="Cari nama atau nomor WhatsApp..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                {selectedIds.size > 0 && (
                    <div className="text-sm text-slate-600 font-medium px-4 py-2 bg-slate-100 rounded-lg">
                        {selectedIds.size} Pelapor dipilih
                    </div>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-semibold w-12 text-center">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                                    checked={selectedIds.size === reporters.length && reporters.length > 0}
                                    onChange={(e) => toggleAll(e.target.checked)}
                                />
                            </th>
                            <th className="px-6 py-4 font-semibold cursor-pointer group hover:bg-slate-100" onClick={() => requestSort('name')}>
                                Name {getSortIndicator('name')}
                            </th>
                            <th className="px-6 py-4 font-semibold cursor-pointer group hover:bg-slate-100" onClick={() => requestSort('first_ticket_date')}>
                                Created {getSortIndicator('first_ticket_date')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {processedReporters.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                                        checked={selectedIds.has(user.id)}
                                        onChange={(e) => toggleOne(user.id, e.target.checked)}
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link href={`/dashboard/admin/users/${user.id}`} className="font-medium text-blue-600 hover:underline">
                                        {user.name || 'Tanpa Nama'}
                                    </Link>
                                    <div className="text-xs text-slate-500 font-mono mt-0.5">{user.phone_number}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                    {new Date(user.first_ticket_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </td>
                            </tr>
                        ))}
                        {processedReporters.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-slate-500 italic">
                                    Tidak ada pelapor ditemukan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
