'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ResolveButton({ ticketId }: { ticketId: string }) {
    const [loading, setLoading] = useState(false);
    const [solution, setSolution] = useState('');
    const [showForm, setShowForm] = useState(false);
    const router = useRouter();

    async function handleResolve(e: React.FormEvent) {
        e.preventDefault();
        if (!solution.trim()) {
            alert('⚠️ Anda harus memasukkan catatan solusi / tindakan perbaikan!');
            return;
        }

        if (!confirm('Tandai tiket ini selesai dan kirim notifikasi ke pelapor?')) return;
        
        setLoading(true);
        const res = await fetch('/api/tickets/resolve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketId, solution }),
        });
        setLoading(false);

        if (!res.ok) {
            const data = await res.json();
            alert(data.message ?? 'Gagal menyelesaikan tiket');
        } else {
            setShowForm(false);
            router.refresh();
        }
    }

    if (!showForm) {
        return (
            <button 
                onClick={() => setShowForm(true)}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
            >
                ✅ Tandai Selesai (Resolve)
            </button>
        );
    }

    return (
        <form onSubmit={handleResolve} className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/5">
            <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Catatan Tindakan / Solusi:</label>
                <textarea 
                    rows={3}
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="Jelaskan apa yang telah diperbaiki..."
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl focus:ring-emerald-500 focus:border-emerald-500 p-3 outline-none resize-none"
                />
            </div>
            
            <div className="flex gap-2">
                <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                >
                    {loading ? 'Menyimpan...' : 'Kirim Solusi'}
                </button>
                <button 
                    type="button" 
                    onClick={() => setShowForm(false)}
                    disabled={loading}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                >
                    Batal
                </button>
            </div>
        </form>
    );
}