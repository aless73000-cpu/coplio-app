'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles, FileText, Copy, Download, Loader2, CheckCircle2, Eye, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { exportIAPDF, urlToBase64, type CabinetInfo } from '@/lib/ia/exportPdf'

const TEMPLATES = [
  { value: 'convocation_ag',   label: 'Convocation AG',   desc: "Lettre de convocation à l'assemblée générale", icon: '📋' },
  { value: 'pv_ag',            label: 'Procès-verbal AG',  desc: "PV d'assemblée générale",                       icon: '📝' },
  { value: 'mise_en_demeure',  label: 'Mise en demeure',   desc: 'Lettre de mise en demeure pour impayé',          icon: '⚠️' },
  { value: 'courrier_travaux', label: 'Info travaux',      desc: "Courrier d'information pour des travaux",        icon: '🔧' },
  { value: 'relance_impaye',   label: 'Relance impayé',    desc: 'Lettre de relance courtoise',                    icon: '💌' },
]

const CHAMPS_EXTRA: Record<string, { key: string; label: string; placeholder: string }[]> = {
  convocation_ag: [
    { key: 'date_ag', label: 'Date AG',  placeholder: 'Ex: 15 juin 2026 à 18h00' },
    { key: 'lieu',    label: 'Lieu',     placeholder: 'Salle des fêtes, 12 rue...' },
  ],
  pv_ag: [{ key: 'date_ag', label: 'Date AG', placeholder: 'Ex: 15 juin 2026' }],
  mise_en_demeure: [
    { key: 'prenom',       label: 'Prénom copropriétaire', placeholder: 'Jean' },
    { key: 'nom',          label: 'Nom',                   placeholder: 'Dupont' },
    { key: 'numero_lot',   label: 'N° lot',                placeholder: '12' },
    { key: 'montant',      label: 'Montant dû (€)',        placeholder: '450' },
    { key: 'jours_retard', label: 'Jours de retard',       placeholder: '45' },
  ],
  courrier_travaux: [
    { key: 'nature_travaux', label: 'Nature des travaux', placeholder: 'Remplacement toiture' },
    { key: 'prestataire',    label: 'Prestataire',        placeholder: 'Entreprise Martin' },
    { key: 'date_debut',     label: 'Début travaux',      placeholder: '1er juillet 2026' },
    { key: 'date_fin',       label: 'Fin travaux',        placeholder: '15 juillet 2026' },
  ],
  relance_impaye: [
    { key: 'prenom',     label: 'Prénom',    placeholder: 'Jean' },
    { key: 'nom',        label: 'Nom',       placeholder: 'Dupont' },
    { key: 'numero_lot', label: 'N° lot',    placeholder: '12' },
    { key: 'montant',    label: 'Montant (€)', placeholder: '350' },
  ],
}

interface Copropriete { id: string; nom: string }

interface Props {
  coproprietes: Copropriete[]
  coproprieteId: string
  onCoproprieteChange: (id: string) => void
}

export function IaRedaction({ coproprietes, coproprieteId, onCoproprieteChange }: Props) {
  const [template,   setTemplate]   = useState('convocation_ag')
  const [donnees,    setDonnees]    = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [result,     setResult]     = useState('')
  const [copied,     setCopied]     = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [viewMode,   setViewMode]   = useState<'preview' | 'edit'>('preview')

  // Cabinet info for PDF + preview
  const [cabinetInfo, setCabinetInfo] = useState<CabinetInfo>({ nom: '' })
  const [cabinetLogoUrl, setCabinetLogoUrl] = useState<string | null>(null)
  const cabinetFetched = useRef(false)

  useEffect(() => {
    if (cabinetFetched.current) return
    cabinetFetched.current = true
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles').select('cabinet_id').eq('id', user.id).single()
      if (!profile?.cabinet_id) return
      const { data: cab } = await supabase
        .from('cabinets').select('nom, adresse, logo_url').eq('id', profile.cabinet_id).single()
      if (!cab) return

      setCabinetLogoUrl(cab.logo_url ?? null)

      if (cab.logo_url) {
        const b64 = await urlToBase64(cab.logo_url)
        setCabinetInfo({
          nom: cab.nom ?? '',
          adresse: cab.adresse ?? undefined,
          logoBase64: b64?.data,
          logoMime: b64?.mime,
        })
      } else {
        setCabinetInfo({ nom: cab.nom ?? '', adresse: cab.adresse ?? undefined })
      }
    })()
  }, [])

  async function handleGenerate() {
    if (!coproprieteId) return
    setGenerating(true); setResult(''); setViewMode('preview')
    try {
      const res = await fetch('/api/ia/rediger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, copropriete_id: coproprieteId, donnees }),
      })
      const data = await res.json()
      setResult(data.texte ?? data.error ?? 'Erreur inattendue')
    } catch {
      setResult('Erreur de connexion au serveur IA.')
    } finally {
      setGenerating(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  async function handlePdf() {
    setPdfLoading(true)
    try {
      await exportIAPDF(result, currentTpl?.label ?? 'Document', cabinetInfo)
    } finally {
      setPdfLoading(false)
    }
  }

  const currentTpl = TEMPLATES.find(t => t.value === template)
  const activeCopro = coproprietes.find(c => c.id === coproprieteId)?.nom

  return (
    <div className="grid grid-cols-5 gap-6">
      {/* Panneau gauche */}
      <div className="col-span-2 space-y-4">
        <div className="coplio-card">
          <p className="text-sm font-semibold text-coplio-text mb-3">Type de document</p>
          <div className="space-y-2">
            {TEMPLATES.map(t => (
              <button
                key={t.value}
                onClick={() => { setTemplate(t.value); setDonnees({}) }}
                className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all text-sm ${
                  template === t.value
                    ? 'border-coplio-green bg-coplio-green-light'
                    : 'border-border hover:border-coplio-green/30'
                }`}
              >
                <span className="mr-2">{t.icon}</span>
                <span className={`font-medium ${template === t.value ? 'text-coplio-green' : 'text-coplio-text'}`}>
                  {t.label}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5 ml-6">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="coplio-card">
          <p className="text-sm font-semibold text-coplio-text mb-3">Copropriété</p>
          <select
            value={coproprieteId}
            onChange={e => onCoproprieteChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green bg-white"
          >
            {coproprietes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>

        {(CHAMPS_EXTRA[template] ?? []).length > 0 && (
          <div className="coplio-card">
            <p className="text-sm font-semibold text-coplio-text mb-3">Informations complémentaires</p>
            <div className="space-y-3">
              {(CHAMPS_EXTRA[template] ?? []).map(champ => (
                <div key={champ.key}>
                  <label className="block text-xs font-medium text-coplio-text mb-1">{champ.label}</label>
                  <input
                    value={donnees[champ.key] ?? ''}
                    onChange={e => setDonnees(prev => ({ ...prev, [champ.key]: e.target.value }))}
                    placeholder={champ.placeholder}
                    className="w-full px-2.5 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-coplio-green"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating || !coproprieteId}
          className="w-full flex items-center justify-center gap-2 bg-coplio-green text-white font-medium py-3 rounded-xl hover:bg-coplio-green/90 transition-colors disabled:opacity-60"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? 'Génération en cours...' : 'Générer le document'}
        </button>
      </div>

      {/* Panneau droit — aperçu */}
      <div className="col-span-3">
        <div className="coplio-card h-full flex flex-col min-h-[560px] p-0 overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border flex-shrink-0">
            <p className="text-sm font-semibold text-coplio-text">
              {result ? currentTpl?.label : 'Document généré'}
            </p>
            {result && (
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-coplio-bg rounded-lg p-0.5 gap-0.5">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'preview' ? 'bg-white text-coplio-text shadow-sm' : 'text-muted-foreground hover:text-coplio-text'}`}
                  >
                    <Eye className="w-3 h-3" /> Aperçu
                  </button>
                  <button
                    onClick={() => setViewMode('edit')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'edit' ? 'bg-white text-coplio-text shadow-sm' : 'text-muted-foreground hover:text-coplio-text'}`}
                  >
                    <Pencil className="w-3 h-3" /> Modifier
                  </button>
                </div>

                <div className="w-px h-4 bg-border" />

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-coplio-text px-2.5 py-1.5 rounded-lg border border-border transition-colors bg-white"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-coplio-green" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copié' : 'Copier'}
                </button>

                <button
                  onClick={handlePdf}
                  disabled={pdfLoading}
                  className="flex items-center gap-1.5 text-xs font-medium text-white bg-coplio-green hover:bg-coplio-green/90 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                >
                  {pdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {pdfLoading ? 'Export…' : 'PDF'}
                </button>
              </div>
            )}
          </div>

          {/* Contenu */}
          {generating ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-coplio-green mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">L&apos;IA rédige votre document…</p>
              </div>
            </div>

          ) : result && viewMode === 'preview' ? (
            /* ── Aperçu papier neutre ──────────────────────────── */
            <div className="flex-1 overflow-auto bg-[#E8E8E8] p-5">
              <div
                className="w-full max-w-[520px] mx-auto bg-white shadow-[0_4px_24px_rgba(0,0,0,0.18)] overflow-hidden"
                style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", borderRadius: 2 }}
              >
                {/* Header neutre */}
                <div
                  className="flex items-center px-7 flex-shrink-0"
                  style={{ background: '#F8F8F6', borderBottom: '1px solid #E0E0DC', height: 56 }}
                >
                  {cabinetLogoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cabinetLogoUrl}
                      alt="Logo"
                      style={{ height: 32, maxWidth: 80, objectFit: 'contain', marginRight: 12 }}
                    />
                  )}
                  <span className="font-bold" style={{ fontSize: 13, color: '#1C1C1A' }}>
                    {cabinetInfo.nom || 'Votre cabinet'}
                  </span>
                  {activeCopro && (
                    <span className="ml-auto text-[11px]" style={{ color: '#888888' }}>
                      {activeCopro}
                    </span>
                  )}
                </div>

                {/* Corps */}
                <div className="px-8 pt-7 pb-6" style={{ minHeight: 480 }}>
                  <h2 className="font-bold uppercase tracking-wide mb-1" style={{ color: '#1C1C1A', fontSize: 12.5 }}>
                    {currentTpl?.label}
                  </h2>
                  <div className="mb-5" style={{ height: 1, background: '#E0E0DC' }} />

                  <div style={{ fontSize: 10, lineHeight: 1.7, color: '#1C1C1A' }}>
                    {result.split('\n').map((para, i) => {
                      if (!para.trim()) return <div key={i} style={{ height: 7 }} />
                      const isHeading =
                        para.startsWith('**') ||
                        /^[A-ZÀÁÂÃÄÇÈÉÊËÎÏÔÙÛÜ\s\-—:]{6,}$/.test(para.trim())
                      const clean = para.replace(/\*\*/g, '').replace(/^\*/, '•').trim()
                      return (
                        <p key={i} style={{
                          margin: 0,
                          marginBottom: 3,
                          marginTop: isHeading ? 10 : 0,
                          fontWeight: isHeading ? 700 : 400,
                          fontSize: isHeading ? 10.5 : 10,
                          letterSpacing: isHeading ? '0.2px' : 'normal',
                        }}>
                          {clean}
                        </p>
                      )
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-2.5" style={{ borderTop: '1px solid #DEDEDE', display: 'flex', justifyContent: 'space-between', fontSize: 7.5, color: '#AAAAAA' }}>
                  <span>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span>Page 1</span>
                </div>
              </div>
            </div>

          ) : result && viewMode === 'edit' ? (
            /* ── Mode édition ─────────────────────────────────── */
            <textarea
              value={result}
              onChange={e => setResult(e.target.value)}
              className="flex-1 w-full text-sm text-coplio-text leading-relaxed resize-none focus:outline-none font-mono p-4"
              placeholder="Le document généré apparaîtra ici…"
            />

          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sélectionnez un type de document<br />et cliquez sur &quot;Générer&quot;</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
