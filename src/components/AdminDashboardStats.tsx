'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import AdminStatisticsTable from './AdminStatisticsTable';

export default function AdminDashboardStats({ tickets, slaConfigs }: { tickets: any[], slaConfigs: any[] }) {
    
    // Date Filter State (Default to last 30 days)
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState<string>(() => {
        return new Date().toISOString().split('T')[0];
    });

    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            const ticketDate = t.created_at.split('T')[0];
            return ticketDate >= startDate && ticketDate <= endDate;
        });
    }, [tickets, startDate, endDate]);

    // Process Data for Line Chart (Tickets per day for the selected date range)
    const trendData = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const data = [];
        
        // Limit max days to prevent performance issues (e.g., 90 days max)
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const maxDays = Math.min(diffDays, 90);

        for (let i = 0; i <= maxDays; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const count = filteredTickets.filter(t => t.created_at.startsWith(dateStr)).length;
            const [y, m, day] = dateStr.split('-');
            data.push({ 
                name: `${day}/${m}`, 
                Total: count 
            });
        }
        return data;
    }, [startDate, endDate, filteredTickets]);

    // Process Data for Pie Chart (Category Distribution) - User said "gpp gitu aja" so we can still use unfiltered or filtered. Let's use unfiltered as requested "sissanya gpp gitu aja".
    const pieData = useMemo(() => {
        const catMap: Record<string, number> = {};
        tickets.forEach(t => {
            const catName = t.category?.name || 'Tanpa Kategori';
            const rootCat = catName.split('/')[0].trim();
            catMap[rootCat] = (catMap[rootCat] || 0) + 1;
        });

        return Object.entries(catMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [tickets]);

    const COLORS = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

    return (
        <div className="space-y-6 mt-8">
            {/* Filter Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                <div className="text-sm font-semibold text-slate-700">Report timeframe:</div>
                <div className="flex items-center gap-2">
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 text-slate-700"
                    />
                    <span className="text-slate-500">-</span>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 text-slate-700"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Line Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Tren Tiket Masuk</h3>
                    <div className="flex-grow min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="Total" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Distribusi Kategori Keluhan (All Time)</h3>
                    <div className="flex-grow min-h-[250px] flex justify-center items-center">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-slate-400 text-sm">Data belum cukup.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Statistics Table */}
            <AdminStatisticsTable tickets={filteredTickets} slaConfigs={slaConfigs} dateRange={{ start: startDate, end: endDate }} />
        </div>
    );
}
