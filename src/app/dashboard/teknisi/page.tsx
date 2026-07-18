import { createClient } from '@/src/lib/supabase/server';
import React from 'react';
import ResolveButton from '@/src/components/ResolveButton';

export const dynamic = 'force-dynamic';

export default async function TeknisiDashboard() {
    const supabase = await createClient();

    // Mengambil tiket yang berstatus 'Diproses' dan relasinya
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
            *,
            reporter:reporter_id (name, identity_number, faculty_unit, phone_number),
            category:category_id (name),
            technician:technician_id (name)
        `)
        .eq('status', 'Diproses')
        .order('created_at', { ascending: false });

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-200">
            {/* Header Premium */}
            <div className="mb-10 p-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl flex items-center justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -ml-20 -mt-20"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 tracking-tight">
                        Dashboard Teknisi
                    </h1>
                    <p className="text-base text-slate-400 mt-2 font-medium">
                        Daftar tugas (Assigned Tickets) yang sedang Anda tangani.
                    </p>
                </div>
                <div className="relative z-10 flex flex-col items-center justify-center w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                    <span className="text-3xl">{tickets?.length || 0}</span>
                    <span className="text-[10px] uppercase tracking-wider mt-1 opacity-80 text-center leading-tight">Sedang<br/>Dikerjakan</span>
                </div>
            </div>

            {/* Kanban / List Tugas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {error && (
                    <div className="col-span-full p-6 text-center text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl">
                        ❌ Gagal memuat tugas: {error.message}
                    </div>
                )}

                {tickets && tickets.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
                        <span className="text-6xl block mb-4 animate-pulse">🏝️</span>
                        <span className="text-lg text-slate-400 font-medium">Tidak ada tugas aktif. Waktunya bersantai!</span>
                    </div>
                )}

                {tickets && tickets.map((ticket) => (
                    <div key={ticket.id} className="flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-xl hover:bg-white/10 transition-all duration-300 group">
                        {/* Card Header */}
                        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/20">
                            <div>
                                <span className="text-xs font-bold px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-md uppercase tracking-wider border border-emerald-500/30">
                                    #{ticket.ticket_number}
                                </span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-wider ${
                                ticket.priority === 'Kritis' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                ticket.priority === 'Tinggi' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                ticket.priority === 'Sedang' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                'bg-slate-500/20 text-slate-400 border-slate-500/30'
                            }`}>
                                {ticket.priority}
                            </span>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 flex-grow flex flex-col gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                                    {ticket.category?.name}
                                </h3>
                                <p className="text-sm text-slate-400 mt-2 line-clamp-3">
                                    {ticket.description}
                                </p>
                            </div>

                            <div className="mt-auto pt-4 border-t border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-white font-bold shadow-inner">
                                        {ticket.reporter?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-200">{ticket.reporter?.name}</div>
                                        <div className="text-[10px] text-slate-400">{ticket.reporter?.identity_number} • {ticket.reporter?.faculty_unit}</div>
                                    </div>
                                </div>
                            </div>
                            
                            {ticket.attachment_url && (
                                <a href={ticket.attachment_url} target="_blank" rel="noreferrer" className="block text-center text-xs font-semibold text-emerald-400 hover:text-emerald-300 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-colors border border-emerald-500/20 mb-2">
                                    📎 Lihat Lampiran Bukti
                                </a>
                            )}
                            
                            {ticket.reporter?.phone_number && (
                                <a href={`https://wa.me/${ticket.reporter.phone_number.replace(/^0/, '62')}`} target="_blank" rel="noreferrer" className="block text-center text-xs font-semibold text-green-400 hover:text-green-300 py-2 bg-green-500/10 hover:bg-green-500/20 rounded-xl transition-colors border border-green-500/20">
                                    💬 Hubungi Pelapor via WA
                                </a>
                            )}
                        </div>

                        {/* Card Footer (Actions) */}
                        <div className="p-5 border-t border-white/10 bg-black/30">
                            <ResolveButton ticketId={ticket.id} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}