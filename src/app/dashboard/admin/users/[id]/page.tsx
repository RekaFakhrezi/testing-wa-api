import { createClient } from '@/src/lib/supabase/server';
import React from 'react';
import Link from 'next/link';
import ReporterTicketTable from '@/src/components/ReporterTicketTable';

export const dynamic = 'force-dynamic';

export default async function UserDetailTicketsPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Fetch user info
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (userError) {
        console.error("Error fetching user details:", userError);
    }

    if (!user) {
        return (
            <div className="p-10 text-center">
                <h1 className="text-2xl font-bold text-slate-800 mb-4">Pengguna Tidak Ditemukan ({userId})</h1>
                <Link href="/dashboard/admin/users" className="text-blue-600 hover:underline">Kembali ke Manajemen Pengguna</Link>
            </div>
        );
    }

    // Fetch tickets submitted by this user
    const { data: tickets } = await supabase
        .from('tickets')
        .select(`
            *,
            reporter:reporter_id (name, identity_number, faculty_unit),
            category:category_id (name, department_id),
            technician:technician_id (name)
        `)
        .eq('reporter_id', userId)
        .order('created_at', { ascending: false });

    // Fetch dependencies for the table
    const { data: departments } = await supabase.from('departments').select('*').order('name');

    return (
        <div className="w-full h-full p-6 md:p-10 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center space-x-2 text-sm text-slate-500 mb-2">
                            <Link href="/dashboard/admin/users" className="hover:text-blue-600 transition-colors">Manajemen Pengguna</Link>
                            <span>/</span>
                            <span className="font-semibold text-slate-700">{user.name}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Profil & Riwayat Tiket</h1>
                    </div>
                </div>

                {/* User Info Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-4">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Lengkap</p>
                            <p className="font-medium text-slate-900 text-lg">{user.name}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nomor WhatsApp</p>
                            <p className="font-medium text-slate-900 font-mono">{user.phone_number}</p>
                        </div>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Identitas (NIM/NIP)</p>
                            <p className="font-medium text-slate-900">{user.identity_number || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unit Kerja / Fakultas</p>
                            <p className="font-medium text-slate-900">{user.faculty_unit || '-'}</p>
                        </div>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peran (Role)</p>
                            <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase">
                                {user.role}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tiket Dibuat</p>
                            <p className="font-bold text-2xl text-slate-900">{tickets?.length || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Tickets Table */}
                <div className="pt-4">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Riwayat Tiket ({user.name})</h2>
                    <ReporterTicketTable 
                        tickets={tickets || []}
                        departments={departments || []}
                    /> 
                </div>

            </div>
        </div>
    );
}
