import { createClient } from '@/src/lib/supabase/server';
import React from 'react';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function SystemSettingsPage() {
    const supabase = await createClient();

    // Fetch welcome message config
    const { data: configData } = await supabase
        .from('system_configs')
        .select('*')
        .eq('key', 'bot_welcome_message')
        .maybeSingle();

    async function updateConfigAction(formData: FormData) {
        'use server';
        const supabaseServer = await createClient();
        const value = formData.get('value') as string;

        if (value) {
            await supabaseServer
                .from('system_configs')
                .update({ value, updated_at: new Date().toISOString() })
                .eq('key', 'bot_welcome_message');
            
            revalidatePath('/dashboard/admin/settings');
        }
    }

    return (
        <div className="w-full h-full p-6 md:p-10 font-sans text-slate-800">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Konfigurasi Sistem</h1>
                        <p className="text-slate-500 mt-1">Atur teks otomatis dan parameter sistem lainnya.</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Pesan Utama Bot WhatsApp</h2>
                        <p className="text-sm text-slate-500 mt-1">Teks ini akan dikirim pertama kali saat pelapor menghubungi bot WhatsApp.</p>
                    </div>

                    <form action={updateConfigAction} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Teks Pesan</label>
                            <textarea 
                                name="value" 
                                rows={12}
                                defaultValue={configData?.value || ''}
                                className="w-full text-sm font-mono border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
                                placeholder="Tuliskan pesan sambutan..."
                            ></textarea>
                            <p className="text-xs text-slate-400 mt-2">
                                <strong>Tips Format WA:</strong> Gunakan `*teks*` untuk tebal (bold), `_teks_` untuk miring (italic).
                            </p>
                        </div>
                        
                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button 
                                type="submit"
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all"
                            >
                                Simpan Perubahan
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}
