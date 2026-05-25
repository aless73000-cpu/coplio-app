'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const LOT_TYPES = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
  { value: 'local_commercial', label: 'Local commercial' },
  { value: 'parking', label: 'Parking' },
  { value: 'cave', label: 'Cave' },
  { value: 'autre', label: 'Autre' },
]

export default function EditLotPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [coproprieteId, setCoproprieteId] = useState('')

  const [form, setForm] = useState({
    numero: '',
    type: 'appartement',
    etage: '',
    surface: '',
    tantiemes: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('lots')
      .select('*, copropriete:coproprietes(id, nom)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            numero: data.numero ?? '',
            type: data.type ?? 'appartement',
            etage: data.etage ?? '',
            surface: data.surface?.toString() ?? '',
            tantiemes: data.tantiemes?.toString() ?? '',
          })
          setCoproprieteId(data.copropriete?.id ?? '')
        }
        setLoading(false)
      })
  }, [id])

  async function handleSave() {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/lots/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero: form.numero,
        type: form.type,
        etage: form.etage || undefined,
        surface: form.surface ? parseFloat(form.surface) : undefined,
        tantiemes: parseInt(form.tantiemes, 10),
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Erreur'); return }
    router.push(`/lots/${id}`)
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce lot définitivement ?')) return
    setDeleting(true)
    await fetch(`/api/lots/${id}`, { method: 'DELETE' })
    router.push(coproprieteId ? `/coproprietes/${coproprieteId}/lots` : '/coproprietes')
  }

  const inputCls = `w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
    focus:outline-none focus:ring-2 focus:ring-[#111827]/20 focus:border-transparent`

  if (loading) {
    return (
      <div className="max-w-xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/lots/${id}`} className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Modifier le lot</h1>
          <p className="text-muted-foreground text-sm">Lot {form.numero}</p>
        </div>
      </div>

      <div className="coplio-card space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">Numéro *</label>
            <input
              value={form.numero}
              onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
              className={inputCls}
              placeholder="A01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">Type *</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className={inputCls}
            >
              {LOT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">Étage</label>
            <input
              value={form.etage}
              onChange={(e) => setForm((f) => ({ ...f, etage: e.target.value }))}
              className={inputCls}
              placeholder="RDC, 1er, 2ème…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">Surface (m²)</label>
            <input
              type="number"
              value={form.surface}
              onChange={(e) => setForm((f) => ({ ...f, surface: e.target.value }))}
              className={inputCls}
              placeholder="45"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-coplio-text mb-1.5">Tantièmes *</label>
          <input
            type="number"
            value={form.tantiemes}
            onChange={(e) => setForm((f) => ({ ...f, tantiemes: e.target.value }))}
            className={inputCls}
            placeholder="250"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-5">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Supprimer
        </button>
        <div className="flex-1 flex gap-3">
          <Link
            href={`/lots/${id}`}
            className="flex-1 text-center bg-coplio-bg text-coplio-text font-medium py-2.5 px-4 rounded-lg hover:bg-border transition-colors text-sm"
          >
            Annuler
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || !form.numero || !form.tantiemes}
            className="flex-1 flex items-center justify-center gap-2 bg-[#111827] text-white font-medium py-2.5 px-4 rounded-lg hover:bg-[#111827]/90 transition-colors disabled:opacity-50 text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
