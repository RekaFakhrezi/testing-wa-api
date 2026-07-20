import React from 'react';

export const dynamic = 'force-dynamic';

export default function AdminReportsPage() {
    return (
        <div className="w-full h-full p-6 md:p-10 font-sans text-slate-800">
            <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Laporan & Ekspor Data</h1>
                        <p className="text-slate-500 mt-1">Unduh data operasional Helpdesk untuk keperluan laporan (Format CSV/Excel).</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
                    <form action="/api/reports/tickets" method="GET" target="_blank" className="space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Dari Tanggal Masuk</label>
                                <input 
                                    type="date" 
                                    name="startDate"
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                                />
                                <p className="text-xs text-slate-400 mt-1">Kosongkan jika ingin mengambil semua data dari awal</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Sampai Tanggal Masuk</label>
                                <input 
                                    type="date" 
                                    name="endDate"
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                                />
                                <p className="text-xs text-slate-400 mt-1">Kosongkan jika ingin mengambil data hingga hari ini</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Status Tiket</label>
                            <select 
                                name="status" 
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                            >
                                <option value="">Semua Status</option>
                                <option value="Open">Open (Baru Masuk)</option>
                                <option value="Diproses">Diproses (Ditangani Teknisi)</option>
                                <option value="Selesai/Close">Selesai / Close (Telah Teratasi)</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="text-sm text-slate-500">
                                <strong>Info:</strong> Data yang diunduh mencakup Nomor Tiket, Identitas Pelapor, Kategori, Status, dan Detail Waktu Penanganan.
                            </div>
                            <button 
                                type="submit"
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Unduh CSV (Excel)
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
