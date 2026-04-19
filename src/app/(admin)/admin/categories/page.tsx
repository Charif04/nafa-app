'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Check, X, GripVertical, Tag, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
  label: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [addError, setAddError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editName, setEditName] = useState('');

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  async function load() {
    setIsLoading(true);
    const { data, error: err } = await db
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (err) setError(err.message);
    else setCategories(data ?? []);
    setIsLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Add ──────────────────────────────────────────────────────
  async function handleAdd() {
    setAddError('');
    const slug = newName.trim().toLowerCase().replace(/\s+/g, '-');
    const lbl = newLabel.trim();
    if (!slug) { setAddError('Le nom (slug) est requis.'); return; }
    if (!lbl) { setAddError('Le libellé est requis.'); return; }

    setIsSaving(true);
    const maxOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) : 0;
    const { error: err } = await db.from('categories').insert({ name: slug, label: lbl, sort_order: maxOrder + 1 });
    setIsSaving(false);
    if (err) { setAddError(err.message); return; }
    setNewName(''); setNewLabel(''); setShowAdd(false);
    load();
  }

  // ── Edit ─────────────────────────────────────────────────────
  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditLabel(cat.label);
    setEditName(cat.name);
  }

  async function saveEdit(id: string) {
    const lbl = editLabel.trim();
    const slug = editName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!lbl || !slug) return;
    await db.from('categories').update({ label: lbl, name: slug }).eq('id', id);
    setEditingId(null);
    load();
  }

  // ── Toggle active ─────────────────────────────────────────────
  async function toggleActive(cat: Category) {
    await db.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, is_active: !c.is_active } : c));
  }

  // ── Delete ────────────────────────────────────────────────────
  async function confirmDelete(id: string) {
    await db.from('categories').delete().eq('id', id);
    setDeletingId(null);
    load();
  }

  // ── Move up/down ──────────────────────────────────────────────
  async function move(id: string, direction: 'up' | 'down') {
    const idx = categories.findIndex((c) => c.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;

    const a = categories[idx];
    const b = categories[swapIdx];
    await Promise.all([
      db.from('categories').update({ sort_order: b.sort_order }).eq('id', a.id),
      db.from('categories').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    load();
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--nafa-black)' }}>Catégories</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--nafa-gray-700)' }}>
            {categories.length} catégorie{categories.length !== 1 ? 's' : ''} — utilisées pour filtrer les produits
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setAddError(''); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--nafa-orange)' }}
        >
          <Plus size={16} strokeWidth={2} />
          Nouvelle catégorie
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm mb-4" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--nafa-error)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border p-5 mb-4"
            style={{ borderColor: 'var(--nafa-orange)', boxShadow: '0 0 0 3px rgba(255,107,44,0.08)' }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: 'var(--nafa-black)' }}>Nouvelle catégorie</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--nafa-gray-700)' }}>
                  Slug <span className="text-xs font-normal" style={{ color: 'var(--nafa-gray-400)' }}>(identifiant unique, ex : bijoux-or)</span>
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false); }}
                  placeholder="bijoux-or"
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--nafa-gray-700)' }}>
                  Libellé <span className="text-xs font-normal" style={{ color: 'var(--nafa-gray-400)' }}>(affiché aux clients)</span>
                </label>
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false); }}
                  placeholder="Bijoux d'or"
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ borderColor: 'var(--nafa-gray-200)', background: 'var(--nafa-gray-100)' }}
                />
              </div>
            </div>
            {addError && <p className="text-xs mb-3" style={{ color: 'var(--nafa-error)' }}>{addError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'var(--nafa-orange)' }}
              >
                {isSaving ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Check size={14} strokeWidth={2} />}
                Ajouter
              </button>
              <button
                onClick={() => { setShowAdd(false); setNewName(''); setNewLabel(''); setAddError(''); }}
                className="px-4 py-2 rounded-xl text-sm font-medium border"
                style={{ borderColor: 'var(--nafa-gray-200)', color: 'var(--nafa-gray-700)' }}
              >
                Annuler
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories list */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--nafa-gray-200)' }}>
        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--nafa-orange)' }} />
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <Tag size={32} strokeWidth={1.5} style={{ color: 'var(--nafa-gray-300)' }} />
            <p className="text-sm" style={{ color: 'var(--nafa-gray-400)' }}>Aucune catégorie. Créez-en une !</p>
          </div>
        ) : (
          <>
            {/* ── Desktop table ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'var(--nafa-gray-100)', borderBottom: '1px solid var(--nafa-gray-200)' }}>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-8" style={{ color: 'var(--nafa-gray-400)' }} />
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>Libellé</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>Slug</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>Ordre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>Statut</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--nafa-gray-400)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, i) => (
                    <motion.tr key={cat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      style={{ borderBottom: '1px solid var(--nafa-gray-100)' }}>
                      <td className="px-3 py-3 text-center">
                        <GripVertical size={14} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-300)' }} />
                      </td>
                      <td className="px-4 py-3">
                        {editingId === cat.id ? (
                          <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(cat.id); if (e.key === 'Escape') setEditingId(null); }}
                            className="w-full px-2 py-1 rounded-lg border text-sm outline-none"
                            style={{ borderColor: 'var(--nafa-orange)', background: 'white' }} autoFocus />
                        ) : (
                          <span className="text-sm font-medium" style={{ color: 'var(--nafa-black)' }}>{cat.label}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === cat.id ? (
                          <input value={editName} onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(cat.id); if (e.key === 'Escape') setEditingId(null); }}
                            className="w-full px-2 py-1 rounded-lg border text-sm outline-none nafa-mono"
                            style={{ borderColor: 'var(--nafa-orange)', background: 'white' }} />
                        ) : (
                          <span className="text-xs nafa-mono px-2 py-0.5 rounded-lg" style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }}>{cat.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => move(cat.id, 'up')} disabled={i === 0} className="w-6 h-6 rounded-lg flex items-center justify-center disabled:opacity-30" style={{ background: 'var(--nafa-gray-100)' }} aria-label="Monter">
                            <span style={{ fontSize: '10px', lineHeight: 1 }}>▲</span>
                          </button>
                          <span className="text-xs nafa-mono w-6 text-center" style={{ color: 'var(--nafa-gray-400)' }}>{cat.sort_order}</span>
                          <button onClick={() => move(cat.id, 'down')} disabled={i === categories.length - 1} className="w-6 h-6 rounded-lg flex items-center justify-center disabled:opacity-30" style={{ background: 'var(--nafa-gray-100)' }} aria-label="Descendre">
                            <span style={{ fontSize: '10px', lineHeight: 1 }}>▼</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(cat)} className="flex items-center gap-1.5">
                          {cat.is_active ? <ToggleRight size={20} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} /> : <ToggleLeft size={20} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />}
                          <span className="text-xs font-medium" style={{ color: cat.is_active ? 'var(--nafa-orange)' : 'var(--nafa-gray-400)' }}>{cat.is_active ? 'Active' : 'Masquée'}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {editingId === cat.id ? (
                            <>
                              <button onClick={() => saveEdit(cat.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,200,83,0.1)', color: 'var(--nafa-green)' }} aria-label="Sauvegarder"><Check size={14} strokeWidth={2} /></button>
                              <button onClick={() => setEditingId(null)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }} aria-label="Annuler"><X size={14} strokeWidth={2} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(cat)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }} aria-label="Modifier"><Pencil size={13} strokeWidth={1.75} /></button>
                              <button onClick={() => setDeletingId(cat.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--nafa-error)' }} aria-label="Supprimer"><Trash2 size={13} strokeWidth={1.75} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ── */}
            <div className="md:hidden divide-y" style={{ borderColor: 'var(--nafa-gray-100)' }}>
              {categories.map((cat, i) => (
                <motion.div key={cat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="p-4">
                  {/* Row 1: libellé + toggle */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    {editingId === cat.id ? (
                      <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(cat.id); if (e.key === 'Escape') setEditingId(null); }}
                        className="flex-1 px-2 py-1.5 rounded-lg border text-sm outline-none"
                        style={{ borderColor: 'var(--nafa-orange)', background: 'white' }} autoFocus />
                    ) : (
                      <span className="text-sm font-semibold flex-1" style={{ color: 'var(--nafa-black)' }}>{cat.label}</span>
                    )}
                    <button onClick={() => toggleActive(cat)} className="flex items-center gap-1 flex-shrink-0">
                      {cat.is_active ? <ToggleRight size={22} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} /> : <ToggleLeft size={22} strokeWidth={1.75} style={{ color: 'var(--nafa-gray-400)' }} />}
                      <span className="text-xs font-medium" style={{ color: cat.is_active ? 'var(--nafa-orange)' : 'var(--nafa-gray-400)' }}>{cat.is_active ? 'Active' : 'Masquée'}</span>
                    </button>
                  </div>
                  {/* Row 2: slug */}
                  <div className="mb-3">
                    {editingId === cat.id ? (
                      <input value={editName} onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(cat.id); if (e.key === 'Escape') setEditingId(null); }}
                        className="w-full px-2 py-1.5 rounded-lg border text-sm outline-none nafa-mono"
                        style={{ borderColor: 'var(--nafa-orange)', background: 'white' }} />
                    ) : (
                      <span className="text-xs nafa-mono px-2 py-0.5 rounded-lg" style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }}>{cat.name}</span>
                    )}
                  </div>
                  {/* Row 3: order controls + actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button onClick={() => move(cat.id, 'up')} disabled={i === 0} className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30" style={{ background: 'var(--nafa-gray-100)' }} aria-label="Monter">
                        <span style={{ fontSize: '11px' }}>▲</span>
                      </button>
                      <span className="text-xs nafa-mono w-6 text-center" style={{ color: 'var(--nafa-gray-400)' }}>{cat.sort_order}</span>
                      <button onClick={() => move(cat.id, 'down')} disabled={i === categories.length - 1} className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30" style={{ background: 'var(--nafa-gray-100)' }} aria-label="Descendre">
                        <span style={{ fontSize: '11px' }}>▼</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingId === cat.id ? (
                        <>
                          <button onClick={() => saveEdit(cat.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(0,200,83,0.1)', color: 'var(--nafa-green)' }}><Check size={13} strokeWidth={2} />Sauver</button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }}>Annuler</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(cat)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'var(--nafa-gray-100)', color: 'var(--nafa-gray-700)' }}><Pencil size={12} strokeWidth={1.75} />Modifier</button>
                          <button onClick={() => setDeletingId(cat.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--nafa-error)' }}><Trash2 size={12} strokeWidth={1.75} />Supprimer</button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setDeletingId(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <AlertTriangle size={20} strokeWidth={1.75} style={{ color: 'var(--nafa-error)' }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--nafa-black)' }}>Supprimer la catégorie ?</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-700)' }}>
                    Les produits utilisant ce slug ne seront plus filtrés.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                  style={{ borderColor: 'var(--nafa-gray-200)', color: 'var(--nafa-gray-700)' }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => confirmDelete(deletingId)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'var(--nafa-error)' }}
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
