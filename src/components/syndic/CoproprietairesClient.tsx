'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { User, Mail, Phone, Search, ArrowUpAZ, ArrowDownAZ, Send, Loader2, CheckCircle2, Clock, FileDown } from 'lucide-react'

interface Coproprietaire {
  id: string
  prenom: string
  nom: string
  email?: string | null
  telephone?: string | null
  portail_actif?: boolean | null
  invitation_envoyee_at?: string | null
}

export function CoproprietairesClient({ data }: { data: Coproprietaire[] }) {
  const [search, setSearch] = useState('')
  const [sortAsc, setSortAsc] = useState(true)
  const [invitingAll, setInvitingAll] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ sent: number; skipped: number; failed: number } | null>(null)
  const [exporting, setExporting] = useState(false)
  const [confirmInviteAll, setConfirmInviteAll] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const result = data.filter(c => {
      if (!q) return true
      return (
        c.nom?.toLowerCase().includes(q) ||
        c.prenom?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.telephone?.includes(q)
      )
    })
    result.sort((a, b) => {
      const nameA = `${a.nom} ${a.prenom}`.toLowerCase()
      const nameB = `${b.nom} ${b.prenom}`.toLowerCase()
      return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
    return result
  }, [data, search, sortAsc])

  // Combien de copropriétaires peuvent encore être invités
  const aInviter = data.filter(c => !c.portail_actif && c.email).length

  async function handleExportExcel() {
    setExporting(true)
    try {
      // Export généré côté serveur (exceljs) — plus de dépendance xlsx dans le bundle client
      const res = await fetch('/api/coproprietaires/export')
      if (!res.ok) throw new Error('Erreur lors de la génération du fichier')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `coproprietaires_${new Date().toISOString().slice(0, 10)}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  async function handleInviterTousConfirmed() {
    setConfirmInviteAll(false)
    setInvitingAll(true)
    setInviteResult(null)
    try {
      const res = await fetch('/api/coproprietaires/inviter-tous', { method: 'POST' })
      const data = await res.json()
      setInviteResult({ sent: data.sent ?? 0, skipped: data.skipped ?? 0, failed: data.failed ?? 0 })
    } catch {
      setInviteResult({ sent: 0, skipped: 0, failed: 1 })
    } finally {
      setInvitingAll(false)
    }
  }

  return (
    <>
      {/* Barre de recherche + tri + bouton inviter tous */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20"
          />
        </div>
        <button
          onClick={() => setSortAsc(v => !v)}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-border bg-white rounded-lg hover:bg-coplio-bg transition-colors text-coplio-text"
          title={sortAsc ? 'Tri A → Z' : 'Tri Z → A'}
        >
          {sortAsc ? <ArrowUpAZ className="w-4 h-4" /> : <ArrowDownAZ className="w-4 h-4" />}
          A–Z
        </button>

        <button
          onClick={handleExportExcel}
          disabled={exporting || filtered.length === 0}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-border bg-white rounded-lg hover:bg-coplio-bg transition-colors text-coplio-text disabled:opacity-50"
          title="Exporter en Excel"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          Excel
        </button>

        {aInviter > 0 && (
          <button
            onClick={() => setConfirmInviteAll(true)}
            disabled={invitingAll || confirmInviteAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#374151] text-white rounded-lg hover:bg-[#374151]/90 transition-colors disabled:opacity-60"
          >
            {invitingAll
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
            Inviter tous ({aInviter})
          </button>
        )}
      </div>

      {/* Confirmation envoi groupé */}
      {confirmInviteAll && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-3 bg-slate-50 border border-[#374151]/20 text-[#374151]">
          <Send className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">
            Envoyer une invitation à <strong>{aInviter}</strong> copropriétaire{aInviter > 1 ? 's' : ''} sans portail actif ?
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInviterTousConfirmed}
              className="px-3 py-1.5 text-xs font-medium bg-[#374151] text-white rounded-lg hover:bg-[#374151]/90 transition-colors"
            >
              Confirmer
            </button>
            <button
              onClick={() => setConfirmInviteAll(false)}
              className="px-3 py-1.5 text-xs font-medium border border-border bg-white text-coplio-text rounded-lg hover:bg-coplio-bg transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Résultat envoi groupé */}
      {inviteResult && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${
          inviteResult.failed > 0 ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-slate-100 border border-[#374151]/20 text-[#374151]'
        }`}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>
            {inviteResult.sent} invitation{inviteResult.sent > 1 ? 's' : ''} envoyée{inviteResult.sent > 1 ? 's' : ''}
            {inviteResult.skipped > 0 && ` · ${inviteResult.skipped} déjà invité${inviteResult.skipped > 1 ? 's' : ''} récemment`}
            {inviteResult.failed > 0 && ` · ${inviteResult.failed} échec${inviteResult.failed > 1 ? 's' : ''}`}
          </span>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const inviteEnvoye = !!c.invitation_envoyee_at && !c.portail_actif
            return (
              <Link key={c.id} href={`/coproprietaires/${c.id}`} className="coplio-card hover:border-[#374151]/30 transition-colors block">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#374151]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-[#374151]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-coplio-text">{c.prenom} {c.nom}</p>
                      {c.portail_actif && (
                        <span className="text-xs bg-slate-100 text-[#374151] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Portail
                        </span>
                      )}
                      {inviteEnvoye && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Invité
                        </span>
                      )}
                    </div>
                    <div className="mt-1 space-y-1">
                      {c.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          {c.email}
                        </p>
                      )}
                      {c.telephone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          {c.telephone}
                        </p>
                      )}
                      {!c.email && !c.portail_actif && (
                        <p className="text-xs text-amber-500">Pas d&apos;email — invitation impossible</p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="coplio-card text-center py-12">
          <p className="text-muted-foreground text-sm">
            {search ? `Aucun résultat pour "${search}"` : 'Aucun copropriétaire'}
          </p>
        </div>
      )}
    </>
  )
}
