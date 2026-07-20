'use client';

import React, { useState } from 'react';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';

type Role = 'ADMIN' | 'OPERATOR' | 'TEKNISI' | 'PIMPINAN' | 'USER';

export default function DashboardLayoutWrapper({ 
    children, 
    user 
}: { 
    children: React.ReactNode, 
    user: { name: string, role: Role } 
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    React.useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            setIsSidebarOpen(true);
        }
    }, []);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            <React.Suspense fallback={<div className="w-64 bg-slate-900 shrink-0 hidden md:block"></div>}>
                <DashboardSidebar 
                    role={user.role} 
                    isOpen={isSidebarOpen} 
                    setIsOpen={setIsSidebarOpen} 
                />
            </React.Suspense>
            
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <DashboardHeader 
                    userName={user.name} 
                    userRole={user.role} 
                    onMenuClick={() => setIsSidebarOpen(prev => !prev)} 
                />
                
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
