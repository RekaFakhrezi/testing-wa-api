'use client';

import React, { useState } from 'react';
import { createTechnician } from '@/src/app/dashboard/admin/technicians/actions';
import Link from 'next/link';

export default function TechnicianTabContent({ 
    techniciansWithWorkload,
    departments
}: { 
    techniciansWithWorkload: any[],
    departments: any[]
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            const res = await createTechnician(formData);
            if (res.error) {
                alert(res.error);
            } else {
                setIsModalOpen(false);
            }
        } catch (err) {
            alert('Terjadi kesalahan sistem.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header section (optional, or just use the button) */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Daftar Teknisi</h2>
                    <p className="text-sm text-slate-500 mt-1">Pantau beban kerja (workload) teknisi yang sedang menangani tiket berjalan.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors shadow-sm"
                    >
                        + Tambah Teknisi Baru
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {techniciansWithWorkload.map(tech => (
                    <div key={tech.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center relative overflow-hidden group hover:shadow-md transition-shadow">
                        {/* Workload Indicator */}
                        <div className={`absolute top-0 left-0 w-full h-1 ${
                            tech.workload === 0 ? 'bg-slate-200' :
                            tech.workload < 3 ? 'bg-emerald-400' :
                            tech.workload < 6 ? 'bg-orange-400' :
                            'bg-red-500'
                        }`} />
                        
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400 mb-4 uppercase">
                            {tech.name.substring(0, 2)}
                        </div>
                        
                        <h2 className="text-lg font-bold text-slate-800 mb-1 text-center">{tech.name}</h2>
                        <p className="text-sm text-slate-500 font-mono mb-1">{tech.phone_number}</p>
                        <p className="text-xs text-blue-600 font-semibold mb-4 text-center">
                            {departments.find(d => d.id === tech.department_id)?.name || 'Tanpa Departemen'}
                        </p>
                        
                        <div className="w-full bg-slate-50 rounded-xl p-4 flex justify-between items-center border border-slate-100 mt-auto">
                            <div>
                                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Beban Kerja Aktif</span>
                                <span className={`text-2xl font-black ${
                                    tech.workload === 0 ? 'text-slate-400' :
                                    tech.workload < 3 ? 'text-emerald-600' :
                                    tech.workload < 6 ? 'text-orange-600' :
                                    'text-red-600'
                                }`}>
                                    {tech.workload}
                                </span>
                                <span className="text-xs text-slate-500 font-semibold ml-1">Tiket Diproses</span>
                            </div>
                        </div>
                    </div>
                ))}

                {techniciansWithWorkload.length === 0 && (
                    <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-10 text-center">
                        <h3 className="text-lg font-bold text-slate-600">Belum ada Teknisi</h3>
                        <p className="text-slate-400 mt-2">Silakan tambahkan teknisi baru.</p>
                    </div>
                )}
            </div>

            {/* Modal Tambah Teknisi */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Tambah Teknisi Baru</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Nama Teknisi <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    required
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Contoh: Budi Jaringan"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Nomor WhatsApp <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    name="phone_number" 
                                    required
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Contoh: 08123456789"
                                />
                                <p className="text-xs text-slate-400 mt-1">Nomor ini akan digunakan teknisi untuk menerima notifikasi.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Departemen <span className="text-red-500">*</span></label>
                                <select 
                                    name="department_id" 
                                    required
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                >
                                    <option value="">-- Pilih Departemen --</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 bg-slate-900 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-70"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
