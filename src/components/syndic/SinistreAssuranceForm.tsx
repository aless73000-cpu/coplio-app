'use client'

import { useState } from 'react'
import { Shield, Save, Loader2, CheckCircle2 } from 'lucide-react'

interface Props {
  sinistreId: string
  compagnie_assurance?: string | null
  numero_declaration_assurance?: string | null
  montant_sinistre?: number | null
  montant_indemnise?: number | null
}

export function SinistreAssuranceForm({ sinistreId, compagnie_assurance, numero_declaration_assurance, montant_sinistre, montant_indemnise }: Props) {
  const [form, setForm] = useState({
    compagnie_assurance: compagnie_assurance ?? '',
    numero_declaration_assurance: numero_declaration_assurance ?? '',
    montant_sinistre: montant_sinistre?.toString() ?? '',
    montant_indemnise: montant_indemnise?.toString() ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/sinistres/${sinistreId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compagnie_assurance: form.compagnie_assurance || null,
        numero_declaration_assurance: form.numero_declaration_assurance || null,
        montant_sinistre: form.montant_sinistre ? Number(form.montant_sinistre) : null,
        montant_indemnise: form.montant_indemnise ? Number(form.montant_indemnise) : null,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const taux = form.montant_sinistre && form.montant_indemnise
    ? Math.round((Number(form.montant_indemnise) / Number(form.montant_sinistre)) * 100)
    : null

  return (
    <div className="coplio-card">
      <h2 className="font-semibold text-coplio-text mb-4 flex items-center gap-2">
        <Shield className="w-4 h-4 text-[#111827]" />Suivi assurance
      </h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Compagnie d&apos;assurance</label>
            <input value={form.compagnie_assurance} onChange={e => setForm(f => ({ ...f, compagnie_assurance: e.target.value }))}
              placeholder="Ex: AXA, Allianz, MMA..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">N° déclaration assurance</label>
            <input value={form.numero_declaration_assurance} onChange={e => setForm(f => ({ ...f, numero_declaration_assurance: e.target.value }))}
              placeholder="Ex: SIN-2026-XXXXX"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Montant du sinistre (€)</label>
            <input type="number" value={form.montant_sinistre} onChange={e => setForm(f => ({ ...f, montant_sinistre: e.target.value }))}
              placeholder="0"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Montant indemnisé (€)</label>
            <input type="number" value={form.montant_indemnise} onChange={e => setForm(f => ({ ...f, montant_indemnise: e.target.value }))}
              placeholder="0"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20" />
          </div>
        </div>

        {taux !== null && (
          <div className="p-3 bg-coplio-bg rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">Taux d&apos;indemnisation</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${taux >= 80 ? 'bg-[#111827]' : taux >= 50 ? 'bg-amber-400' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, taux)}%` }} />
              </div>
              <span className={`text-sm font-bold ${taux >= 80 ? 'text-[#111827]' : taux >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {taux}%
              </span>
            </div>
          </div>
        )}

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-[#111827] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#111827]/90 transition-colors disabled:opacity-60">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? 'Enregistré' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}
