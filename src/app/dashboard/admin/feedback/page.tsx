'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/src/lib/supabase/client';

type Feedback = {
    id: string;
    ticket_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    ticket: {
        ticket_number: string;
        subject: string;
        reporter: {
            name: string;
        };
    };
};

export default function AdminFeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            // We join ticket_feedback with tickets and users(reporter)
            const { data, error } = await supabase
                .from('ticket_feedback')
                .select(`
                    *,
                    ticket:tickets (
                        ticket_number,
                        subject,
                        reporter:reporter_id (name)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFeedbacks(data as unknown as Feedback[]);
        } catch (error) {
            console.error("Failed to fetch feedbacks:", error);
        } finally {
            setLoading(false);
        }
    };

    const avgRating = feedbacks.length > 0 
        ? (feedbacks.reduce((sum, item) => sum + item.rating, 0) / feedbacks.length).toFixed(1)
        : '0';

    // Count distributions
    const ratingCount = {
        5: feedbacks.filter(f => f.rating === 5).length,
        4: feedbacks.filter(f => f.rating === 4).length,
        3: feedbacks.filter(f => f.rating === 3).length,
        2: feedbacks.filter(f => f.rating === 2).length,
        1: feedbacks.filter(f => f.rating === 1).length,
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-slate-800">Ulasan & Kepuasan Pengguna</h1>
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border flex items-center space-x-6">
                    <div className="flex-shrink-0 bg-yellow-100 p-4 rounded-2xl">
                        <span className="text-4xl">⭐</span>
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 font-medium">Rata-Rata Rating</div>
                        <div className="text-4xl font-bold text-slate-800 flex items-baseline space-x-2">
                            <span>{avgRating}</span>
                            <span className="text-base font-normal text-slate-500">/ 5.0</span>
                        </div>
                        <div className="text-sm text-slate-400 mt-1">Dari {feedbacks.length} ulasan tiket</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border">
                    <div className="text-sm text-slate-500 font-medium mb-4">Distribusi Rating</div>
                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map(star => {
                            const count = ratingCount[star as keyof typeof ratingCount];
                            const percentage = feedbacks.length > 0 ? (count / feedbacks.length) * 100 : 0;
                            return (
                                <div key={star} className="flex items-center space-x-3 text-sm">
                                    <div className="w-12 flex items-center space-x-1 text-slate-600">
                                        <span>{star}</span><span className="text-yellow-400">★</span>
                                    </div>
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                                    </div>
                                    <div className="w-8 text-right text-slate-400">{count}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Feedback List */}
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-semibold text-slate-800">Semua Ulasan</h2>
                </div>
                {loading ? (
                    <div className="text-center py-12 text-slate-500">Memuat data...</div>
                ) : feedbacks.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">Belum ada ulasan.</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Tanggal</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Tiket & Pelapor</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Rating</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Komentar / Saran</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {feedbacks.map(f => (
                                <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                                        {new Date(f.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-blue-600">{f.ticket.ticket_number}</div>
                                        <div className="text-sm font-medium text-slate-800 truncate max-w-[200px]" title={f.ticket.subject}>{f.ticket.subject}</div>
                                        <div className="text-xs text-slate-500">Pelapor: {f.ticket.reporter.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-1">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={`text-lg ${i < f.rating ? 'text-yellow-400' : 'text-slate-200'}`}>★</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-700 max-w-[300px]">
                                        {f.comment ? (
                                            <span className="italic">"{f.comment}"</span>
                                        ) : (
                                            <span className="text-slate-400 italic">Tidak ada saran</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
