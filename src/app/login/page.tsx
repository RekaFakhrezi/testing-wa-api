'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        setLoading(false);
        if (error) {
            setError('Email atau password salah.');
            return;
        }
        router.push('/tickets');
        router.refresh();
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
            <form onSubmit={handleLogin} className="w-full max-w-sm p-8 rounded-lg border border-gray-800 bg-gray-900">
                <h1 className="text-xl font-bold mb-6 text-white">Login Staff Helpdesk</h1>
                <input type="email" placeholder="Email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mb-3 px-3 py-2 rounded bg-gray-800 text-white border border-gray-700" required />
                <input type="password" placeholder="Password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full mb-4 px-3 py-2 rounded bg-gray-800 text-white border border-gray-700" required />
                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                <button type="submit" disabled={loading}
                    className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50">
                    {loading ? 'Masuk...' : 'Login'}
                </button>
            </form>
        </div>
    );
}