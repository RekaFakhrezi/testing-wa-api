'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Tree, NodeApi, TreeApi } from 'react-arborist';

type Category = {
    id: string;
    parent_id: string | null;
    name: string;
    description: string | null;
    level: number;
    sort_order: number;
    is_active: boolean;
};

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<Category | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState<Partial<Category>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const treeRef = useRef<TreeApi<any>>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/categories?all=true');
            const data = await res.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        } finally {
            setLoading(false);
        }
    };

    // Convert flat array to nested structure required by react-arborist
    const treeData = useMemo(() => {
        const buildNestedTree = (cats: Category[], parentId: string | null = null): any[] => {
            return cats
                .filter(c => c.parent_id === parentId)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(c => ({
                    ...c,
                    children: buildNestedTree(cats, c.id)
                }));
        };
        return buildNestedTree(categories, null);
    }, [categories]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = '/api/categories';
        const method = isEditing ? 'PUT' : 'POST';
        
        if (!isEditing) {
             if (formData.parent_id) {
                 const parent = categories.find(c => c.id === formData.parent_id);
                 formData.level = parent ? parent.level + 1 : 1;
             } else {
                 formData.level = 1;
             }
        }

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isEditing ? { ...formData, id: isEditing.id } : formData)
            });
            const data = await res.json();
            if (data.success) {
                setIsEditing(null);
                setIsAdding(false);
                setFormData({});
                fetchCategories();
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert("Terjadi kesalahan.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus kategori ini? (Gunakan Archive bila kategori sudah pernah dipakai di tiket)")) return;
        try {
            const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchCategories();
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert("Gagal menghapus.");
        }
    };

    const onMove = async ({ dragIds, parentId, index }: { dragIds: string[], parentId: string | null, index: number }) => {
        // Optimistic update locally
        const dragId = dragIds[0];
        const newParentId = parentId === '__REACT_ARBORIST_INTERNAL_ROOT__' ? null : parentId;
        
        let newCategories = [...categories];
        const movedNode = newCategories.find(c => c.id === dragId);
        if (!movedNode) return;

        // Calculate new level
        let newLevel = 1;
        if (newParentId) {
            const parent = newCategories.find(c => c.id === newParentId);
            if (parent) newLevel = parent.level + 1;
        }

        // Temporarily change parent to calculate the new order among siblings
        movedNode.parent_id = newParentId;
        movedNode.level = newLevel;

        const siblings = newCategories
            .filter(c => c.parent_id === newParentId && c.id !== dragId)
            .sort((a, b) => a.sort_order - b.sort_order);
            
        // Insert moved node into siblings array at the specified index
        siblings.splice(index, 0, movedNode);

        // Calculate bulk updates for the server
        const updates = siblings.map((sibling, i) => {
            sibling.sort_order = i + 1;
            return {
                id: sibling.id,
                parent_id: sibling.parent_id,
                sort_order: sibling.sort_order,
                level: sibling.level
            };
        });

        // Recursively update levels for children of the moved node if level changed
        const updateChildrenLevels = (parentId: string, currentLevel: number) => {
            const children = newCategories.filter(c => c.parent_id === parentId);
            children.forEach(child => {
                child.level = currentLevel + 1;
                updates.push({
                    id: child.id,
                    parent_id: child.parent_id,
                    sort_order: child.sort_order,
                    level: child.level
                });
                updateChildrenLevels(child.id, child.level);
            });
        };
        updateChildrenLevels(movedNode.id, movedNode.level);

        setCategories(newCategories); // Optimistic UI update

        try {
            await fetch('/api/categories/bulk', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });
        } catch (error) {
            console.error("Failed to sync reorder", error);
            fetchCategories(); // Revert on failure
        }
    };

    const Node = ({ node, style, dragHandle }: { node: NodeApi<any>, style: any, dragHandle?: any }) => {
        const cat = node.data;
        const [isMenuOpen, setIsMenuOpen] = useState(false);
        const menuRef = useRef<HTMLDivElement>(null);

        // Close dropdown when clicking outside
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                    setIsMenuOpen(false);
                }
            };
            if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [isMenuOpen]);

        return (
            <div style={style} className="flex items-center w-full px-2" onClick={(e) => {
                if (!node.isLeaf) node.toggle();
            }}>
                <div className="flex-grow flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
                    <div className="flex items-center space-x-3 w-full">
                        <div 
                            ref={dragHandle} 
                            className="cursor-grab text-slate-300 hover:text-slate-500 w-6 h-6 flex items-center justify-center shrink-0"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
                        </div>
                        <div className="w-5 flex items-center justify-center shrink-0 text-slate-400">
                            {!node.isLeaf ? (
                                node.isOpen ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                                )
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><circle cx="12" cy="12" r="4"/></svg>
                            )}
                        </div>
                        <span className={`font-semibold flex-grow truncate ${cat.is_active ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                            {cat.name}
                        </span>
                        
                        <div className="flex items-center space-x-2 shrink-0">
                            {cat.children && cat.children.length > 0 && (
                                <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full" title="Jumlah Subkategori">
                                    {cat.children.length}
                                </span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${cat.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                {cat.is_active ? 'Aktif' : 'Archive'}
                            </span>
                            
                            {/* Action Dropdown */}
                            <div className="relative" ref={menuRef}>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMenuOpen(!isMenuOpen);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                </button>
                                
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 py-1 z-50 overflow-hidden">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setIsAdding(true); setIsEditing(null); setFormData({ parent_id: cat.id, is_active: true, sort_order: (cat.children?.length || 0) + 1 }); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                        >
                                            Tambah Subkategori
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setIsEditing(cat); setFormData(cat); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={async (e) => { 
                                                e.stopPropagation(); 
                                                setIsMenuOpen(false);
                                                // Quick archive toggle
                                                try {
                                                    await fetch('/api/categories', {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ id: cat.id, is_active: !cat.is_active })
                                                    });
                                                    fetchCategories();
                                                } catch (err) {}
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                                        >
                                            {cat.is_active ? 'Archive' : 'Restore (Aktifkan)'}
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(cat.id); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            Hapus Permanen
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full p-6 md:p-10 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Kategori</h1>
                        <p className="text-slate-500 mt-1">Kelola hierarki kategori layanan (Drag & Drop untuk mengatur posisi).</p>
                    </div>
                    <button 
                        onClick={() => { setIsAdding(true); setIsEditing(null); setFormData({ parent_id: null, is_active: true, sort_order: categories.filter(c => !c.parent_id).length + 1 }); }}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Kategori Root
                    </button>
                </div>

                {/* Toolbar (Search, Expand, Collapse) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
                        <input 
                            type="text" 
                            placeholder="Cari kategori..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => treeRef.current?.openAll()}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            Expand All
                        </button>
                        <button 
                            onClick={() => treeRef.current?.closeAll()}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            Collapse All
                        </button>
                    </div>
                </div>

                {/* Tree Container */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-200 shadow-inner p-4 min-h-[500px]">
                    {loading ? (
                        <div className="text-center py-20 text-slate-500 animate-pulse">Memuat hierarki kategori...</div>
                    ) : treeData.length === 0 ? (
                        <div className="text-center py-20 text-slate-500">Belum ada kategori yang dibuat.</div>
                    ) : (
                        <Tree
                            ref={treeRef}
                            data={treeData}
                            width="100%"
                            height={600}
                            indent={32}
                            rowHeight={56}
                            searchTerm={searchQuery}
                            onMove={onMove}
                        >
                            {Node}
                        </Tree>
                    )}
                </div>
            </div>

            {/* Right Drawer for Form (Adding/Editing) */}
            {/* Backdrop */}
            {(isAdding || isEditing) && (
                <div className="fixed inset-0 bg-slate-900/50 z-40 transition-opacity backdrop-blur-sm" onClick={() => { setIsAdding(false); setIsEditing(null); }}></div>
            )}
            
            {/* Drawer */}
            <div className={`fixed inset-y-0 right-0 z-50 w-full md:w-[450px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
                (isAdding || isEditing) ? 'translate-x-0' : 'translate-x-full'
            }`}>
                <div className="h-full flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                            {isEditing ? 'Edit Kategori' : 'Tambah Kategori'}
                        </h2>
                        <button 
                            onClick={() => { setIsAdding(false); setIsEditing(null); }}
                            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        <form id="categoryForm" onSubmit={handleSave} className="space-y-6">
                            
                            {/* Parent Field */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Parent Kategori</label>
                                <select 
                                    className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.parent_id || ''}
                                    onChange={e => setFormData({...formData, parent_id: e.target.value || null})}
                                >
                                    <option value="">-- ROOT (Kategori Utama) --</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id} disabled={isEditing?.id === c.id}>
                                            {'-'.repeat((c.level - 1) * 2)} {c.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1.5">
                                    Pilih ROOT jika ingin membuat kategori utama.
                                </p>
                            </div>

                            {/* Name Field */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Kategori <span className="text-red-500">*</span></label>
                                <input 
                                    required
                                    placeholder="Contoh: Aplikasi, Hardware..."
                                    className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>

                            {/* Description Field */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deskripsi</label>
                                <textarea 
                                    placeholder="Deskripsi singkat mengenai kategori ini..."
                                    className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px]"
                                    value={formData.description || ''}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                />
                            </div>

                            {/* Status & Sort Order */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Urutan Tampil</label>
                                    <input 
                                        type="number" required
                                        className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={formData.sort_order || ''}
                                        onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div className="flex items-end pb-1">
                                    <label className="flex items-center space-x-3 cursor-pointer bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 w-full hover:bg-slate-100 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={formData.is_active !== false}
                                            onChange={e => setFormData({...formData, is_active: e.target.checked})}
                                        />
                                        <span className="text-sm font-semibold text-slate-700">Aktifkan</span>
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
                        <button type="button" onClick={() => { setIsAdding(false); setIsEditing(null); }} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                            Batal
                        </button>
                        <button type="submit" form="categoryForm" className="px-6 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                            Simpan Kategori
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
