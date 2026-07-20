import { createClient } from '@/src/lib/supabase/server';
import React from 'react';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function SLAManagementPage() {
    const supabase = await createClient();

    const { data: configs } = await supabase
        .from('sla_configs')
        .select('*')
        .order('priority_level', { ascending: true }); // String sort is okay, we'll map manually for order

    const priorityOrder = ['Kritis', 'Tinggi', 'Sedang', 'Rendah'];
    const sortedConfigs = configs?.sort((a, b) => {
        return priorityOrder.indexOf(a.priority_level) - priorityOrder.indexOf(b.priority_level);
    }) || [];

    async function updateSLA(formData: FormData) {
        'use server';
        const supabaseServer = await createClient();
        const id = formData.get('id') as string;
        const response_time_minutes = parseInt(formData.get('response_time_minutes') as string);
        const resolution_time_minutes = parseInt(formData.get('resolution_time_minutes') as string);

        if (id && !isNaN(response_time_minutes) && !isNaN(resolution_time_minutes)) {
            await supabaseServer
                .from('sla_configs')
                .update({ response_time_minutes, resolution_time_minutes })
                .eq('id', id);
            
            revalidatePath('/dashboard/admin/sla');
        }
    }

    return (
        <div className="w-full h-full p-6 md:p-10 font-sans text-slate-800">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen SLA</h1>
                        <p className="text-slate-500 mt-1">Atur target waktu respons dan resolusi untuk setiap tingkat prioritas tiket.</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-800">Service Level Agreement (SLA) Config</h2>
                        <p className="text-sm text-slate-500 mt-1">Durasi waktu maksimal (dalam hitungan menit).</p>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Tingkat Prioritas</th>
                                    <th className="px-6 py-4 font-semibold">Target Respons (Menit)</th>
                                    <th className="px-6 py-4 font-semibold">Target Penyelesaian (Menit)</th>
                                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedConfigs.map(config => (
                                    <tr key={config.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                                                config.priority_level === 'Kritis' ? 'bg-red-100 text-red-700' :
                                                config.priority_level === 'Tinggi' ? 'bg-orange-100 text-orange-700' :
                                                config.priority_level === 'Sedang' ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                                {config.priority_level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input 
                                                form={`sla-form-${config.id}`}
                                                type="number" 
                                                name="response_time_minutes" 
                                                defaultValue={config.response_time_minutes}
                                                min="1"
                                                className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <span className="ml-2 text-xs text-slate-400">
                                                (± {Math.round(config.response_time_minutes / 60 * 10) / 10} jam)
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input 
                                                form={`sla-form-${config.id}`}
                                                type="number" 
                                                name="resolution_time_minutes" 
                                                defaultValue={config.resolution_time_minutes}
                                                min="1"
                                                className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <span className="ml-2 text-xs text-slate-400">
                                                (± {Math.round(config.resolution_time_minutes / 60 * 10) / 10} jam)
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <form id={`sla-form-${config.id}`} action={updateSLA}>
                                                <input type="hidden" name="id" value={config.id} />
                                                <button 
                                                    type="submit" 
                                                    className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                                                >
                                                    Simpan
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                                {sortedConfigs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                            Data SLA belum tersedia. Pastikan script migrasi database sudah dijalankan.
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
