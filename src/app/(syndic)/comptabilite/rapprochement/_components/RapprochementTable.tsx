'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Link2, Link2Off, Eye, EyeOff, Loader2, Trash2 } from 'lucide-react'
import { formatDate, formatEuro } from '@/lib/utils'

interface Ligne {
  id: string
  date_operation: string
  date_valeur?: string | null
  libelle: string
  reference?: string | null
  montant: number
  statut_lettrage: string
  ecriture_id?: string | null
  ordre: number
}

interface Ecriture {
  id: string
  date_ecriture: string
  libelle: string
  statut: string
  journal: { code: string } | null
}

interface Props {
  releveId: string
  coproprieteId: string
  lignes: Ligne[]
  ecrituresDisponibles: Ecriture[]
}

export function RapprochementTable({
  releveId,
  lignes: initialLignes,
  ecrituresDisponibles,
}: Props) {
  const [lignes, setLignes] = useState<Ligne[]>(initialLignes)
  const [showAjout, setShowAjout] = useState(false)
  const [hideIgnores, setHideIgnores] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  // Formulaire ajout de ligne
  const [newLigne, setNewLigne] = useState({
    date_operation: '',
    libelle: '',
    reference: '',
    montant: '',
  })

  async function ajouterLigne(e: React.FormEvent) {
    e.preventDefault()
    setLoading('new')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('lignes_releve')
      .insert({
        releve_id:      releveId,
        date_operation: newLigne.date_operation,
        libelle:        newLigne.libelle,
        reference:      newLigne.reference || null,
        montant:        parseFloat(newLigne.montant),
        statut_lettrage: 'non_lettre',
        ordre:          lignes.length,
      })
      .select()
      .single()

    if (!error && data) {
      setLignes(prev => [...prev, data as Ligne])
      setNewLigne({ date_operation: '', libelle: '', reference: '', montant: '' })
      setShowAjout(false)
    }
    setLoading(null)
  }

  async function lettrer(ligneId: string, ecritureId: string) {
    setLoading(ligneId)
    const supabase = createClient()
    await supabase
      .from('lignes_releve')
      .update({ ecriture_id: ecritureId, statut_lettrage: 'lettre' })
      .eq('id', ligneId)
    setLignes(prev => prev.map(l =>
      l.id === ligneId ? { ...l, ecriture_id: ecritureId, statut_lettrage: 'lettre' } : l
    ))
    setLoading(null)
  }

  async function delettrer(ligneId: string) {
    setLoading(ligneId)
    const supabase = createClient()
    await supabase
      .from('lignes_releve')
      .update({ ecriture_id: null, statut_lettrage: 'non_lettre' })
      .eq('id', ligneId)
    setLignes(prev => prev.map(l =>
      l.id === ligneId ? { ...l, ecriture_id: null, statut_lettrage: 'non_lettre' } : l
    ))
    setLoading(null)
  }

  async function ignorer(ligneId: string) {
    setLoading(ligneId)
    const supabase = createClient()
    await supabase
      .from('lignes_releve')
      .update({ statut_lettrage: 'ignore' })
      .eq('id', ligneId)
    setLignes(prev => prev.map(l =>
      l.id === ligneId ? { ...l, statut_lettrage: 'ignore' } : l
    ))
    setLoading(null)
  }

  async function supprimerLigne(ligneId: string) {
    setLoading(ligneId + '_del')
    const supabase = createClient()
    await supabase.from('lignes_releve').delete().eq('id', ligneId)
    setLignes(prev => prev.filter(l => l.id !== ligneId))
    setLoading(null)
  }

  const lignesVisibles = hideIgnores
    ? lignes.filter(l => l.statut_lettrage !== 'ignore')
    : lignes

  const nbNonLettrees = lignes.filter(l => l.statut_lettrage === 'non_lettre').length
  const nbLettrees    = lignes.filter(l => l.statut_lettrage === 'lettre').length

  return (
    <div className="space-y-4">
      {/* Barre d'outils */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            {nbLettrees} lettrée{nbLettrees !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            {nbNonLettrees} en attente
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHideIgnores(h => !h)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-coplio-text transition-colors"
          >
            {hideIgnores ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {hideIgnores ? 'Voir ignorées' : 'Masquer ignorées'}
          </button>
          <button
            onClick={() => setShowAjout(a => !a)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#374151] hover:text-[#374151]/70 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter une ligne
          </button>
        </div>
      </div>

      <div className="coplio-card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-slate-50/40">
              <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">Date</th>
              <th className="text-left py-2.5 px-3 text-xs text-muted-foreground font-medium">Libellé</th>
              <th className="text-right py-2.5 px-3 text-xs text-muted-foreground font-medium">Montant</th>
              <th className="text-left py-2.5 px-3 text-xs text-muted-foreground font-medium">Écriture lettrée</th>
              <th className="py-2.5 px-4 text-xs text-muted-foreground font-medium w-10" />
            </tr>
          </thead>
          <tbody>
            {/* Formulaire ajout inline */}
            {showAjout && (
              <tr className="border-b border-border bg-blue-50/30">
                <td className="py-2 px-4">
                  <input
                    type="date"
                    value={newLigne.date_operation}
                    onChange={e => setNewLigne(n => ({ ...n, date_operation: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs border border-border rounded focus:outline-none focus:ring-1 focus:ring-[#374151]/30"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={newLigne.libelle}
                    onChange={e => setNewLigne(n => ({ ...n, libelle: e.target.value }))}
                    placeholder="Libellé opération"
                    className="w-full px-2 py-1.5 text-xs border border-border rounded focus:outline-none focus:ring-1 focus:ring-[#374151]/30"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    value={newLigne.montant}
                    onChange={e => setNewLigne(n => ({ ...n, montant: e.target.value }))}
                    placeholder="±0.00"
                    step="0.01"
                    className="w-full px-2 py-1.5 text-xs border border-border rounded focus:outline-none focus:ring-1 focus:ring-[#374151]/30 text-right"
                  />
                </td>
                <td className="py-2 px-3" colSpan={2}>
                  <div className="flex gap-2">
                    <button
                      onClick={ajouterLigne as unknown as React.MouseEventHandler}
                      disabled={!newLigne.date_operation || !newLigne.libelle || !newLigne.montant || loading === 'new'}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#374151] text-white rounded disabled:opacity-50 hover:bg-[#374151]/90"
                    >
                      {loading === 'new' && <Loader2 className="w-3 h-3 animate-spin" />}
                      Ajouter
                    </button>
                    <button
                      onClick={() => setShowAjout(false)}
                      className="px-3 py-1.5 text-xs text-muted-foreground hover:text-coplio-text"
                    >
                      Annuler
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {lignesVisibles.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">
                  Aucune ligne. Ajoutez les opérations de votre relevé bancaire.
                </td>
              </tr>
            )}

            {lignesVisibles.map((ligne) => {
              const isLoading = loading === ligne.id
              const isDelLoading = loading === ligne.id + '_del'
              const isIgnore = ligne.statut_lettrage === 'ignore'
              const isLettre = ligne.statut_lettrage === 'lettre'

              return (
                <tr
                  key={ligne.id}
                  className={`border-b border-border last:border-0 transition-colors ${
                    isIgnore ? 'opacity-40' : isLettre ? 'bg-emerald-50/30' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-2.5 px-4 text-muted-foreground text-xs whitespace-nowrap">
                    {formatDate(ligne.date_operation)}
                  </td>
                  <td className="py-2.5 px-3">
                    <p className="text-coplio-text truncate max-w-[200px]">{ligne.libelle}</p>
                    {ligne.reference && (
                      <p className="text-xs text-muted-foreground font-mono">{ligne.reference}</p>
                    )}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-mono font-semibold whitespace-nowrap ${
                    (ligne.montant ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {(ligne.montant ?? 0) >= 0 ? '+' : ''}{formatEuro(ligne.montant ?? 0)}
                  </td>
                  <td className="py-2.5 px-3">
                    {isLettre && ligne.ecriture_id ? (
                      <div className="flex items-center gap-2">
                        <Link2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs text-emerald-700 font-medium truncate max-w-[160px]">
                          Écriture lettrée
                        </span>
                        <button
                          onClick={() => delettrer(ligne.id)}
                          disabled={isLoading}
                          className="text-muted-foreground hover:text-red-500 transition-colors ml-1"
                          title="Délettrer"
                        >
                          <Link2Off className="w-3 h-3" />
                        </button>
                      </div>
                    ) : !isIgnore ? (
                      <select
                        onChange={e => e.target.value && lettrer(ligne.id, e.target.value)}
                        defaultValue=""
                        disabled={isLoading}
                        className="text-xs px-2 py-1.5 border border-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#374151]/30 max-w-[200px] w-full"
                      >
                        <option value="">— Lier une écriture —</option>
                        {ecrituresDisponibles.map(ec => (
                          <option key={ec.id} value={ec.id}>
                            {formatDate(ec.date_ecriture)} {ec.journal?.code ? `[${ec.journal.code}]` : ''} {ec.libelle.slice(0, 30)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Ignorée</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-1">
                      {!isIgnore && !isLettre && (
                        <button
                          onClick={() => ignorer(ligne.id)}
                          disabled={isLoading}
                          className="text-muted-foreground hover:text-slate-500 transition-colors text-xs"
                          title="Ignorer cette ligne"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isIgnore && (
                        <button
                          onClick={() => delettrer(ligne.id)}
                          disabled={isLoading}
                          className="text-muted-foreground hover:text-[#374151] transition-colors text-xs"
                          title="Annuler ignorer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => supprimerLigne(ligne.id)}
                        disabled={isDelLoading}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        {isDelLoading
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
