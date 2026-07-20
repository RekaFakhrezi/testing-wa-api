'use client';

import React, { useState } from 'react';
import { createDepartment, updateDepartment, deleteDepartment } from '@/src/app/dashboard/admin/technicians/actions';

export default function DepartmentTabContent({ 
    departments, 
    technicians 
}: { 
    departments: any[], 
    technicians: any[] 
}) {
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    
    const [editingDept, setEditingDept] = useState<any>(null);
    const [viewingDeptStaff, setViewingDeptStaff] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate staff counts
    const staffCount: Record<string, number> = {};
    const staffByDept: Record<string, any[]> = {};
    technicians.forEach(t => {
        if (t.department_id) {
            staffCount[t.department_id] = (staffCount[t.department_id] || 0) + 1;
            if (!staffByDept[t.department_id]) staffByDept[t.department_id] = [];
            staffByDept[t.department_id].push(t);
        }
    });

    const handleOpenDeptModal = (dept: any = null) => {
        setEditingDept(dept);
        setIsDeptModalOpen(true);
    };

    const handleCloseDeptModal = () => {
        setEditingDept(null);
        setIsDeptModalOpen(false);
    };

    const handleViewStaff = (dept: any) => {
        setViewingDeptStaff(dept);
        setIsStaffModalOpen(true);
    };

    const submitDepartment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            let res;
            if (editingDept) {
                formData.append('id', editingDept.id);
                res = await updateDepartment(formData);
            } else {
                res = await createDepartment(formData);
            }

            if (res.error) {
                alert(res.error);
            } else {
                handleCloseDeptModal();
            }
        } catch (err) {
            alert('Terjadi kesalahan sistem.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus departemen ini?')) return;
        
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('id', id);
        
        try {
            const res = await deleteDepartment(formData);
            if (res.error) {
                alert(res.error);
            }
        } catch (err) {
            alert('Terjadi kesalahan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Daftar Departemen</h2>
                    <p className="text-sm text-slate-500 mt-1">Kelola unit kerja dan penugasan teknisi.</p>
                </div>
                <button 
                    onClick={() => handleOpenDeptModal()}
                    className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors shadow-sm"
                >
                    + Tambah Departemen
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Nama Departemen</th>
                            <th className="px-6 py-4 font-semibold">Deskripsi</th>
                            <th className="px-6 py-4 font-semibold text-center">Jml Teknisi</th>
                            <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {departments.map(dept => (
                            <tr key={dept.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 font-medium text-slate-900">{dept.name}</td>
                                <td className="px-6 py-4 text-slate-500">{dept.description || '-'}</td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => handleViewStaff(dept)}
                                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-full transition-colors cursor-pointer"
                                    >
                                        {staffCount[dept.id] || 0} Anggota
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right space-x-3">
                                    <button 
                                        onClick={() => handleOpenDeptModal(dept)}
                                        className="text-slate-400 hover:text-blue-600 font-medium transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(dept.id)}
                                        className="text-slate-400 hover:text-red-600 font-medium transition-colors"
                                    >
                                        Hapus
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {departments.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                    Belum ada departemen yang ditambahkan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Tambah/Edit Departemen */}
            {isDeptModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingDept ? 'Edit Departemen' : 'Tambah Departemen Baru'}
                            </h3>
                            <button onClick={handleCloseDeptModal} className="text-slate-400 hover:text-slate-600">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={submitDepartment} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Nama Departemen <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    defaultValue={editingDept?.name || ''}
                                    required
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Contoh: Unit Software"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Deskripsi</label>
                                <textarea 
                                    name="description" 
                                    defaultValue={editingDept?.description || ''}
                                    rows={3}
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                    placeholder="Tugas atau fungsi departemen ini..."
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={handleCloseDeptModal}
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

            {/* Modal Daftar Anggota */}
            {isStaffModalOpen && viewingDeptStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Anggota Departemen</h3>
                                <p className="text-sm text-slate-500">{viewingDeptStaff.name}</p>
                            </div>
                            <button onClick={() => setIsStaffModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2">
                                ✕
                            </button>
                        </div>
                        <div className="p-0 max-h-[60vh] overflow-y-auto">
                            <table className="w-full text-sm text-left text-slate-600">
                                <thead className="text-xs text-slate-500 bg-white border-b border-slate-200 sticky top-0 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Nama Teknisi</th>
                                        <th className="px-6 py-3 font-semibold">Nomor WA</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {staffByDept[viewingDeptStaff.id]?.map(staff => (
                                        <tr key={staff.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 font-medium text-slate-900">{staff.name}</td>
                                            <td className="px-6 py-3 font-mono text-slate-500">{staff.phone_number}</td>
                                        </tr>
                                    ))}
                                    {(!staffByDept[viewingDeptStaff.id] || staffByDept[viewingDeptStaff.id].length === 0) && (
                                        <tr>
                                            <td colSpan={2} className="px-6 py-8 text-center text-slate-500">
                                                Belum ada teknisi di departemen ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50">
                            <button 
                                onClick={() => setIsStaffModalOpen(false)}
                                className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
