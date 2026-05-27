'use client'

import { Fragment, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Loader2, Building2, Pencil, X, Check } from 'lucide-react'

interface Fournisseur {
  id: string
  nom: string
  siret: string | null
  email: string | null
  telephone: string | null
  ville: string | null
  compte_comptable: string
  actif: boolean
  mode_paiement: string
}

const MODE_LABELS: Record<string, string> = {
  virement: 'Virement',
  cheque: 'Chèque',
  prelevement: 'Prélèvement',
  carte: 'Carte',
  especes: 'Espèces',
}

const emptyForm = {
  nom: '', siret: '', email: '', telephone: '',
  adresse: '', code_postal: '', ville: '',
  compte_comptable: '401000', mode_paiement: 'virement', delai_paiement: '30',
}

export function FournisseursManager({
  cabinetId,
  fournisseurs: initial,
}: {
  cabinetId: string
  fournisseurs: Fournisseur[]
}) {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  function startEdit(f: Fournisseur) {
    setEditId(f.id)
    setForm({
      nom: f.nom, siret: f.siret ?? '', email: f.email ?? '',
      telephone: f.telephone ?? '', adresse: '', code_postal: '',
      ville: f.ville ?? '', compte_comptable: f.compte_comptable,
      mode_paiement: f.mode_paiement, delai_paiement: '30',
    })
  }

  async function sauvegarder(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) { setError('Le nom est obligatoire'); return }
    setLoading(editId ?? 'create')
    setError(null)
    const supabase = createClient()

    const payload = {
      nom:              form.nom,
      siret:            form.siret     || null,
      email:            form.email     || null,
      telephone:        form.telephone || null,
      adresse:          form.adresse   || null,
      code_postal:      form.code_postal || null,
      ville:            form.ville     || null,
      compte_comptable: form.compte_comptable || '401000',
      mode_paiement:    form.mode_paiement,
      delai_paiement:   parseInt(form.delai_paiement) || 30,
    }

    if (editId) {
      const { data, error: err } = await supabase
        .from('fournisseurs').update(payload).eq('id', editId).select().single()
      if (err) { setError(err.message); setLoading(null); return }
      setFournisseurs(p => p.map(f => f.id === editId ? { ...f, ...(data as Fournisseur) } : f))
      setEditId(null)
    } else {
      const { data, error: err } = await supabase
        .from('fournisseurs')
        .insert({ ...payload, cabinet_id: cabinetId, actif: true })
        .select().single()
      if (err) { setError(err.message); setLoading(null); return }
      setFournisseurs(p => [...p, data as Fournisseur].sort((a, b) => a.nom.localeCompare(b.nom)))
      setShowForm(false)
    }
    setLoading(null)
    setForm(emptyForm)
  }

  async function supprimer(id: string) {
    setLoading(id + '_del')
    const supabase = createClient()
    await supabase.from('fournisseurs').delete().eq('id', id)
    setFournisseurs(p => p.filter(f => f.id !== id))
    setLoading(null)
  }

  async function toggleActif(f: Fournisseur) {
    const supabase = createClient()
    await supabase.from('fournisseurs').update({ actif: !f.actif }).eq('id', f.id)
    setFournisseurs(p => p.map(x => x.id === f.id ? { ...x, actif: !x.actif } : x))
  }

  const FormFields = () => (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Nom <span className="text-red-500">*</span></label>
          <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
            required placeholder="Société ABC" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">SIRET</label>
          <input type="text" value={form.siret} onChange={e => setForm(f => ({ ...f, siret: e.target.value }))}
            placeholder="123 456 789 00010" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20 font-mono" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Email</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="contact@societe.fr" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Téléphone</label>
          <input type="tel" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
            placeholder="01 23 45 67 89" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Ville</label>
          <input type="text" value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}
            placeholder="Paris" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Compte comptable</label>
          <input type="text" value={form.compte_comptable} onChange={e => setForm(f => ({ ...f, compte_comptable: e.target.value }))}
            placeholder="401000" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20 font-mono" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Mode de paiement</label>
          <select value={form.mode_paiement} onChange={e => setForm(f => ({ ...f, mode_paiement: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20 bg-white">
            {Object.entries(MODE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Délai paiement (jours)</label>
          <input type="number" value={form.delai_paiement} onChange={e => setForm(f => ({ ...f, delai_paiement: e.target.value }))}
            min="0" max="365" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => { setShowForm(v => !v); setEditId(null); setForm(emptyForm); setError(null) }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-[#374151] text-white rounded-lg hover:bg-[#374151]/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouveau fournisseur
        </button>
      </div>

      {showForm && !editId && (
        <form onSubmit={sauvegarder} className="coplio-card space-y-4">
          <h3 className="text-sm font-semibold text-coplio-text">Nouveau fournisseur</h3>
          <FormFields />
          <div className="flex gap-3">
            <button type="button" onClick={() => { setShowForm(false); setError(null) }}
              className="px-4 py-2 text-sm font-medium text-coplio-text border border-border rounded-lg hover:bg-slate-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading === 'create'}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-[#374151] text-white rounded-lg hover:bg-[#374151]/90 disabled:opacity-50 transition-colors">
              {loading === 'create' && <Loader2 className="w-4 h-4 animate-spin" />}
              Créer
            </button>
          </div>
        </form>
      )}

      {fournisseurs.length === 0 ? (
        <div className="coplio-card text-center py-12">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text mb-1">Aucun fournisseur</p>
          <p className="text-sm text-muted-foreground">Ajoutez vos prestataires et artisans pour les associer aux factures.</p>
        </div>
      ) : (
        <div className="coplio-card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/40">
                <th className="text-left py-2.5 px-5 text-xs text-muted-foreground font-medium">Nom</th>
                <th className="text-left py-2.5 px-3 text-xs text-muted-foreground font-medium hidden sm:table-cell">SIRET</th>
                <th className="text-left py-2.5 px-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Contact</th>
                <th className="text-left py-2.5 px-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Compte</th>
                <th className="py-2.5 px-5 w-24" />
              </tr>
            </thead>
            <tbody>
              {fournisseurs.map(f => (
                <Fragment key={f.id}>
                  <tr className={`border-b border-border last:border-0 transition-colors ${editId === f.id ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-3.5 h-3.5 text-[#374151]" />
                        </div>
                        <div>
                          <p className={`font-medium ${!f.actif ? 'text-muted-foreground line-through' : 'text-coplio-text'}`}>{f.nom}</p>
                          {f.ville && <p className="text-xs text-muted-foreground">{f.ville}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">{f.siret ?? '—'}</td>
                    <td className="py-3 px-3 text-xs text-muted-foreground hidden md:table-cell">
                      {f.email && <p>{f.email}</p>}
                      {f.telephone && <p>{f.telephone}</p>}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-muted-foreground hidden lg:table-cell">{f.compte_comptable}</td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => editId === f.id ? setEditId(null) : startEdit(f)}
                          className="text-muted-foreground hover:text-[#374151] transition-colors">
                          {editId === f.id ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => supprimer(f.id)} disabled={loading === f.id + '_del'}
                          className="text-muted-foreground hover:text-red-500 transition-colors">
                          {loading === f.id + '_del' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editId === f.id && (
                    <tr className="border-b border-border bg-blue-50/20">
                      <td colSpan={5} className="px-5 py-4">
                        <form onSubmit={sauvegarder} className="space-y-4">
                          <FormFields />
                          <div className="flex gap-3">
                            <button type="button" onClick={() => { setEditId(null); setError(null) }}
                              className="px-4 py-2 text-sm font-medium text-coplio-text border border-border rounded-lg hover:bg-slate-50 transition-colors">
                              Annuler
                            </button>
                            <button type="submit" disabled={loading === f.id}
                              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-[#374151] text-white rounded-lg disabled:opacity-50 transition-colors">
                              {loading === f.id && <Loader2 className="w-4 h-4 animate-spin" />}
                              <Check className="w-4 h-4" />
                              Enregistrer
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
