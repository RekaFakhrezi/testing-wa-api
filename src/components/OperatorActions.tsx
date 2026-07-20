'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OperatorActions({ 
    ticketId, 
    departments,
    categories,
    currentCategoryId
}: { 
    ticketId: string, 
    departments: any[],
    categories: any[],
    currentCategoryId: string
}) {
    const [categoryId, setCategoryId] = useState(currentCategoryId || '');
    const [priority, setPriority] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleAction = async (actionType: 'accept' | 'reject') => {
        if (actionType === 'accept') {
            if (!priority) {
                alert('⚠️ Pilih prioritas SLA terlebih dahulu!');
                return;
            }
            if (!departmentId) {
                alert('⚠️ Pilih Departemen untuk mendisposisi tiket ini!');
                return;
            }
        }

        const confirmMessage = actionType === 'accept'
            ? 'Terima dan teruskan ke teknisi?'
            : 'Tolak tiket ini?';

        if (!confirm(confirmMessage)) return;

        setIsLoading(true);
        try {
            const res = await fetch('/api/tickets/operator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId, categoryId, priority, departmentId, actionType })
            });

            if (res.ok) {
                router.refresh();
            } else {
                alert('❌ Gagal memproses tiket.');
            }
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan sistem.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <td className="px-4 py-3 align-middle">
                <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={isLoading}
                    className="bg-white border border-slate-300 text-slate-700 text-xs rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full max-w-[150px] p-2 disabled:opacity-50 outline-none truncate"
                >
                    <option value="">Pilih Kategori...</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </td>

            <td className="px-4 py-3 align-middle">
                <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    disabled={isLoading}
                    className="bg-white border border-slate-300 text-slate-700 text-xs rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full max-w-[110px] p-2 disabled:opacity-50 outline-none"
                >
                    <option value="">Pilih Prioritas...</option>
                    <option value="Kritis">🔴 Kritis</option>
                    <option value="Tinggi">🟠 Tinggi</option>
                    <option value="Sedang">🟡 Sedang</option>
                    <option value="Rendah">🟢 Rendah</option>
                </select>
            </td>

            <td className="px-4 py-3 align-middle">
                <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    disabled={isLoading}
                    className="bg-white border border-slate-300 text-slate-700 text-xs rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full max-w-[120px] p-2 disabled:opacity-50 outline-none truncate"
                >
                    <option value="">Pilih Unit...</option>
                    {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                </select>
            </td>

            <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => handleAction('accept')}
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-md transition-colors disabled:opacity-50 whitespace-nowrap"
                        title="Terima"
                    >
                        {isLoading ? '...' : '✓'}
                    </button>

                    <button
                        onClick={() => handleAction('reject')}
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 text-lg font-semibold rounded-md transition-colors disabled:opacity-50 whitespace-nowrap"
                        title="Tolak"
                    >
                        🗑
                    </button>
                </div>
            </td>
        </>
    );
}