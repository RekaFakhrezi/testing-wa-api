import { createClient } from '@/src/lib/supabase/server';
import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import ResolveButton from '@/src/components/ResolveButton';

export const dynamic = 'force-dynamic';

export default async function TicketDetailPage({ params }: { params: Promise<{ ticket_number: string }> }) {
    const supabase = await createClient();

    const { data: ticket, error } = await supabase
        .from('tickets')
        .select(`
            *,
            reporter:reporter_id (name, identity_number, faculty_unit, phone_number),
            category:category_id (id, name),
            technician:technician_id (name),
            department:department_id (name)
        `)
        .eq('ticket_number', (await params).ticket_number)
        .single();

    let messages: any[] = [];
    let ticketLogs: any[] = [];
    let breadcrumbText = '-';

    if (ticket) {
        // Fetch timeline messages
        const { data: msgData } = await supabase
            .from('ticket_messages')
            .select('*, sender:sender_id(name), ticket_attachments(*)')
            .eq('ticket_id', ticket.id)
            .order('created_at', { ascending: true });
        
        messages = msgData || [];

        // Fetch audit logs
        const { data: logsData } = await supabase
            .from('ticket_logs')
            .select('*')
            .eq('ticket_id', ticket.id)
            .order('created_at', { ascending: true });
            
        ticketLogs = logsData || [];

        // Fetch categories for breadcrumb
        const { data: allCategories } = await supabase.from('categories').select('*');
        if (allCategories && ticket.category_id) {
            const breadcrumb: string[] = [];
            let current = allCategories.find(c => c.id === ticket.category_id);
            while (current) {
                breadcrumb.unshift(current.name);
                current = allCategories.find(c => c.id === current?.parent_id);
            }
            // Batasi breadcrumb maksimal 2 level (Parent -> Child 1)
            breadcrumbText = breadcrumb.slice(0, 2).join(' / ');
        }
    }

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

    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    // Kita harus fetch user kita sendiri dari public.users untuk dapetin role dan public id
    let userId = null;
    let role = null;
    
    if (authUser) {
        const { data: publicUser } = await supabase.from('users').select('id, role').eq('auth_id', authUser.id).single();
        if (publicUser) {
            userId = publicUser.id;
            role = publicUser.role;
        }
    }
    
    const isUnclaimed = !ticket.technician_id;
    const isMyTask = ticket.technician_id === userId;
    const isTechnician = role === 'TEKNISI';

    const formatWhatsApp = (num: string) => {
        if (!num) return '';
        const cleaned = num.replace(/\D/g, '');
        if (cleaned.startsWith('0')) return '62' + cleaned.substring(1);
        return cleaned;
    };

    return (
        <div className="w-full h-full text-slate-800 font-sans p-6 md:p-10">
            <Link href={role === 'TEKNISI' ? '/dashboard/teknisi' : '/dashboard/operator'} className="text-blue-600 hover:underline mb-6 inline-block font-medium">
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
                    {/* Left Panel: Ticket Detail & Timeline */}
                    <div className="p-6 flex-grow border-r border-slate-200">
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Timeline Percakapan</h3>
                            <div className="space-y-6">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex flex-col ${msg.sender_type === 'USER' ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-baseline space-x-2 mb-1">
                                            <span className="font-semibold text-sm text-slate-700">
                                                {msg.sender_type === 'USER' ? (ticket.reporter?.name || 'Pelapor') : (msg.sender?.name || msg.sender_type)}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {new Date(msg.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </span>
                                        </div>
                                        <div className={`p-4 rounded-2xl max-w-[85%] whitespace-pre-wrap text-sm shadow-sm border ${
                                            msg.sender_type === 'USER' 
                                                ? 'bg-blue-600 text-white border-blue-700 rounded-tr-sm' 
                                                : msg.sender_type === 'TEKNISI' 
                                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200 rounded-tl-sm'
                                                    : 'bg-slate-50 text-slate-800 border-slate-200 rounded-tl-sm'
                                        }`}>
                                            {msg.message}
                                        </div>
                                        {(msg.ticket_attachments && msg.ticket_attachments.length > 0) ? (
                                            <div className={`mt-2 flex flex-wrap gap-2 ${msg.sender_type === 'USER' ? 'justify-end' : 'justify-start'}`}>
                                                {msg.ticket_attachments.map((att: any) => (
                                                    <a key={att.id} href={att.file_url} target="_blank" rel="noreferrer" className="block border border-slate-200 rounded-lg overflow-hidden bg-slate-50 max-w-[200px] hover:ring-2 ring-blue-400 transition-all">
                                                        {att.mime_type?.includes('image') ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={att.file_url} alt={att.file_name} className="w-full h-auto object-cover max-h-[150px]" />
                                                        ) : (
                                                            <div className="p-4 flex flex-col items-center justify-center text-slate-500 hover:text-blue-600">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                </svg>
                                                                <span className="text-xs text-center break-all">{att.file_name}</span>
                                                            </div>
                                                        )}
                                                    </a>
                                                ))}
                                            </div>
                                        ) : msg.attachment_url ? (
                                            <div className={`mt-2 border border-slate-200 rounded-lg overflow-hidden bg-slate-50 inline-block max-w-[85%] ${msg.sender_type === 'USER' ? 'self-end' : 'self-start'}`}>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={msg.attachment_url} alt="Lampiran" className="max-w-full h-auto max-h-[300px] object-contain" />
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                                {messages.length === 0 && (
                                    <div className="text-center text-slate-400 text-sm py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        Belum ada pesan di tiket ini.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Activity Log Section */}
                        <div className="mt-12">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span>📋</span> Activity Log
                            </h3>
                            <div className="space-y-3">
                                {ticketLogs.map((log: any) => (
                                    <div key={log.id} className="flex gap-3 items-start text-sm">
                                        <div className="w-16 shrink-0 text-slate-400 text-xs mt-1 font-mono">
                                            {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="flex-grow bg-slate-50 border border-slate-200 rounded-lg p-3 relative before:absolute before:top-4 before:-left-1.5 before:w-3 before:h-3 before:bg-white before:border-l before:border-b before:border-slate-200 before:rotate-45">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                                                    log.role === 'SYSTEM' ? 'bg-slate-200 text-slate-700' :
                                                    log.role === 'USER' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                    {log.role}
                                                </span>
                                                {log.user_name && <span className="text-slate-500 text-xs font-medium">{log.user_name}</span>}
                                            </div>
                                            <div className="text-slate-600">
                                                {log.description || log.action}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {ticketLogs.length === 0 && (
                                    <div className="text-center text-slate-400 text-sm py-4 italic">Belum ada log aktivitas.</div>
                                )}
                            </div>
                        </div>
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
                                
                                {isMyTask && ticket.reporter?.phone_number && (
                                    <a 
                                        href={`https://wa.me/${formatWhatsApp(ticket.reporter.phone_number)}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="mt-3 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebd59] text-white py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                                    >
                                        <svg xmlns="http://www.w3.org/Range" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                                        </svg>
                                        Chat WhatsApp
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Detail Sistem</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="block text-slate-500 text-xs">Kategori</span>
                                    <span className="font-medium text-slate-800">{breadcrumbText}</span>
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

                        <div className="mt-6 space-y-3">
                            {isTechnician && isUnclaimed && ticket.status === 'Diproses' && (
                                <form action={`/api/tickets/assign`} method="POST">
                                    <input type="hidden" name="ticketId" value={ticket.id} />
                                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors text-sm shadow-md">
                                        Ambil Tiket Ini
                                    </button>
                                </form>
                            )}

                            {isTechnician && isMyTask && ticket.status === 'Diproses' && (
                                <ResolveButton ticketId={ticket.id} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
