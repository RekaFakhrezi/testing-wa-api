'use client';

import React from 'react';

export default function DashboardHeader({ 
    userName, 
    userRole, 
    onMenuClick 
}: { 
    userName: string, 
    userRole: string,
    onMenuClick: () => void
}) {
    const handleLogout = async () => {
        // Implement logout logic here using Supabase auth sign out
        // and redirect to login page.
        // For simplicity, we can do a POST to auth signout API or directly use supabase client.
        const supabase = await import('@/src/lib/supabase/client').then(m => m.createClient());
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-4">
                <button 
                    onClick={onMenuClick}
                    className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 font-bold"
                >
                    [Menu]
                </button>
                <div className="font-semibold text-slate-800 hidden sm:block">
                    {/* Placeholder for Breadcrumb or Title */}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-slate-900">{userName}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{userRole}</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200 shrink-0">
                    {userName.substring(0, 1).toUpperCase()}
                </div>
                <button 
                    onClick={handleLogout}
                    className="ml-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors font-bold"
                    title="Logout"
                >
                    [Logout]
                </button>
            </div>
        </header>
    );
}
