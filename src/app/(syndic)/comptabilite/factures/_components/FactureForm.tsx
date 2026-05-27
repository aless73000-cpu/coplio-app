'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Loader2 } from 'lucide-react'

interface Fournisseur { id: string; nom: string; compte_comptable: string }
interface Exercice    { id: string; annee: number; statut: string }
interface Compte      { id: string; numero: string; libelle: string }

interface LigneForm {
  description: string
  quantite: string
  prix_unitaire_ht: string
  taux_tva: string
  compte_charge_id: string
}

const TVA_TAUX = [0, 5.5, 10, 20]

function calcLigne(l: LigneForm) {
  const qty  = parseFloat(l.quantite)  || 0
  const prix = parseFloat(l.prix_unitaire_ht) || 0
  const tva  = parseFloat(l.taux_tva)  || 0
  const ht   = qty * prix
  const tvaMt = ht * tva / 100
  return { ht, tvaMt, ttc: ht + tvaMt }
}

export function FactureForm({
  coproprieteId,
  fournisseurs,
  exercices,
  comptesCharges,
}: {
  coproprieteId: string
  fournisseurs: Fournisseur[]
  exercices: Exercice[]
  comptesCharges: Compte[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [typeDocument, setTypeDocument] = useState('facture')
  const [fournisseurId, setFournisseurId] = useState('')
  const [exerciceId, setExerciceId] = useState(exercices[0]?.id ?? '')
  const [numeroFacture, setNumeroFacture] = useState('')
  const [libelle, setLibelle] = useState('')
  const [dateDocument, setDateDocument] = useState(new Date().toISOString().slice(0, 10))
  const [dateEcheance, setDateEcheance] = useState('')
  const [notes, setNotes] = useState('')

  const [lignes, setLignes] = useState<LigneForm[]>([
    { description: '', quantite: '1', prix_unitaire_ht: '', taux_tva: '20', compte_charge_id: '' }
  ])

  function updateLigne(i: number, key: keyof LigneForm, value: string) {
    setLignes(prev => prev.map((l, idx) => idx === i ? { ...l, [key]: value } : l))
  }

  function addLigne() {
    setLignes(prev => [...prev, { description: '', quantite: '1', prix_unitaire_ht: '', taux_tva: '20', compte_charge_id: '' }])
  }

  function removeLigne(i: number) {
    setLignes(prev => prev.filter((_, idx) => idx !== i))
  }

  const totaux = lignes.reduce((acc, l) => {
    const { ht, tvaMt, ttc } = calcLigne(l)
    return { ht: acc.ht + ht, tva: acc.tva + tvaMt, ttc: acc.ttc + ttc }
  }, { ht: 0, tva: 0, ttc: 0 })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!libelle.trim() || !dateDocument) {
      setError('Le libellé et la date sont obligatoires.')
      return
    }
    if (lignes.some(l => !l.description.trim())) {
      setError('Chaque ligne doit avoir une description.')
      return
    }

    setSaving(true)
    setError(null)

    const supabase = createClient()

    const { data: facture, error: factureErr } = await supabase
      .from('factures')
      .insert({
        copropriete_id:  coproprieteId,
        fournisseur_id:  fournisseurId || null,
        exercice_id:     exerciceId   || null,
        type_document:   typeDocument,
        numero_facture:  numeroFacture || null,
        libelle,
        date_document:   dateDocument,
        date_echeance:   dateEcheance  || null,
        montant_ht:      totaux.ht,
        taux_tva:        0,
        montant_tva:     totaux.tva,
        montant_ttc:     totaux.ttc,
        notes:           notes || null,
        statut:          'recu',
      })
      .select('id')
      .single()

    if (factureErr || !facture) {
      setError(factureErr?.message ?? 'Erreur lors de la création.')
      setSaving(false)
      return
    }

    // Insérer les lignes
    const lignesData = lignes.map((l, i) => {
      const { ht, tvaMt, ttc } = calcLigne(l)
      return {
        facture_id:       facture.id,
        description:      l.description,
        quantite:         parseFloat(l.quantite) || 1,
        prix_unitaire_ht: parseFloat(l.prix_unitaire_ht) || 0,
        taux_tva:         parseFloat(l.taux_tva) || 0,
        montant_ht:       ht,
        montant_tva:      tvaMt,
        montant_ttc:      ttc,
        compte_charge_id: l.compte_charge_id || null,
        ordre:            i,
      }
    })

    const { error: lignesErr } = await supabase
      .from('lignes_facture')
      .insert(lignesData)

    if (lignesErr) {
      setError(lignesErr.message)
      setSaving(false)
      return
    }

    router.push(`/comptabilite/factures/${facture.id}?copropriete=${coproprieteId}`)
    router.refresh()
  }

  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* En-tête facture */}
      <div className="coplio-card space-y-4">
        <h2 className="font-semibold text-coplio-text text-sm">Informations générales</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <select
              value={typeDocument}
              onChange={e => setTypeDocument(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
            >
              <option value="facture">Facture</option>
              <option value="devis">Devis</option>
              <option value="avoir">Avoir</option>
            </select>
          </div>

          {/* Numéro facture */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">N° facture fournisseur</label>
            <input
              type="text"
              value={numeroFacture}
              onChange={e => setNumeroFacture(e.target.value)}
              placeholder="FAC-2024-001"
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
            />
          </div>

          {/* Exercice */}
          {exercices.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Exercice</label>
              <select
                value={exerciceId}
                onChange={e => setExerciceId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
              >
                {exercices.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.annee}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Fournisseur */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Fournisseur</label>
            <select
              value={fournisseurId}
              onChange={e => setFournisseurId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
            >
              <option value="">— Sélectionner —</option>
              {fournisseurs.map(f => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
          </div>

          {/* Libellé */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Libellé <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={libelle}
              onChange={e => setLibelle(e.target.value)}
              required
              placeholder="Entretien ascenseur janv. 2024"
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Date document */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Date facture <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dateDocument}
              onChange={e => setDateDocument(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
            />
          </div>

          {/* Date échéance */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Date d&apos;échéance</label>
            <input
              type="date"
              value={dateEcheance}
              onChange={e => setDateEcheance(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
            />
          </div>
        </div>
      </div>

      {/* Lignes */}
      <div className="coplio-card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-coplio-text text-sm">Lignes de facturation</h2>
          <button
            type="button"
            onClick={addLigne}
            className="flex items-center gap-1.5 text-xs font-medium text-[#374151] hover:text-[#374151]/70 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter une ligne
          </button>
        </div>

        <div className="divide-y divide-border">
          {lignes.map((ligne, i) => {
            const { ht, tvaMt, ttc } = calcLigne(ligne)
            return (
              <div key={i} className="px-5 py-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Description</label>
                    <input
                      type="text"
                      value={ligne.description}
                      onChange={e => updateLigne(i, 'description', e.target.value)}
                      placeholder="Prestation de service"
                      className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
                    />
                  </div>
                  {lignes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLigne(i)}
                      className="mt-6 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Qté</label>
                    <input
                      type="number"
                      value={ligne.quantite}
                      onChange={e => updateLigne(i, 'quantite', e.target.value)}
                      min="0"
                      step="0.001"
                      className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Prix unitaire HT</label>
                    <input
                      type="number"
                      value={ligne.prix_unitaire_ht}
                      onChange={e => updateLigne(i, 'prix_unitaire_ht', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">TVA</label>
                    <select
                      value={ligne.taux_tva}
                      onChange={e => updateLigne(i, 'taux_tva', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
                    >
                      {TVA_TAUX.map(t => (
                        <option key={t} value={t}>{t} %</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Compte de charge</label>
                    <select
                      value={ligne.compte_charge_id}
                      onChange={e => updateLigne(i, 'compte_charge_id', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
                    >
                      <option value="">— Choisir —</option>
                      {comptesCharges.map(c => (
                        <option key={c.id} value={c.id}>{c.numero} — {c.libelle}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sous-total ligne */}
                {(ht > 0 || ttc > 0) && (
                  <div className="flex justify-end gap-6 text-xs text-muted-foreground">
                    <span>HT : <span className="font-medium text-coplio-text">{fmt(ht)} €</span></span>
                    <span>TVA : <span className="font-medium text-coplio-text">{fmt(tvaMt)} €</span></span>
                    <span>TTC : <span className="font-semibold text-[#374151]">{fmt(ttc)} €</span></span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Totaux */}
        <div className="border-t-2 border-border bg-slate-50 px-5 py-4">
          <div className="flex justify-end">
            <div className="space-y-1.5 min-w-[240px]">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total HT</span>
                <span className="font-medium text-coplio-text">{fmt(totaux.ht)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total TVA</span>
                <span className="font-medium text-coplio-text">{fmt(totaux.tva)} €</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                <span className="text-coplio-text">Total TTC</span>
                <span className="text-[#374151]">{fmt(totaux.ttc)} €</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="coplio-card space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Notes internes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Informations complémentaires..."
          className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827]/20 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
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
  )
}
