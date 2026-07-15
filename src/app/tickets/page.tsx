import { supabase } from '../../lib/supabase';

export const dynamic = 'force-dynamic'; // selalu ambil data terbaru, gak di-cache

type Ticket = {
    id: string;
    wa_number: string;
    reporter_name: string;
    reporter_nim: string;
    description: string;
    status: string;
    created_at: string;
};

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        open: 'bg-yellow-500/20 text-yellow-400',
        in_progress: 'bg-blue-500/20 text-blue-400',
        closed: 'bg-green-500/20 text-green-400',
    };
    const style = colors[status?.toLowerCase()] ?? 'bg-gray-500/20 text-gray-400';
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
            {status || 'open'}
        </span>
    );
}

export default async function TicketsPage() {
    const { data: tickets, error } = await supabase
        .from('wa_tickets')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return <div className="p-8 text-red-500">Gagal mengambil data: {error.message}</div>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Daftar Tiket Helpdesk IT</h1>

            <div className="overflow-x-auto rounded-lg border border-gray-800">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Tanggal</th>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">NIM</th>
                            <th className="px-4 py-3">No. WA</th>
                            <th className="px-4 py-3">Keluhan</th>
                            <th className="px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets?.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                                    Belum ada tiket masuk.
                                </td>
                            </tr>
                        )}
                        {tickets?.map((ticket: Ticket) => (
                            <tr key={ticket.id} className="border-t border-gray-800 hover:bg-gray-900/50">
                                <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                                    {new Date(ticket.created_at).toLocaleString('id-ID', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                    })}
                                </td>
                                <td className="px-4 py-3">{ticket.reporter_name}</td>
                                <td className="px-4 py-3">{ticket.reporter_nim}</td>
                                <td className="px-4 py-3">{ticket.wa_number}</td>
                                <td className="px-4 py-3 max-w-xs truncate" title={ticket.description}>
                                    {ticket.description}
                                </td>
                                <td className="px-4 py-3">
                                    <StatusBadge status={ticket.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}