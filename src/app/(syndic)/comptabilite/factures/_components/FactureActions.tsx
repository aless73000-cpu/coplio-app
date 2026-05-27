'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, CreditCard, XCircle, Loader2, Plus } from 'lucide-react'
import { formatEuro } from '@/lib/utils'

interface Props {
  factureId: string
  statut: string
  coproprieteId: string
  montantTtc?: number
}

export function FactureActions({ factureId, statut, coproprieteId, montantTtc }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showPaiement, setShowPaiement] = useState(false)
  const [paiementData, setPaiementData] = useState({
    date_paiement: new Date().toISOString().slice(0, 10),
    montant: montantTtc ? String(montantTtc) : '',
    mode_paiement: 'virement',
    reference: '',
  })

  async function changerStatut(nouveauStatut: string) {
    setLoading(nouveauStatut)
    const supabase = createClient()
    await supabase.from('factures').update({ statut: nouveauStatut }).eq('id', factureId)
    router.refresh()
    setLoading(null)
  }

  async function enregistrerPaiement(e: React.FormEvent) {
    e.preventDefault()
    setLoading('paiement')
    const supabase = createClient()

    const { error } = await supabase.from('paiements_facture').insert({
      facture_id:    factureId,
      date_paiement: paiementData.date_paiement,
      montant:       parseFloat(paiementData.montant),
      mode_paiement: paiementData.mode_paiement,
      reference:     paiementData.reference || null,
    })

    if (!error) {
      // Marquer la facture comme payée si le montant couvre tout
      await supabase.from('factures').update({ statut: 'paye' }).eq('id', factureId)
      setShowPaiement(false)
    }

    router.refresh()
    setLoading(null)
  }

  if (statut === 'annule') return null

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {statut === 'recu' && (
        <button
          onClick={() => changerStatut('valide')}
          disabled={!!loading}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-amber-50 text-amber-700 border border-amber-100 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
        >
          {loading === 'valide' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Valider
        </button>
      )}

      {['recu', 'valide', 'comptabilise'].includes(statut) && (
        <button
          onClick={() => setShowPaiement(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-[#374151] text-white rounded-lg hover:bg-[#374151]/90 transition-colors"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Enregistrer un paiement</span>
          <span className="sm:hidden">Payer</span>
        </button>
      )}

      {statut !== 'paye' && (
        <button
          onClick={() => changerStatut('annule')}
          disabled={!!loading}
          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
          title="Annuler la facture"
        >
          {loading === 'annule' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
        </button>
      )}

      {/* Modal paiement */}
      {showPaiement && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-coplio-text">Enregistrer un paiement</h3>
              <button onClick={() => setShowPaiement(false)} className="text-muted-foreground hover:text-coplio-text">✕</button>
            </div>
            <form onSubmit={enregistrerPaiement} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Date</label>
                  <input
                    type="date"
                    value={paiementData.date_paiement}
                    onChange={e => setPaiementData(p => ({ ...p, date_paiement: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Montant TTC</label>
                  <input
                    type="number"
                    value={paiementData.montant}
                    onChange={e => setPaiementData(p => ({ ...p, montant: e.target.value }))}
                    required
                    min="0.01"
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Mode de paiement</label>
                  <select
                    value={paiementData.mode_paiement}
                    onChange={e => setPaiementData(p => ({ ...p, mode_paiement: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
                  >
                    <option value="virement">Virement bancaire</option>
                    <option value="cheque">Chèque</option>
                    <option value="prelevement">Prélèvement</option>
                    <option value="especes">Espèces</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Référence</label>
                  <input
                    type="text"
                    value={paiementData.reference}
                    onChange={e => setPaiementData(p => ({ ...p, reference: e.target.value }))}
                    placeholder="Réf. virement..."
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaiement(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-coplio-text border border-border rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading === 'paiement'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#374151] text-white rounded-xl hover:bg-[#374151]/90 disabled:opacity-50 transition-colors"
                >
                  {loading === 'paiement' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
