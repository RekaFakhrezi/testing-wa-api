'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

type Role = string;

export default function DashboardSidebar({ 
    role, 
    isOpen, 
    setIsOpen 
}: { 
    role: Role, 
    isOpen: boolean,
    setIsOpen: (val: boolean) => void
}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const menuItems = [
        // Admin Menus
        { label: 'Beranda', href: '/dashboard/admin', roles: ['ADMIN'] },
        { label: 'Tickets', href: '/dashboard/admin/tickets', roles: ['ADMIN'] },
        { label: 'Manajemen Pengguna', href: '/dashboard/admin/users', roles: ['ADMIN'] },
        { label: 'Kategori Laporan', href: '/dashboard/admin/categories', roles: ['ADMIN'] },
        { label: 'Manajemen SLA', href: '/dashboard/admin/sla', roles: ['ADMIN'] },
        { label: 'Manajemen Teknisi', href: '/dashboard/admin/technicians', roles: ['ADMIN'] },
        { label: 'Laporan & Ekspor', href: '/dashboard/admin/reports', roles: ['ADMIN'] },
        { label: 'Log API Webhook', href: '/dashboard/admin/logs', roles: ['ADMIN'] },
        { label: 'Pengaturan Sistem', href: '/dashboard/admin/settings', roles: ['ADMIN'] },
        
        // Operator Menus
        { label: 'Tiket Masuk', href: '/dashboard/operator', roles: ['OPERATOR'] },
        { label: 'Tiket Ditolak', href: '/dashboard/operator?tab=ditolak', roles: ['OPERATOR'] },
        
        // Teknisi Menus
        { label: 'Dashboard', href: '/dashboard/teknisi', roles: ['TEKNISI'] },
        { label: 'My Tasks', href: '/dashboard/teknisi?tab=tasks', roles: ['TEKNISI'] },

        // Pimpinan Menus
        { label: 'Beranda Pimpinan', href: '/dashboard/pimpinan', roles: ['PIMPINAN'] }
    ];

    const filteredMenu = menuItems.filter(item => 
        item.roles.includes(role) || 
        (role === 'OPERATOR_HELPDESK' && item.roles.includes('OPERATOR')) ||
        (role === 'ADMINISTRATOR' && item.roles.includes('ADMIN'))
    );

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside 
                className={`
                    fixed inset-y-0 left-0 z-30 bg-slate-900 text-slate-300 transform transition-all duration-300 ease-in-out flex flex-col shrink-0
                    ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:w-0 md:translate-x-0 md:overflow-hidden md:opacity-0'}
                    md:relative md:flex
                `}
            >
                
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800 shrink-0">
                    <span className="text-white font-black text-lg tracking-wide">IT<span className="text-blue-500">HELPDESK</span></span>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide">
                    {filteredMenu.map((item, index) => {
                        const hasTab = item.href.includes('?tab=');
                        const url = new URL(item.href, 'http://localhost');
                        const itemTab = url.searchParams.get('tab');
                        const currentTab = searchParams.get('tab');
                        
                        let isActive = false;
                        if (hasTab) {
                            isActive = pathname === url.pathname && itemTab === currentTab;
                        } else {
                            isActive = pathname === item.href && !currentTab;
                        }

                        return (
                            <Link 
                                key={index} 
                                href={item.href}
                                onClick={() => {
                                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                                        setIsOpen(false);
                                    }
                                }}
                                className={`block px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                                    isActive 
                                    ? 'bg-blue-600 text-white shadow-md' 
                                    : 'hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Sidebar */}
                <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
                    &copy; 2026 Helpdesk IT UNDIP
                </div>
            </aside>
        </>
    );
}
