'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const router = useRouter();
    
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) {
                setErrorMsg('Email atau password salah.');
                setLoading(false);
                return;
            }

            // Successfully logged in, now we need to fetch their role from `users`
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('auth_id', data.user.id)
                .single();

            if (userError || !userData) {
                setErrorMsg('Profil akun tidak ditemukan di database.');
                setLoading(false);
                return;
            }

            // Redirect based on role
            router.refresh(); // Refresh to update server components with new session cookie
            if (userData.role === 'TEKNISI') {
                router.push('/dashboard/teknisi');
            } else if (userData.role === 'OPERATOR_HELPDESK') {
                router.push('/dashboard/operator');
            } else {
                router.push('/dashboard/admin/categories');
            }
            
        } catch (err: any) {
            setErrorMsg('Terjadi kesalahan jaringan.');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {errorMsg && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                    {errorMsg}
                </div>
            )}
            
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agent@halodesk.com"
                    required
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            
            <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2"
            >
                {loading ? 'Memasuki Dashboard...' : 'Login'}
            </button>
        </form>
    );
}
