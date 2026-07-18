import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import LogoutButton from '../../components/LogoutButton';

export const dynamic = 'force-dynamic';

type Ticket = {
    status: string;
    assigned_staff_name: string | null;
    assigned_at: string | null;
    resolved_at: string | null;
};

function formatDuration(ms: number) {
    const totalMinutes = Math.round(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours} jam ${minutes} menit` : `${minutes} menit`;
}

export default async function ReportsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: tickets, error } = await supabase
        .from('wa_tickets')
        .select('status, assigned_staff_name, assigned_at, resolved_at')
        .not('assigned_staff_name', 'is', null);

    if (error) return <div className="p-8 text-red-500">Gagal mengambil data: {error.message}</div>;

    type Stat = { name: string; total: number; closed: number; totalMs: number; resolvedCount: number };
    const statsMap = new Map<string, Stat>();

    (tickets as Ticket[] ?? []).forEach((t) => {
        const name = t.assigned_staff_name ?? 'Tidak diketahui';
        if (!statsMap.has(name)) statsMap.set(name, { name, total: 0, closed: 0, totalMs: 0, resolvedCount: 0 });
        const s = statsMap.get(name)!;
        s.total++;
        if (t.status === 'closed' && t.resolved_at && t.assigned_at) {
            s.closed++;
            s.totalMs += new Date(t.resolved_at).getTime() - new Date(t.assigned_at).getTime();
            s.resolvedCount++;
        }
    });

    const stats = Array.from(statsMap.values()).sort((a, b) => b.total - a.total);

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Laporan Kinerja Staff</h1>
                    <a href="/tickets" className="text-sm text-blue-400 hover:underline">← Kembali ke Daftar Tiket</a>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">{user.email}</span>
                    <LogoutButton />
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-800">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Staff</th>
                            <th className="px-4 py-3">Tiket Ditangani</th>
                            <th className="px-4 py-3">Selesai</th>
                            <th className="px-4 py-3">Masih Diproses</th>
                            <th className="px-4 py-3">Rata-rata Waktu Penyelesaian</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Belum ada data.</td></tr>
                        )}
                        {stats.map((s) => (
                            <tr key={s.name} className="border-t border-gray-800 hover:bg-gray-900/50">
                                <td className="px-4 py-3 font-medium">{s.name}</td>
                                <td className="px-4 py-3">{s.total}</td>
                                <td className="px-4 py-3 text-green-400">{s.closed}</td>
                                <td className="px-4 py-3 text-yellow-400">{s.total - s.closed}</td>
                                <td className="px-4 py-3 text-gray-400">
                                    {s.resolvedCount > 0 ? formatDuration(s.totalMs / s.resolvedCount) : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}