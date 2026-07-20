'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/src/lib/supabase/client';

type MockMessage = {
    id: string;
    phone_number: string;
    message: string;
    direction: 'in' | 'out';
    created_at: string;
};

export default function SimulatorPage() {
    const [phone, setPhone] = useState('62812345678');
    const [inputText, setInputText] = useState('');
    const [attachmentBase64, setAttachmentBase64] = useState<string | null>(null);
    const [attachmentMime, setAttachmentMime] = useState<string | null>(null);
    const [messages, setMessages] = useState<MockMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 2000);
        return () => clearInterval(interval);
    }, [phone]);

    useEffect(() => {
        scrollToBottom();
    }, [messages.length]);

    const fetchMessages = async () => {
        if (!phone) return;
        const { data } = await supabase
            .from('mock_wa_messages')
            .select('*')
            .eq('phone_number', phone)
            .order('created_at', { ascending: true });
        
        if (data) setMessages(data as MockMessage[]);
        setLoading(false);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setAttachmentBase64(reader.result as string);
                setAttachmentMime(file.type);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!inputText.trim() && !attachmentBase64) || !phone.trim()) return;

        const textToSend = inputText;
        setInputText('');

        // 1. Save 'in' message
        await supabase.from('mock_wa_messages').insert({
            phone_number: phone,
            message: attachmentBase64 ? `[Gambar Terlampir]\n${textToSend}` : textToSend,
            direction: 'in'
        });

        fetchMessages(); // Optimistic update

        const payload: any = {
            event: 'messages.received',
            data: {
                messages: {
                    messageBody: textToSend,
                    key: { cleanedSenderPn: phone }
                }
            }
        };

        if (attachmentBase64) {
            payload.data.messages.message = {
                imageMessage: {
                    mimetype: attachmentMime,
                    jpegThumbnail: attachmentBase64
                }
            };
        }

        setAttachmentBase64(null);
        setAttachmentMime(null);

        // 2. Hit Webhook locally
        await fetch('/api/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // The webhook will async process and insert the 'out' message.
        // It will be picked up by the next polling interval.
    };

    const handleClear = async () => {
        if (confirm('Clear all messages for this number?')) {
            await supabase.from('mock_wa_messages').delete().eq('phone_number', phone);
            setMessages([]);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row items-center justify-center p-4">
            
            {/* Sidebar Config */}
            <div className="w-full md:w-80 bg-white shadow-xl rounded-2xl md:rounded-r-none p-6 flex flex-col mb-4 md:mb-0 md:h-[800px] border border-slate-200">
                <div className="flex items-center space-x-3 mb-8">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">WA Simulator</h1>
                </div>

                <div className="space-y-4 flex-1">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Pengirim (Pelapor)</label>
                        <input 
                            type="text" 
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">Nomor HP ini akan menjadi identitas pelapor.</p>
                    </div>
                </div>

                <button 
                    onClick={handleClear}
                    className="w-full py-2 px-4 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
                >
                    Clear History
                </button>
            </div>

            {/* Chat Interface */}
            <div className="w-full md:w-[600px] bg-slate-50 shadow-xl rounded-2xl md:rounded-l-none flex flex-col h-[600px] md:h-[800px] border border-slate-200 overflow-hidden relative">
                
                {/* Header */}
                <div className="bg-green-600 px-6 py-4 flex items-center shadow-md z-10">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white mr-4">
                        🤖
                    </div>
                    <div>
                        <div className="font-semibold text-white">Helpdesk Bot</div>
                        <div className="text-xs text-green-100">Online</div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#efeae2]">
                    {loading && messages.length === 0 ? (
                        <div className="text-center text-slate-500 mt-10">Memuat riwayat chat...</div>
                    ) : messages.length === 0 ? (
                        <div className="text-center mt-10">
                            <span className="bg-white/80 px-4 py-2 rounded-lg text-sm text-slate-600 shadow-sm">
                                Ketik "HaloDesk" untuk memulai.
                            </span>
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.direction === 'in' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-xl px-4 py-2 shadow-sm ${msg.direction === 'in' ? 'bg-[#d9fdd3] text-slate-800 rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'}`}>
                                    <div className="whitespace-pre-wrap text-[15px]">{msg.message}</div>
                                    <div className="text-[11px] text-slate-400 text-right mt-1">
                                        {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-slate-100 px-4 py-3 flex flex-col z-10">
                    {attachmentBase64 && (
                        <div className="mb-2 flex items-center gap-2 bg-white p-2 rounded-lg w-fit border border-slate-200">
                            <img src={attachmentBase64} alt="Attachment Preview" className="h-12 w-12 object-cover rounded" />
                            <button onClick={() => {setAttachmentBase64(null); setAttachmentMime(null);}} className="text-red-500 hover:text-red-700 text-sm">Hapus</button>
                        </div>
                    )}
                    <form onSubmit={handleSend} className="flex-1 flex gap-2 items-center">
                        <label className="cursor-pointer text-slate-500 hover:text-green-600 p-2">
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        </label>
                        <textarea
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e as any);
                                }
                            }}
                            placeholder="Ketik pesan... (Shift+Enter untuk baris baru)"
                            className="flex-1 px-4 py-3 rounded-2xl border-none focus:ring-0 focus:outline-none shadow-sm text-slate-800 resize-none h-[50px] max-h-[150px]"
                            rows={1}
                        />
                        <button 
                            type="submit"
                            disabled={!inputText.trim() && !attachmentBase64}
                            className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                        >
                            <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
}
