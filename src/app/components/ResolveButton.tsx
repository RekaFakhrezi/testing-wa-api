'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ResolveButton({ ticketId }: { ticketId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleClick() {
        if (!confirm('Tandai tiket ini sebagai "Resolved"?')) return;
        setLoading(true);
        const res = await fetch('/api/tickets/resolve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketId }),
        });
        setLoading(false);

        if (!res.ok) {
            const data = await res.json();
            alert(data.error ?? 'Gagal update tiket');
        }
        router.refresh();
    }

    return (
        <button onClick={handleClick} disabled={loading}
            className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium disabled:opacity-50 whitespace-nowrap">
            {loading ? '...' : 'Tandai Resolved'}
        </button>
    );
}