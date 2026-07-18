import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import AssignButton from '../../components/AssignButton';
import LogoutButton from '../../components/LogoutButton';
import ResolveButton from '../../components/ResolveButton';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Ticket = {
    id: string;
    wa_number: string;
    reporter_name: string;
    reporter_nim: string;
    description: string;
    status: string;
    created_at: string;
    assigned_to: string | null;
    assigned_staff_name: string | null;
    resolved_at: string | null;
    ticket_number?: string;
    help_topic?: string;
    attachment_url?: string;
};

function StatusBadge({ status, isOverdue }: { status: string; isOverdue?: boolean }) {
    const colors: Record<string, string> = {
        open: 'bg-yellow-500/20 text-yellow-400',
        in_progress: 'bg-blue-500/20 text-blue-400',
        resolved: 'bg-purple-500/20 text-purple-400',
        closed: 'bg-green-500/20 text-green-400',
    };

    const displayStatus: Record<string, string> = {
        open: 'Open',
        in_progress: 'In Progress',
        resolved: 'Resolved',
        closed: 'Closed',
    };

    return (
        <div className="flex flex-col gap-1 items-start">
            <span
                className={`px-2 py-1 rounded-full text-[11px] font-medium ${colors[status?.toLowerCase()] ?? 'bg-gray-500/20 text-gray-400'
                    }`}
            >
                {displayStatus[status?.toLowerCase()] || status || 'Open'}
            </span>
            {isOverdue && status === 'open' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-500 uppercase">
                    Overdue
                </span>
            )}
        </div>
    );
}

export default async function TicketsPage(props: { searchParams: Promise<{ tab?: string }> }) {
    const searchParams = await props.searchParams;
    const currentTab = searchParams.tab || 'all';

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: tickets, error } = await supabase
        .from('wa_tickets')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return (
            <div className="p-8 text-red-500">
                Gagal mengambil data: {error.message}
            </div>
        );
    }

    const now = new Date();

    // Lazy Auto-Close & Overdue Calculation
    const processedTickets = await Promise.all(
        (tickets || []).map(async (ticket: Ticket) => {
            let status = ticket.status || 'open';
            let isOverdue = false;

            // Check overdue (3 days = 72 hours)
            if (status === 'open') {
                const createdDate = new Date(ticket.created_at);
                const diffHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
                if (diffHours > 72) {
                    isOverdue = true;
                }
            }

            // Check auto-close (2 days = 48 hours)
            if (status === 'resolved' && ticket.resolved_at) {
                const resolvedDate = new Date(ticket.resolved_at);
                const diffHours = (now.getTime() - resolvedDate.getTime()) / (1000 * 60 * 60);
                if (diffHours > 48) {
                    // Auto-close in DB
                    status = 'closed';
                    await supabase
                        .from('wa_tickets')
                        .update({ status: 'closed' })
                        .eq('id', ticket.id);
                    ticket.status = 'closed';
                }
            }

            return { ...ticket, status, isOverdue };
        })
    );

    // Filter by tab
    const filteredTickets = processedTickets.filter((t) => {
        if (currentTab === 'all') return true;
        return t.status === currentTab;
    });

    const tabs = [
        { id: 'all', label: 'Semua Tiket' },
        { id: 'open', label: 'Open' },
        { id: 'in_progress', label: 'In Progress' },
        { id: 'resolved', label: 'Resolved' },
        { id: 'closed', label: 'Closed' },
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">
                        Daftar Tiket Helpdesk IT
                    </h1>

                    <a
                        href="/reports"
                        className="text-sm text-blue-400 hover:underline"
                    >
                        Lihat Laporan Performa →
                    </a>
                </div>

                <div className="flex items-center gap-4">
                    <span>{user.email}</span>
                    <LogoutButton />
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-2 mb-4 border-b border-gray-800 pb-2 overflow-x-auto">
                {tabs.map((tab) => (
                    <Link
                        key={tab.id}
                        href={`?tab=${tab.id}`}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${currentTab === tab.id
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                            }`}
                    >
                        {tab.label}
                    </Link>
                ))}
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-800">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Tanggal</th>
                            <th className="px-4 py-3">No Tiket</th>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">NIM</th>
                            <th className="px-4 py-3">No. WA</th>
                            <th className="px-4 py-3">Topik</th>
                            <th className="px-4 py-3">Keluhan</th>
                            <th className="px-4 py-3">Lampiran</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">PIC</th>
                            <th className="px-4 py-3">Aksi</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredTickets.map((ticket) => (
                            <tr
                                key={ticket.id}
                                className="border-t border-gray-800 hover:bg-gray-900/50"
                            >
                                <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                                    {new Date(ticket.created_at).toLocaleString(
                                        'id-ID',
                                        {
                                            dateStyle: 'medium',
                                            timeStyle: 'short',
                                        }
                                    )}
                                </td>

                                <td className="px-4 py-3 font-mono text-xs">
                                    {ticket.ticket_number || '-'}
                                </td>

                                <td className="px-4 py-3">
                                    {ticket.reporter_name}
                                </td>

                                <td className="px-4 py-3">
                                    {ticket.reporter_nim}
                                </td>

                                <td className="px-4 py-3">
                                    {ticket.wa_number}
                                </td>

                                <td className="px-4 py-3 text-xs">
                                    {ticket.help_topic || '-'}
                                </td>

                                <td
                                    className="px-4 py-3 max-w-xs truncate"
                                    title={ticket.description}
                                >
                                    {ticket.description}
                                </td>

                                <td className="px-4 py-3">
                                    {ticket.attachment_url ? (
                                        <a href={ticket.attachment_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-xs">Lihat</a>
                                    ) : '-'}
                                </td>

                                <td className="px-4 py-3">
                                    <StatusBadge status={ticket.status} isOverdue={ticket.isOverdue} />
                                </td>

                                <td className="px-4 py-3 text-gray-400">
                                    {ticket.assigned_staff_name ?? '-'}
                                </td>

                                <td className="px-4 py-3">
                                    {ticket.status === 'closed' ? (
                                        <span className="text-gray-500 text-xs">
                                            ✓ Selesai
                                        </span>
                                    ) : ticket.assigned_to === user.id ? (
                                        <div className="flex gap-2">
                                            <a
                                                href={`https://web.whatsapp.com/send?phone=${ticket.wa_number}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium whitespace-nowrap"
                                            >
                                                Buka Chat
                                            </a>

                                            {ticket.status === 'in_progress' && (
                                                <ResolveButton
                                                    ticketId={ticket.id}
                                                />
                                            )}
                                            {ticket.status === 'resolved' && (
                                                <span className="text-purple-400/80 text-[11px] self-center whitespace-nowrap font-medium">Resolved</span>
                                            )}
                                        </div>
                                    ) : ticket.assigned_staff_name ? (
                                        <span className="text-gray-500 text-xs">
                                            Ditangani{' '}
                                            {ticket.assigned_staff_name}
                                        </span>
                                    ) : (
                                        <AssignButton
                                            ticketId={ticket.id}
                                            waNumber={ticket.wa_number}
                                        />
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredTickets.length === 0 && (
                            <tr>
                                <td colSpan={8} className="text-center py-8 text-gray-500">
                                    Tidak ada tiket.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}