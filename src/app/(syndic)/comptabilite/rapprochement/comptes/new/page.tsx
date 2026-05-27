'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ChevronLeft, Loader2 } from 'lucide-react'

export default function NouveauCompteBancairePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const coproprieteId = searchParams.get('copropriete') ?? ''

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    libelle:      '',
    banque:       '',
    iban:         '',
    bic:          '',
    solde_initial: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.libelle.trim()) { setError('Le libellé est obligatoire.'); return }
    setSaving(true)
    setError(null)
    const supabase = createClient()

    const { error: err } = await supabase.from('comptes_bancaires').insert({
      copropriete_id: coproprieteId,
      libelle:        form.libelle,
      banque:         form.banque  || null,
      iban:           form.iban    || null,
      bic:            form.bic     || null,
      solde_initial:  parseFloat(form.solde_initial) || 0,
    })

    if (err) { setError(err.message); setSaving(false); return }
    router.push(`/comptabilite/rapprochement?copropriete=${coproprieteId}`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/comptabilite/rapprochement?copropriete=${coproprieteId}`}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-coplio-text">Nouveau compte bancaire</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Compte courant, livret, etc.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="coplio-card space-y-4 max-w-lg">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Libellé <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.libelle}
            onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))}
            placeholder="Compte courant BNP"
            required
            className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Banque</label>
            <input
              type="text"
              value={form.banque}
              onChange={e => setForm(f => ({ ...f, banque: e.target.value }))}
              placeholder="BNP Paribas"
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Solde initial (€)</label>
            <input
              type="number"
              value={form.solde_initial}
              onChange={e => setForm(f => ({ ...f, solde_initial: e.target.value }))}
              step="0.01"
              placeholder="0.00"
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">IBAN</label>
          <input
            type="text"
            value={form.iban}
            onChange={e => setForm(f => ({ ...f, iban: e.target.value.replace(/\s/g, '') }))}
            placeholder="FR76 3000 4028 3700 0000 0000 000"
            className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20 font-mono"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-coplio-text border border-border rounded-lg hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-[#374151] text-white rounded-lg hover:bg-[#374151]/90 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  )
}
