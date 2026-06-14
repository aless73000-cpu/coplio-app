'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, Loader2, CheckCircle2, Mail, MessageSquare, Info } from 'lucide-react'

interface Copropriete { id: string; nom: string }
interface Params {
  copropriete_id: string
  actif: boolean
  delai_premier_rappel: number
  delai_deuxieme_rappel: number
  delai_mise_en_demeure: number
  premier_rappel_email: boolean
  premier_rappel_sms: boolean
  deuxieme_rappel_email: boolean
  deuxieme_rappel_sms: boolean
  texte_premier_rappel?: string
  texte_deuxieme_rappel?: string
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-coplio-text">{label}</span>
      <button onClick={() => onChange(!value)}
        className={`w-10 h-6 rounded-full relative transition-colors ${value ? 'bg-[#374151]' : 'bg-border'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

export default function RelancesConfigPage() {
  const [coproprietes, setCoproprietes] = useState<Copropriete[]>([])
  const [selected, setSelected] = useState('')
  const [params, setParams] = useState<Params | null>(null)
  const [loadingCopros, setLoadingCopros] = useState(true)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLoadingCopros(true)
    fetch('/api/coproprietes')
      .then(r => r.json())
      .then(d => {
        const list: Copropriete[] = Array.isArray(d) ? d : (d.data ?? [])
        setCoproprietes(list)
        if (list.length > 0) setSelected(list[0].id)
      })
      .catch(() => {/* silencieux */})
      .finally(() => setLoadingCopros(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    fetch(`/api/relances-parametres?copropriete_id=${selected}`)
      .then(r => r.json())
      .then(d => { setParams(d ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selected])

  async function save() {
    if (!params) return
    setSaving(true)
    await fetch('/api/relances-parametres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const p = params
  const set = (key: keyof Params, value: unknown) =>
    setParams(prev => prev ? { ...prev, [key]: value } : prev)

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Relances automatiques</h1>
        <p className="text-muted-foreground text-sm mt-1">Configurez les délais et canaux de relance par copropriété</p>
      </div>

      {/* Sélecteur copropriété */}
      <div className="coplio-card">
        <label className="block text-sm font-medium text-coplio-text mb-2">Copropriété</label>
        {loadingCopros ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Chargement…</span>
          </div>
        ) : coproprietes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Aucune copropriété trouvée.{' '}
            <Link href="/coproprietes/new" className="text-[#374151] underline">Créez-en une</Link>.
          </p>
        ) : (
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#374151]/20">
            {coproprietes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        )}
      </div>

      {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}

      {p && !loading && (
        <>
          {/* Activation globale */}
          <section className="coplio-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                <Bell className="w-4 h-4 text-[#374151]" />
              </div>
              <h2 className="font-semibold text-coplio-text">Activation</h2>
            </div>
            <Toggle value={p.actif} onChange={v => set('actif', v)} label="Relances automatiques activées" />
          </section>

          {/* Délais */}
          <section className="coplio-card">
            <h2 className="font-semibold text-coplio-text mb-4">Délais de relance</h2>
            <div className="flex items-start gap-2 mb-4 p-3 bg-blue-50 rounded-xl">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">Les délais sont calculés en jours après la date d&apos;échéance de l&apos;appel de charges.</p>
            </div>
            <div className="space-y-4">
              {[
                { key: 'delai_premier_rappel', label: '1er rappel', desc: 'Rappel amiable' },
                { key: 'delai_deuxieme_rappel', label: '2ème rappel', desc: 'Rappel ferme' },
                { key: 'delai_mise_en_demeure', label: 'Mise en demeure', desc: 'Courrier recommandé' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-coplio-text">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" max="365"
                      value={p[key as keyof Params] as number}
                      onChange={e => set(key as keyof Params, Number(e.target.value))}
                      className="w-20 px-3 py-1.5 text-sm border border-border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[#374151]/20" />
                    <span className="text-sm text-muted-foreground">jours</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Canaux */}
          <section className="coplio-card">
            <h2 className="font-semibold text-coplio-text mb-4">Canaux d&apos;envoi</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-coplio-text">1er rappel</span>
                </div>
                <div className="pl-6 space-y-1">
                  <Toggle value={p.premier_rappel_email} onChange={v => set('premier_rappel_email', v)} label="Email" />
                  <div className="flex items-center justify-between py-2 opacity-50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-coplio-text">SMS</span>
                      <span className="text-xs text-muted-foreground bg-coplio-bg px-1.5 py-0.5 rounded">Twilio requis</span>
                    </div>
                    <Toggle value={p.premier_rappel_sms} onChange={v => set('premier_rappel_sms', v)} label="" />
                  </div>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-coplio-text">2ème rappel</span>
                </div>
                <div className="pl-6 space-y-1">
                  <Toggle value={p.deuxieme_rappel_email} onChange={v => set('deuxieme_rappel_email', v)} label="Email" />
                  <div className="flex items-center justify-between py-2 opacity-50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-coplio-text">SMS</span>
                      <span className="text-xs text-muted-foreground bg-coplio-bg px-1.5 py-0.5 rounded">Twilio requis</span>
                    </div>
                    <Toggle value={p.deuxieme_rappel_sms} onChange={v => set('deuxieme_rappel_sms', v)} label="" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Messages personnalisés */}
          <section className="coplio-card">
            <h2 className="font-semibold text-coplio-text mb-4">Messages personnalisés</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Texte du 1er rappel</label>
                <textarea rows={3} value={p.texte_premier_rappel ?? ''}
                  onChange={e => set('texte_premier_rappel', e.target.value)}
                  placeholder="Laissez vide pour utiliser le message par défaut…"
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Texte du 2ème rappel</label>
                <textarea rows={3} value={p.texte_deuxieme_rappel ?? ''}
                  onChange={e => set('texte_deuxieme_rappel', e.target.value)}
                  placeholder="Laissez vide pour utiliser le message par défaut…"
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20 resize-none" />
              </div>
            </div>
          </section>

          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#374151] text-white text-sm font-medium rounded-xl hover:bg-[#374151]/90 transition-colors disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saved && <CheckCircle2 className="w-4 h-4" />}
            {saved ? 'Enregistré !' : saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}
          </button>
        </>
      )}
    </div>
  )
}
