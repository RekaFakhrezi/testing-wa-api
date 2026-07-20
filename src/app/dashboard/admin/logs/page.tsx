import { createClient } from '@/src/lib/supabase/server';
import React from 'react';

export const dynamic = 'force-dynamic';

export default async function WebhookLogsPage() {
    const supabase = await createClient();

    // Fetch the latest 100 webhook logs
    const { data: logs } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    return (
        <div className="w-full h-full p-6 md:p-10 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">API & Webhook Logs</h1>
                        <p className="text-slate-500 mt-1">Pantau lalu lintas pesan masuk dan keluar ke WhatsApp API (100 log terakhir).</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-semibold w-48">Waktu (WIB)</th>
                                    <th className="px-6 py-4 font-semibold">Tipe</th>
                                    <th className="px-6 py-4 font-semibold">Nomor Telepon</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold max-w-md">Payload / Pesan</th>
                                    <th className="px-6 py-4 font-semibold">Error Message</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs?.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                                            {new Date(log.created_at).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${
                                                log.direction === 'INCOMING' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                            }`}>
                                                {log.direction}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                                            {log.phone_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${
                                                log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {log.status || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-md max-h-24 overflow-y-auto bg-slate-50 p-2 rounded border border-slate-100 text-xs font-mono whitespace-pre-wrap">
                                                {log.payload}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-red-600 font-mono">
                                            {log.error_message || '-'}
                                        </td>
                                    </tr>
                                ))}
                                {(!logs || logs.length === 0) && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">
                                            Belum ada log API yang tercatat. Pastikan script migrasi sudah dijalankan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
