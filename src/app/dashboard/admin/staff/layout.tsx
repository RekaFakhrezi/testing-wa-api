'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function StaffManagementLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navs = [
    { name: 'Agents', path: '/dashboard/admin/staff/agents' },
    { name: 'Teams', path: '/dashboard/admin/staff/teams' },
    { name: 'Departments', path: '/dashboard/admin/staff/departments' },
  ];

  return (
    <div className="w-full h-full p-6 md:p-10 font-sans text-slate-800 animate-in fade-in duration-300 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Staff</h1>
        <p className="text-slate-500 mt-1">Kelola agen, tim, dan departemen pada sistem Helpdesk.</p>
      </div>

      <div className="flex items-center gap-6 border-b border-slate-200 overflow-x-auto scrollbar-hide">
        {navs.map((nav) => {
          const isActive = pathname.startsWith(nav.path);
          return (
            <Link
              key={nav.name}
              href={nav.path}
              className={`pb-3 text-sm font-semibold whitespace-nowrap border-b-[3px] transition-colors ${
                isActive 
                  ? 'border-blue-600 text-blue-700' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              {nav.name}
            </Link>
          );
        })}
      </div>

      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}
