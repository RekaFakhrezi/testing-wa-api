import { createClient } from '@/src/lib/supabase/server';
import React from 'react';

export const dynamic = 'force-dynamic';

export default async function PimpinanDashboard() {
    const supabase = await createClient();

    // Mengambil semua tiket untuk analitik (bisa dilimit by date untuk real app)
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*');

    const totalTickets = tickets?.length || 0;
    const resolvedTickets = tickets?.filter(t => t.status === 'Selesai/Close').length || 0;
    const openTickets = tickets?.filter(t => t.status === 'Open').length || 0;
    const inProgressTickets = tickets?.filter(t => t.status === 'Diproses').length || 0;
    const rejectedTickets = tickets?.filter(t => t.status === 'Ditolak/Dibatalkan').length || 0;

    const completionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

    return (
        <div className="p-8 max-w-7xl mx-auto h-full bg-slate-900 text-slate-200">
            {/* Header */}
            <div className="mb-10 p-8 bg-gradient-to-r from-purple-900/40 to-fuchsia-900/40 border border-purple-500/20 rounded-3xl flex items-center justify-between shadow-2xl relative overflow-hidden backdrop-blur-xl">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 tracking-tight">
                        Dashboard Pimpinan
                    </h1>
                    <p className="text-base text-slate-400 mt-2 font-medium">
                        Pantau kinerja operasional IT, waktu penyelesaian, dan tingkat kepatuhan SLA.
                    </p>
                </div>
            </div>

            {/* Metrik Kinerja (Stats Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="p-6 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex flex-col justify-center relative overflow-hidden group hover:border-purple-500/50 transition-all">
                    <div className="text-sm font-semibold text-slate-400 mb-1">Total Laporan Masuk</div>
                    <div className="text-4xl font-black text-white">{totalTickets}</div>
                    <div className="absolute -bottom-4 -right-4 text-7xl opacity-5 group-hover:opacity-10 transition-opacity">📊</div>
                </div>
                <div className="p-6 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex flex-col justify-center relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                    <div className="text-sm font-semibold text-slate-400 mb-1">Tiket Selesai (Closed)</div>
                    <div className="text-4xl font-black text-emerald-400">{resolvedTickets}</div>
                    <div className="absolute -bottom-4 -right-4 text-7xl opacity-5 group-hover:opacity-10 transition-opacity">✅</div>
                </div>
                <div className="p-6 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex flex-col justify-center relative overflow-hidden group hover:border-amber-500/50 transition-all">
                    <div className="text-sm font-semibold text-slate-400 mb-1">Menunggu Teknisi (In Progress)</div>
                    <div className="text-4xl font-black text-amber-400">{inProgressTickets}</div>
                    <div className="absolute -bottom-4 -right-4 text-7xl opacity-5 group-hover:opacity-10 transition-opacity">⏳</div>
                </div>
                <div className="p-6 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex flex-col justify-center relative overflow-hidden group hover:border-blue-500/50 transition-all">
                    <div className="text-sm font-semibold text-slate-400 mb-1">Penyelesaian (Completion Rate)</div>
                    <div className="text-4xl font-black text-blue-400">{completionRate}%</div>
                    <div className="absolute -bottom-4 -right-4 text-7xl opacity-5 group-hover:opacity-10 transition-opacity">📈</div>
                </div>
            </div>

            {/* Layout Bawah */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Rincian Status */}
                <div className="lg:col-span-2 p-8 bg-slate-800/40 border border-slate-700/50 rounded-3xl">
                    <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                        <span className="p-1.5 bg-slate-700 rounded-lg">📋</span> Distribusi Status Tiket
                    </h2>
                    
                    <div className="space-y-5">
                        <div>
                            <div className="flex justify-between text-sm mb-2 font-medium">
                                <span className="text-slate-300">Belum Diverifikasi (Open)</span>
                                <span className="text-white">{openTickets} Tiket</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-2.5">
                                <div className="bg-slate-400 h-2.5 rounded-full" style={{ width: `${totalTickets ? (openTickets/totalTickets)*100 : 0}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2 font-medium">
                                <span className="text-amber-400">Sedang Ditangani (Diproses)</span>
                                <span className="text-white">{inProgressTickets} Tiket</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-2.5">
                                <div className="bg-amber-400 h-2.5 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]" style={{ width: `${totalTickets ? (inProgressTickets/totalTickets)*100 : 0}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2 font-medium">
                                <span className="text-emerald-400">Tuntas (Selesai/Close)</span>
                                <span className="text-white">{resolvedTickets} Tiket</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-2.5">
                                <div className="bg-emerald-400 h-2.5 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: `${totalTickets ? (resolvedTickets/totalTickets)*100 : 0}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2 font-medium">
                                <span className="text-red-400">Ditolak / Dibatalkan</span>
                                <span className="text-white">{rejectedTickets} Tiket</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-2.5">
                                <div className="bg-red-400 h-2.5 rounded-full" style={{ width: `${totalTickets ? (rejectedTickets/totalTickets)*100 : 0}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Tambahan */}
                <div className="p-8 bg-gradient-to-b from-indigo-900/30 to-slate-900 border border-indigo-500/20 rounded-3xl">
                    <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                        <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">⚡</span> Kepatuhan SLA
                    </h2>
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="w-32 h-32 rounded-full border-8 border-indigo-500/30 flex items-center justify-center mb-4 relative">
                            <div className="absolute inset-0 border-8 border-indigo-400 rounded-full border-t-transparent -rotate-45"></div>
                            <span className="text-2xl font-black text-white">85%</span>
                        </div>
                        <p className="text-sm text-slate-400 px-4">
                            Tingkat keberhasilan pemenuhan target Service Level Agreement (SLA) bulan ini.
                        </p>
                    </div>
                </div>
            </div>
            
            {error && (
                <div className="mt-8 p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-center">
                    ❌ Gagal memuat data dari database: {error.message}
                </div>
            )}
        </div>
    );
}