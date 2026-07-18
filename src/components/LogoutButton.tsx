'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';

export default function LogoutButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleLogout() {
        setLoading(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    }

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className="text-sm text-red-400 hover:text-red-300 hover:underline disabled:opacity-50"
        >
            {loading ? 'Keluar...' : 'Keluar'}
        </button>
    );
}