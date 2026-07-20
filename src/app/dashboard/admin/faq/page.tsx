'use client';

import { useState, useEffect } from 'react';

type FAQCategory = {
    id: string;
    parent_id: string | null;
    name: string;
    sort_order: number;
    is_active: boolean;
};

type FAQ = {
    id: string;
    category_id: string;
    title: string;
    content: string;
    keywords: string | null;
    url: string | null;
    sort_order: number;
    is_active: boolean;
};

export default function AdminFAQPage() {
    const [categories, setCategories] = useState<FAQCategory[]>([]);
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<FAQCategory | null>(null);
    const [loadingCats, setLoadingCats] = useState(true);
    const [loadingFaqs, setLoadingFaqs] = useState(false);

    // Form states
    const [isAddingCat, setIsAddingCat] = useState(false);
    const [isEditingCat, setIsEditingCat] = useState<FAQCategory | null>(null);
    const [catFormData, setCatFormData] = useState<Partial<FAQCategory>>({});

    const [isAddingFaq, setIsAddingFaq] = useState(false);
    const [isEditingFaq, setIsEditingFaq] = useState<FAQ | null>(null);
    const [faqFormData, setFaqFormData] = useState<Partial<FAQ>>({});

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            fetchFaqs(selectedCategory.id);
        } else {
            setFaqs([]);
        }
    }, [selectedCategory]);

    const fetchCategories = async () => {
        setLoadingCats(true);
        try {
            const res = await fetch('/api/faq-categories?all=true');
            const data = await res.json();
            if (data.success) setCategories(data.data);
        } catch (error) {
            console.error("Failed to fetch FAQ categories:", error);
        } finally {
            setLoadingCats(false);
        }
    };

    const fetchFaqs = async (categoryId: string) => {
        setLoadingFaqs(true);
        try {
            const res = await fetch(`/api/faqs?category_id=${categoryId}`);
            const data = await res.json();
            if (data.success) setFaqs(data.data);
        } catch (error) {
            console.error("Failed to fetch FAQs:", error);
        } finally {
            setLoadingFaqs(false);
        }
    };

    // --- Category Actions ---
    const handleSaveCat = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = '/api/faq-categories';
        const method = isEditingCat ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isEditingCat ? { ...catFormData, id: isEditingCat.id } : catFormData)
            });
            const data = await res.json();
            if (data.success) {
                setIsEditingCat(null);
                setIsAddingCat(false);
                setCatFormData({});
                fetchCategories();
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert("Terjadi kesalahan.");
        }
    };

    const handleDeleteCat = async (id: string) => {
        if (!confirm("Yakin ingin menghapus kategori FAQ ini?")) return;
        try {
            const res = await fetch(`/api/faq-categories?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                if (selectedCategory?.id === id) setSelectedCategory(null);
                fetchCategories();
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert("Gagal menghapus.");
        }
    };

    // --- FAQ Actions ---
    const handleSaveFaq = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = '/api/faqs';
        const method = isEditingFaq ? 'PUT' : 'POST';
        const payload = { ...faqFormData, category_id: selectedCategory?.id };
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isEditingFaq ? { ...payload, id: isEditingFaq.id } : payload)
            });
            const data = await res.json();
            if (data.success) {
                setIsEditingFaq(null);
                setIsAddingFaq(false);
                setFaqFormData({});
                if (selectedCategory) fetchFaqs(selectedCategory.id);
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert("Terjadi kesalahan.");
        }
    };

    const handleDeleteFaq = async (id: string) => {
        if (!confirm("Yakin ingin menghapus FAQ ini?")) return;
        try {
            const res = await fetch(`/api/faqs?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                if (selectedCategory) fetchFaqs(selectedCategory.id);
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert("Gagal menghapus.");
        }
    };

    // Tree renderer
    const rootCategories = categories.filter(c => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);

    const renderTree = (cats: FAQCategory[], parentId: string | null) => {
        const children = cats.filter(c => c.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);
        if (children.length === 0) return null;

        return (
            <ul className="pl-6 border-l border-slate-200 mt-2 space-y-2">
                {children.map(cat => (
                    <li key={cat.id} className="relative">
                        <div className={`flex items-center justify-between p-3 border rounded-lg transition-colors group cursor-pointer ${selectedCategory?.id === cat.id ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`} onClick={() => setSelectedCategory(cat)}>
                            <div className="flex items-center space-x-3">
                                <span className="text-slate-400">
                                    {cats.some(c => c.parent_id === cat.id) ? '▼' : '•'}
                                </span>
                                <span className={`font-semibold ${cat.is_active ? 'text-slate-800' : 'text-slate-400 line-through'} ${selectedCategory?.id === cat.id ? 'text-blue-800' : ''}`}>
                                    {cat.name}
                                </span>
                            </div>
                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                <button 
                                    onClick={() => { setIsAddingCat(true); setIsEditingCat(null); setCatFormData({ parent_id: cat.id, is_active: true, sort_order: 1 }); }}
                                    className="text-xs text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-2 py-1 rounded"
                                >
                                    + Sub
                                </button>
                                <button 
                                    onClick={() => { setIsEditingCat(cat); setCatFormData(cat); }}
                                    className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDeleteCat(cat.id)}
                                    className="text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                        {renderTree(cats, cat.id)}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8 h-full">
            {/* Left Panel: Categories Tree */}
            <div className="w-full md:w-1/3">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Kategori FAQ</h2>
                    <button 
                        onClick={() => { setIsAddingCat(true); setIsEditingCat(null); setCatFormData({ parent_id: null, is_active: true, sort_order: 1 }); }}
                        className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Root
                    </button>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm border p-4">
                    {loadingCats ? (
                        <div className="text-center py-8 text-slate-500">Memuat...</div>
                    ) : rootCategories.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">Belum ada kategori.</div>
                    ) : (
                        <div className="-ml-6">
                            {renderTree(categories, null)}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: FAQs for selected category */}
            <div className="w-full md:w-2/3">
                {selectedCategory ? (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">FAQ: {selectedCategory.name}</h2>
                            <button 
                                onClick={() => { setIsAddingFaq(true); setIsEditingFaq(null); setFaqFormData({ is_active: true, sort_order: 1 }); }}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30"
                            >
                                + Tambah FAQ
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                            {loadingFaqs ? (
                                <div className="text-center py-12 text-slate-500">Memuat FAQ...</div>
                            ) : faqs.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 bg-slate-50 border border-dashed m-4 rounded-xl">Belum ada FAQ di kategori ini.</div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold text-slate-600">Judul</th>
                                            <th className="px-6 py-3 font-semibold text-slate-600 w-20 text-center">Urutan</th>
                                            <th className="px-6 py-3 font-semibold text-slate-600 w-24">Status</th>
                                            <th className="px-6 py-3 font-semibold text-slate-600 text-right w-32">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {faqs.map(faq => (
                                            <tr key={faq.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-800">{faq.title}</div>
                                                    <div className="text-xs text-slate-500 mt-1 line-clamp-1">{faq.content}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center text-slate-600">{faq.sort_order}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${faq.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        {faq.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button onClick={() => { setIsEditingFaq(faq); setFaqFormData(faq); }} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                                                    <button onClick={() => handleDeleteFaq(faq.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Hapus</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <div className="text-slate-400 font-medium flex flex-col items-center">
                            <span className="text-4xl mb-3">👈</span>
                            Pilih kategori FAQ di sebelah kiri
                        </div>
                    </div>
                )}
            </div>

            {/* Category Form Modal */}
            {(isAddingCat || isEditingCat) && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <form onSubmit={handleSaveCat} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 text-slate-800">{isEditingCat ? 'Edit Kategori FAQ' : 'Tambah Kategori FAQ'}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kategori *</label>
                                <input required className="w-full border-slate-200 rounded-lg p-2.5 text-sm" value={catFormData.name || ''} onChange={e => setCatFormData({...catFormData, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Urutan Tampil</label>
                                    <input type="number" required className="w-full border-slate-200 rounded-lg p-2.5 text-sm" value={catFormData.sort_order || ''} onChange={e => setCatFormData({...catFormData, sort_order: parseInt(e.target.value)})} />
                                </div>
                                <div className="flex items-end pb-2">
                                    <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 w-full justify-center">
                                        <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={catFormData.is_active !== false} onChange={e => setCatFormData({...catFormData, is_active: e.target.checked})} />
                                        <span className="text-sm font-medium text-slate-700">Aktif</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-8">
                            <button type="button" onClick={() => { setIsAddingCat(false); setIsEditingCat(null); }} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                            <button type="submit" className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">Simpan</button>
                        </div>
                    </form>
                </div>
            )}

            {/* FAQ Form Modal */}
            {(isAddingFaq || isEditingFaq) && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <form onSubmit={handleSaveFaq} className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4 text-slate-800">{isEditingFaq ? 'Edit FAQ' : 'Tambah FAQ'}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Judul FAQ *</label>
                                <input required className="w-full border-slate-200 rounded-lg p-2.5 text-sm" value={faqFormData.title || ''} onChange={e => setFaqFormData({...faqFormData, title: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Konten / Isi FAQ *</label>
                                <textarea required rows={5} className="w-full border-slate-200 rounded-lg p-2.5 text-sm" value={faqFormData.content || ''} onChange={e => setFaqFormData({...faqFormData, content: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">URL / Link Eksternal (Opsional)</label>
                                <input type="url" className="w-full border-slate-200 rounded-lg p-2.5 text-sm" value={faqFormData.url || ''} onChange={e => setFaqFormData({...faqFormData, url: e.target.value})} placeholder="https://..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Kata Kunci (Keywords)</label>
                                <input className="w-full border-slate-200 rounded-lg p-2.5 text-sm" value={faqFormData.keywords || ''} onChange={e => setFaqFormData({...faqFormData, keywords: e.target.value})} placeholder="Pisahkan dengan koma (contoh: sso, login, email)" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Urutan Tampil</label>
                                    <input type="number" required className="w-full border-slate-200 rounded-lg p-2.5 text-sm" value={faqFormData.sort_order || ''} onChange={e => setFaqFormData({...faqFormData, sort_order: parseInt(e.target.value)})} />
                                </div>
                                <div className="flex items-end pb-2">
                                    <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 w-full justify-center">
                                        <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={faqFormData.is_active !== false} onChange={e => setFaqFormData({...faqFormData, is_active: e.target.checked})} />
                                        <span className="text-sm font-medium text-slate-700">Aktif</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-8">
                            <button type="button" onClick={() => { setIsAddingFaq(false); setIsEditingFaq(null); }} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                            <button type="submit" className="px-5 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30">Simpan FAQ</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
