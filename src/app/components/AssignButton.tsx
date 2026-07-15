'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AssignButton({ ticketId, waNumber }: { ticketId: string; waNumber: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleAssign() {
        if (!confirm('Apakah kamu yakin ingin mengambil tiket ini?')) return;

        setLoading(true);
        const res = await fetch('/api/tickets/assign', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ticketId }),
        });

        setLoading(false);

        if (!res.ok) {
            const data = await res.json();
            alert(data.error || 'Gagal mengambil tiket');
            return;
        }

        router.refresh();
        // Redirect ke WhatsApp
        window.open(`https://web.whatsapp.com/send?phone=${waNumber}`, '_blank');
    }

    return (
        <button
            onClick={handleAssign}
            disabled={loading}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-50"
        >
            {loading ? 'Mengambil...' : 'Ambil Tiket'}
        </button>
    );
}
