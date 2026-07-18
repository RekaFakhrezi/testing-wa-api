import { createClient } from '@/src/lib/supabase/server';
import React from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TicketDetailPage({ params }: { params: Promise<{ ticket_number: string }> }) {
    const supabase = await createClient();

    const { data: ticket, error } = await supabase
        .from('tickets')
        .select(`
            *,
            reporter:reporter_id (name, identity_number, faculty_unit, phone_number),
            category:category_id (name),
            technician:technician_id (name)
        `)
        .eq('ticket_number', (await params).ticket_number)
        .single();

    if (error || !ticket) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
                    ❌ Tiket tidak ditemukan atau terjadi kesalahan.
                </div>
                <Link href="/dashboard/operator" className="text-blue-600 hover:underline mt-4 inline-block">
                    &larr; Kembali ke Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[95%] mx-auto min-h-screen bg-slate-50 text-slate-800 font-sans">
            <Link href="/dashboard/operator" className="text-blue-600 hover:underline mb-6 inline-block font-medium">
                &larr; Kembali ke Daftar Tiket
            </Link>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-1">
                            {ticket.subject || ticket.category?.name || 'Tanpa Subjek'}
                        </h1>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span className="font-semibold text-blue-600">#{ticket.ticket_number}</span>
                            <span>•</span>
                            <span>{new Date(ticket.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</span>
                        </div>
                    </div>
                    <div>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                            ticket.status === 'Open' ? 'bg-green-100 text-green-700' :
                            ticket.status === 'Diproses' ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-700'
                        }`}>
                            {ticket.status}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row">
                    {/* Left Panel: Ticket Detail */}
                    <div className="p-6 flex-grow border-r border-slate-200">
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Pesan Keluhan</h3>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-700 whitespace-pre-wrap">
                                {ticket.description}
                            </div>
                        </div>

                        {ticket.attachment_url && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Lampiran Gambar</h3>
                                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 inline-block max-w-full">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={ticket.attachment_url} alt="Lampiran Bukti" className="max-w-full h-auto max-h-[500px] object-contain" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Meta Info */}
                    <div className="p-6 w-full md:w-80 shrink-0 bg-slate-50">
                        <div className="mb-6">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Informasi Pelapor</h3>
                            <div className="text-sm">
                                <div className="font-semibold text-slate-800">{ticket.reporter?.name}</div>
                                <div className="text-slate-600 mt-1">{ticket.reporter?.identity_number}</div>
                                <div className="text-slate-600 mt-1">{ticket.reporter?.faculty_unit}</div>
                                <div className="text-blue-600 mt-1 font-medium">{ticket.reporter?.phone_number}</div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Detail Sistem</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="block text-slate-500 text-xs">Kategori</span>
                                    <span className="font-medium text-slate-800">{ticket.category?.name || '-'}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-500 text-xs">Prioritas (SLA)</span>
                                    <span className="font-medium text-slate-800">{ticket.priority || 'Belum Ditentukan'}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-500 text-xs">Teknisi Ditugaskan</span>
                                    <span className="font-medium text-slate-800">{ticket.technician?.name || 'Belum Ditugaskan'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
