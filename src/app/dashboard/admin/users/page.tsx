import { createClient } from '@/src/lib/supabase/server';
import React from 'react';
import ReporterTable from '@/src/components/ReporterTable';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
    const supabase = await createClient();

    // Fetch all users with role = 'REPORTER' and their tickets to find first_ticket_date
    const { data: users, error } = await supabase
        .from('users')
        .select(`
            *,
            tickets:tickets!reporter_id(created_at)
        `)
        .eq('role', 'PELAPOR')
        .order('created_at', { ascending: false });

    // Format the data for ReporterTable
    const formattedReporters = (users || []).map(user => {
        let firstDate = user.created_at;
        if (user.tickets && user.tickets.length > 0) {
            // find earliest date
            const earliest = user.tickets.reduce((min: any, t: any) => {
                const date = new Date(t.created_at).getTime();
                return date < min ? date : min;
            }, Infinity);
            if (earliest !== Infinity) {
                firstDate = new Date(earliest).toISOString();
            }
        }

        return {
            id: user.id,
            name: user.name,
            phone_number: user.phone_number,
            first_ticket_date: firstDate
        };
    });

    return (
        <div className="w-full h-full p-6 md:p-10 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Daftar Pelapor</h1>
                        <p className="text-slate-500 mt-1">Kelola data pengguna (pelapor) yang pernah membuat tiket di Helpdesk.</p>
                    </div>
                </div>

                <ReporterTable reporters={formattedReporters} />

            </div>
        </div>
    );
}
