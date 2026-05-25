'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { User, Building2, Bell, Loader2, CheckCircle2, Users, ChevronRight, Upload, BellRing, FileUp, Database, History, RefreshCw, ChevronLeft, ShieldCheck, ShieldOff, KeyRound, Wrench, BookOpen, LayoutDashboard, SlidersHorizontal } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Cabinet } from '@/types'
import { ALL_NAV_ITEMS, DEFAULT_PINNED_IDS } from '@/lib/nav-items'
import { useSidebarPrefs } from '@/hooks/useSidebarPrefs'
import { DashboardPrefsEditor } from '@/components/dashboard/DashboardCanvas'

type Props = {
  profile: Profile & { cabinet?: Cabinet | null }
}

export function ParametresClient({ profile }: Props) {
  const cabinet = profile.cabinet
  const push = usePushNotifications()
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [profileData, setProfileData] = useState({
    prenom: profile.prenom ?? '',
    nom: profile.nom ?? '',
    telephone: profile.telephone ?? '',
  })

  const [cabinetData, setCabinetData] = useState({
    nom: cabinet?.nom ?? '',
    siret: cabinet?.siret ?? '',
    telephone: cabinet?.telephone ?? '',
    adresse: cabinet?.adresse ?? '',
    code_postal: cabinet?.code_postal ?? '',
    ville: cabinet?.ville ?? '',
    email_contact: cabinet?.email_contact ?? '',
  })

  const [profileStatus, setProfileStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [cabinetStatus, setCabinetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [profileError, setProfileError] = useState('')
  const [cabinetError, setCabinetError] = useState('')
  const [logoUrl, setLogoUrl] = useState(cabinet?.logo_url ?? '')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState('')

  async function saveProfile() {
    setProfileStatus('loading')
    setProfileError('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })
      const data = await res.json()
      if (!res.ok) {
        setProfileError(data.error ?? 'Erreur')
        setProfileStatus('error')
        toast.error(data.error ?? 'Erreur lors de la sauvegarde')
        return
      }
      setProfileStatus('success')
      toast.success('Profil enregistré')
      setTimeout(() => setProfileStatus('idle'), 3000)
    } catch {
      setProfileError('Erreur réseau')
      setProfileStatus('error')
      toast.error('Erreur réseau')
    }
  }

  async function uploadLogo(file: File) {
    setLogoUploading(true)
    setLogoError('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/cabinet/logo', { method: 'POST', body: fd })
    const data = await res.json()
    setLogoUploading(false)
    if (!res.ok) {
      setLogoError(data.error ?? 'Erreur upload')
      toast.error(data.error ?? 'Erreur upload du logo')
      return
    }
    setLogoUrl(data.logo_url)
    toast.success('Logo mis à jour')
  }

  async function saveCabinet() {
    setCabinetStatus('loading')
    setCabinetError('')
    try {
      const res = await fetch('/api/cabinet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cabinetData),
      })
      const data = await res.json()
      if (!res.ok) {
        setCabinetError(data.error ?? 'Erreur')
        setCabinetStatus('error')
        toast.error(data.error ?? 'Erreur lors de la sauvegarde')
        return
      }
      setCabinetStatus('success')
      toast.success('Cabinet enregistré')
      setTimeout(() => setCabinetStatus('idle'), 3000)
    } catch {
      setCabinetError('Erreur réseau')
      setCabinetStatus('error')
      toast.error('Erreur réseau')
    }
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Paramètres</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gérez votre profil et les paramètres de votre cabinet
        </p>
      </div>

      {/* Profil personnel */}
      <section className="coplio-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
            <User className="w-4 h-4 text-[#374151]" />
          </div>
          <h2 className="font-semibold text-coplio-text">Mon profil</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prénom" value={profileData.prenom} onChange={(v) => setProfileData((d) => ({ ...d, prenom: v }))} />
            <Field label="Nom" value={profileData.nom} onChange={(v) => setProfileData((d) => ({ ...d, nom: v }))} />
          </div>
          <Field label="Email" value={profile.email ?? ''} disabled />
          <Field label="Téléphone" value={profileData.telephone} type="tel" onChange={(v) => setProfileData((d) => ({ ...d, telephone: v }))} />
        </div>

        {profileError && <p className="mt-3 text-sm text-coplio-red">{profileError}</p>}
        <button onClick={saveProfile} disabled={profileStatus === 'loading'}
          className="mt-5 flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 transition-colors disabled:opacity-60">
          {profileStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {profileStatus === 'success' && <CheckCircle2 className="w-4 h-4" />}
          {profileStatus === 'success' ? 'Enregistré !' : 'Enregistrer les modifications'}
        </button>
      </section>

      {/* Cabinet */}
      <section className="coplio-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-4 h-4 text-[#374151]" />
          </div>
          <h2 className="font-semibold text-coplio-text">Mon cabinet</h2>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border">
          <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-coplio-bg overflow-hidden flex-shrink-0">
            {logoUrl ? (
              <Image src={logoUrl} alt="Logo cabinet" width={64} height={64} className="object-contain w-full h-full" />
            ) : (
              <Building2 className="w-7 h-7 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-coplio-text mb-1">Logo du cabinet</p>
            <p className="text-xs text-muted-foreground mb-2">JPG, PNG, WebP ou SVG · max 2 Mo</p>
            <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }} />
            <button onClick={() => logoInputRef.current?.click()} disabled={logoUploading}
              className="flex items-center gap-1.5 text-xs font-medium text-[#374151] border border-[#374151]/40 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-60">
              {logoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {logoUploading ? 'Upload en cours...' : 'Changer le logo'}
            </button>
            {logoError && <p className="text-xs text-coplio-red mt-1">{logoError}</p>}
            {logoUrl && !logoUploading && (
              <p className="text-xs text-[#374151] mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Logo enregistré
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Nom du cabinet" value={cabinetData.nom} onChange={(v) => setCabinetData((d) => ({ ...d, nom: v }))} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="SIRET" value={cabinetData.siret} onChange={(v) => setCabinetData((d) => ({ ...d, siret: v }))} />
            <Field label="Téléphone" value={cabinetData.telephone} type="tel" onChange={(v) => setCabinetData((d) => ({ ...d, telephone: v }))} />
          </div>
          <Field label="Adresse" value={cabinetData.adresse} onChange={(v) => setCabinetData((d) => ({ ...d, adresse: v }))} />
          <div className="grid grid-cols-3 gap-4">
            <Field label="Code postal" value={cabinetData.code_postal} onChange={(v) => setCabinetData((d) => ({ ...d, code_postal: v }))} />
            <div className="col-span-2">
              <Field label="Ville" value={cabinetData.ville} onChange={(v) => setCabinetData((d) => ({ ...d, ville: v }))} />
            </div>
          </div>
          <Field label="Email de contact" value={cabinetData.email_contact} type="email" onChange={(v) => setCabinetData((d) => ({ ...d, email_contact: v }))} />
        </div>

        {cabinetError && <p className="mt-3 text-sm text-coplio-red">{cabinetError}</p>}
        <button onClick={saveCabinet} disabled={cabinetStatus === 'loading'}
          className="mt-5 flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 transition-colors disabled:opacity-60">
          {cabinetStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {cabinetStatus === 'success' && <CheckCircle2 className="w-4 h-4" />}
          {cabinetStatus === 'success' ? 'Enregistré !' : 'Enregistrer'}
        </button>
      </section>

      {/* Équipe */}
      <Link href="/equipe" className="coplio-card flex items-center justify-between hover:border-[#374151]/40 transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
            <Users className="w-4 h-4 text-[#374151]" />
          </div>
          <div>
            <h2 className="font-semibold text-coplio-text">Mon équipe</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Inviter et gérer vos gestionnaires</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#374151] transition-colors" />
      </Link>

      {/* Outils */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/relances-config" className="coplio-card flex items-center justify-between hover:border-[#374151]/40 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
              <BellRing className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-coplio-text text-sm">Relances auto</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Impayés & rappels</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#374151] transition-colors" />
        </Link>

        <Link href="/importer" className="coplio-card flex items-center justify-between hover:border-[#374151]/40 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <FileUp className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-coplio-text text-sm">Import Excel</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Lots & copropriétaires en un fichier</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#374151] transition-colors" />
        </Link>

        <Link href="/prestataires" className="coplio-card flex items-center justify-between hover:border-[#374151]/40 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
              <Wrench className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold text-coplio-text text-sm">Prestataires</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Gérer vos intervenants</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#374151] transition-colors" />
        </Link>

        <Link href="/carnet-entretien" className="coplio-card flex items-center justify-between hover:border-[#374151]/40 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-coplio-text text-sm">Carnet d&apos;entretien</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Suivi des interventions</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#374151] transition-colors" />
        </Link>
      </div>

      {/* Ma Sidebar */}
      <SidebarPrefsSection userId={profile.id} />

      {/* Mon Tableau de bord */}
      <DashboardPrefsSection userId={profile.id} />

      {/* Migration base de données */}
      <MigrationSection />

      {/* Notifications */}
      <section className="coplio-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
            <Bell className="w-4 h-4 text-[#374151]" />
          </div>
          <h2 className="font-semibold text-coplio-text">Notifications</h2>
        </div>
        <div className="space-y-3">
          {push.state !== 'unsupported' && (
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-coplio-text">Notifications push</p>
                {push.state === 'denied' && (
                  <p className="text-xs text-muted-foreground mt-0.5">Bloquées dans le navigateur</p>
                )}
              </div>
              {push.state === 'loading' ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : push.state === 'denied' ? (
                <span className="text-xs text-muted-foreground">Bloquées</span>
              ) : (
                <button
                  onClick={push.state === 'subscribed' ? push.unsubscribe : push.subscribe}
                  className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${push.state === 'subscribed' ? 'bg-[#374151]' : 'bg-border'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${push.state === 'subscribed' ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Sécurité — 2FA */}
      <TwoFactorSection />

      {/* Historique des actions */}
      <HistoriqueSection />
    </div>
  )
}

// ─── Sidebar Prefs Section ────────────────────────────────────

function SidebarPrefsSection({ userId }: { userId: string }) {
  const { pinnedIds, setPinnedIds, hydrated } = useSidebarPrefs(userId)
  const [localPinned, setLocalPinned] = useState<string[]>(DEFAULT_PINNED_IDS)
  const [saved, setSaved] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (hydrated) setLocalPinned(pinnedIds)
  }, [hydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  // Items configurables (non alwaysPinned)
  const configurableItems = ALL_NAV_ITEMS.filter((item) => !item.alwaysPinned)
  const alwaysPinnedItems  = ALL_NAV_ITEMS.filter((item) => item.alwaysPinned)

  function toggle(id: string) {
    setLocalPinned((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
    setSaved(false)
  }

  function handleSave() {
    // Toujours inclure les alwaysPinned
    const alwaysIds = alwaysPinnedItems.map((i) => i.id)
    const combined = [...alwaysIds, ...localPinned]
    const merged = combined.filter((id, idx) => combined.indexOf(id) === idx)
    setPinnedIds(merged)
    setSaved(true)
    toast.success('Sidebar enregistrée')
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <section className="coplio-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4 text-[#374151]" />
          </div>
          <div className="text-left">
            <h2 className="font-semibold text-coplio-text">Ma Sidebar</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choisissez les raccourcis affichés dans votre menu
            </p>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="mt-5 space-y-4">
          {/* Items toujours épinglés */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Toujours visibles
            </p>
            <div className="space-y-1">
              {alwaysPinnedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-coplio-bg border border-border/50 opacity-60"
                >
                  <item.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-coplio-text">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">Fixe</span>
                </div>
              ))}
            </div>
          </div>

          {/* Items configurables */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Personnalisables — cochez ce que vous voulez voir
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Les éléments non cochés apparaîtront dans la section <strong>Autres</strong> de votre sidebar (accessible en un clic).
            </p>
            <div className="space-y-2">
              {!hydrated ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                configurableItems.map((item) => {
                  const isPinned = localPinned.includes(item.id)
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                        isPinned
                          ? 'bg-slate-100 border-[#374151]/30'
                          : 'bg-white border-border hover:border-[#374151]/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isPinned}
                        onChange={() => toggle(item.id)}
                        className="w-4 h-4 rounded accent-[#374151] flex-shrink-0"
                      />
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${isPinned ? 'text-[#374151]' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isPinned ? 'text-[#374151]' : 'text-coplio-text'}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </label>
                  )
                })
              )}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!hydrated}
            className="flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 transition-colors disabled:opacity-60"
          >
            {saved && <CheckCircle2 className="w-4 h-4" />}
            {saved ? 'Enregistré !' : 'Enregistrer'}
          </button>
        </div>
      )}
    </section>
  )
}

// ─── Dashboard Prefs Section ──────────────────────────────────

function DashboardPrefsSection({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <section className="coplio-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-left">
            <h2 className="font-semibold text-coplio-text">Mon Tableau de bord</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Réorganisez et masquez les blocs de votre dashboard
            </p>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="mt-5">
          <DashboardPrefsEditor userId={userId} />
        </div>
      )}
    </section>
  )
}

// ─── Two-Factor Authentication Section ───────────────────────

type MfaStep = 'idle' | 'enrolling' | 'verifying' | 'disabling'

function TwoFactorSection() {
  const [step, setStep]         = useState<MfaStep>('idle')
  const [enabled, setEnabled]   = useState<boolean | null>(null)  // null = loading
  const [factorId, setFactorId] = useState('')
  const [qrUri, setQrUri]       = useState('')       // otpauth:// URI for manual entry
  const [qrSecret, setQrSecret] = useState('')       // base32 secret
  const [code, setCode]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const codeInputRef            = useRef<HTMLInputElement>(null)

  // Check current 2FA status on mount
  useEffect(() => {
    async function checkMfa() {
      const supabase = createClient()
      const { data } = await supabase.auth.mfa.listFactors()
      const verified = data?.totp?.find(f => f.status === 'verified')
      if (verified) {
        setFactorId(verified.id)
        setEnabled(true)
      } else {
        setEnabled(false)
      }
    }
    checkMfa()
  }, [])

  async function startEnroll() {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'Coplio' })
      if (enrollErr || !data) {
        setError(enrollErr?.message ?? 'Erreur lors de l\'activation.')
        return
      }
      setFactorId(data.id)
      setQrUri(data.totp.uri)
      setQrSecret(data.totp.secret)
      setStep('verifying')
      setTimeout(() => codeInputRef.current?.focus(), 150)
    } finally {
      setLoading(false)
    }
  }

  async function verifyEnroll() {
    if (code.length !== 6) { setError('Le code doit comporter 6 chiffres.'); return }
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: challengeData, error: cErr } = await supabase.auth.mfa.challenge({ factorId })
      if (cErr || !challengeData) { setError('Impossible de générer le défi.'); return }
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId, challengeId: challengeData.id, code,
      })
      if (vErr) {
        setError('Code incorrect. Vérifiez votre application.')
        setCode('')
        codeInputRef.current?.focus()
        return
      }
      setEnabled(true)
      setStep('idle')
      setCode('')
      setQrUri('')
      setQrSecret('')
      toast.success('Authentification à deux facteurs activée !')
    } finally {
      setLoading(false)
    }
  }

  async function disable2FA() {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: uErr } = await supabase.auth.mfa.unenroll({ factorId })
      if (uErr) { setError(uErr.message); return }
      setEnabled(false)
      setFactorId('')
      setStep('idle')
      toast.success('Authentification à deux facteurs désactivée.')
    } finally {
      setLoading(false)
    }
  }

  function cancelEnroll() {
    // If we enrolled but didn't verify, clean up (unenroll the unverified factor)
    if (factorId) {
      createClient().auth.mfa.unenroll({ factorId }).catch(() => {})
    }
    setStep('idle')
    setCode('')
    setError('')
    setQrUri('')
    setQrSecret('')
    setFactorId('')
  }

  return (
    <section className="coplio-card">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
        </div>
        <div>
          <h2 className="font-semibold text-coplio-text">Sécurité — Double authentification</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Protégez votre compte avec un code TOTP</p>
        </div>
      </div>

      {enabled === null ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : step === 'idle' ? (
        <>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-4 ${enabled ? 'bg-slate-100 text-[#374151]' : 'bg-coplio-bg text-muted-foreground'}`}>
            {enabled
              ? <><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> 2FA activée — votre compte est protégé</>
              : <><ShieldOff className="w-4 h-4 flex-shrink-0" /> 2FA désactivée</>
            }
          </div>

          {error && <p className="mb-3 text-sm text-coplio-red">{error}</p>}

          {enabled ? (
            <button
              onClick={() => setStep('disabling')}
              className="flex items-center gap-2 text-sm font-medium text-coplio-red border border-coplio-red/30 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <ShieldOff className="w-4 h-4" /> Désactiver la 2FA
            </button>
          ) : (
            <button
              onClick={() => { setStep('enrolling'); startEnroll() }}
              disabled={loading}
              className="flex items-center gap-2 text-sm font-medium text-purple-600 border border-purple-200 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Activer la 2FA
            </button>
          )}
        </>
      ) : step === 'enrolling' ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : step === 'verifying' ? (
        <div className="space-y-4">
          <p className="text-sm text-coplio-text">
            Scannez le QR code dans votre application d&apos;authentification (Google Authenticator, Authy, etc.), puis entrez le code à 6 chiffres affiché.
          </p>

          {/* QR code via Google Charts API */}
          {qrUri && (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="p-3 bg-white border-2 border-border rounded-xl inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrUri)}`}
                  alt="QR code 2FA"
                  width={160}
                  height={160}
                  className="rounded"
                />
              </div>
              {qrSecret && (
                <div className="flex items-center gap-2 bg-coplio-bg border border-border rounded-lg px-3 py-2 w-full">
                  <KeyRound className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs font-mono text-muted-foreground flex-1 break-all select-all">{qrSecret}</p>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(qrSecret); toast.success('Clé copiée') }}
                    className="text-xs text-[#374151] hover:underline flex-shrink-0"
                  >
                    Copier
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center">
                Vous pouvez aussi saisir la clé manuellement si vous ne pouvez pas scanner.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-coplio-red">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">
              Code de vérification
            </label>
            <input
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-[#374151]/20 focus:border-transparent
                         tracking-[0.4em] font-mono text-center text-lg"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={verifyEnroll}
              disabled={loading || code.length !== 6}
              className="flex-1 flex items-center justify-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Confirmer
            </button>
            <button
              onClick={cancelEnroll}
              disabled={loading}
              className="text-sm text-muted-foreground border border-border px-4 py-2 rounded-lg hover:text-coplio-text transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : step === 'disabling' ? (
        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">Désactiver la double authentification ?</p>
            <p className="text-xs text-red-600 mt-1">Votre compte sera moins sécurisé. Vous pourrez la réactiver à tout moment.</p>
          </div>
          {error && <p className="text-sm text-coplio-red">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={disable2FA}
              disabled={loading}
              className="flex items-center gap-2 text-sm font-medium text-white bg-coplio-red px-4 py-2 rounded-lg hover:bg-coplio-red/90 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
              Oui, désactiver
            </button>
            <button
              onClick={() => { setStep('idle'); setError('') }}
              disabled={loading}
              className="text-sm text-muted-foreground border border-border px-4 py-2 rounded-lg hover:text-coplio-text transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

// ─── Historique Section ───────────────────────────────────────

interface AuditLog {
  id: string
  action: string
  entite: string
  entite_id: string | null
  entite_nom: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  user: { prenom: string; nom: string } | null
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Création', update: 'Modification', delete: 'Suppression',
  send: 'Envoi', pay: 'Paiement', invite: 'Invitation',
  login: 'Connexion', status_change: 'Statut modifié', upload: 'Fichier ajouté', export: 'Export',
}

const ENTITE_LABELS: Record<string, string> = {
  copropriete: 'Copropriété', lot: 'Lot', coproprietaire: 'Copropriétaire',
  appel_charges: 'Appel de charges', paiement: 'Paiement', sinistre: 'Sinistre',
  assemblee: 'Assemblée', document: 'Document', message: 'Message',
  membre_equipe: 'Équipe', vote: 'Vote', budget: 'Budget',
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-slate-100 text-[#374151]',
  update: 'bg-blue-50 text-blue-600',
  delete: 'bg-red-50 text-red-600',
  send:   'bg-purple-50 text-purple-600',
  pay:    'bg-slate-100 text-[#374151]',
  invite: 'bg-amber-50 text-amber-600',
  status_change: 'bg-blue-50 text-blue-600',
  upload: 'bg-coplio-bg text-muted-foreground',
  export: 'bg-coplio-bg text-muted-foreground',
}

function HistoriqueSection() {
  const [logs,    setLogs]    = useState<AuditLog[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(false)
  const [page,    setPage]    = useState(0)
  const [open,    setOpen]    = useState(false)
  const LIMIT = 20

  const load = useCallback(async (p = 0) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/audit-logs?limit=${LIMIT}&offset=${p * LIMIT}`)
      const data = await res.json()
      setLogs(data.logs ?? [])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch {
      toast.error('Impossible de charger l\'historique')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) load(0)
  }, [open, load])

  return (
    <section className="coplio-card">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-coplio-bg rounded-xl flex items-center justify-center">
            <History className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-left">
            <h2 className="font-semibold text-coplio-text">Historique des actions</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Audit trail de votre cabinet</p>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">{total} action{total > 1 ? 's' : ''} au total</p>
            <button
              onClick={() => load(page)}
              disabled={loading}
              className="flex items-center gap-1 text-xs text-[#374151] hover:underline disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune action enregistrée</p>
          ) : (
            <>
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${ACTION_COLORS[log.action] ?? 'bg-coplio-bg text-muted-foreground'}`}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-coplio-text">
                        <span className="font-medium">{ENTITE_LABELS[log.entite] ?? log.entite}</span>
                        {log.entite_nom && <span className="text-muted-foreground"> — {log.entite_nom}</span>}
                      </p>
                      {log.user && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          par {log.user.prenom} {log.user.nom}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(log.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {total > LIMIT && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <button
                    onClick={() => load(page - 1)}
                    disabled={page === 0 || loading}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-coplio-text disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Précédent
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} / {total}
                  </span>
                  <button
                    onClick={() => load(page + 1)}
                    disabled={(page + 1) * LIMIT >= total || loading}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-coplio-text disabled:opacity-40 transition-colors"
                  >
                    Suivant <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}

// ─── Migration Section ────────────────────────────────────────
function MigrationSection() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error' | 'no-db'>('idle')
  const [results, setResults] = useState<{ id: string; status: string; message: string }[]>([])
  async function runMigrations() {
    setStatus('loading')
    setResults([])
    try {
      const secret = (document.getElementById('migration-secret') as HTMLInputElement)?.value ?? ''
      const res = await fetch('/api/admin/migrate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}` },
      })
      const data = await res.json()

      if (res.status === 503) {
        setStatus('no-db')
        return
      }

      setResults(data.results ?? [])
      setStatus(data.success ? 'ok' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'ok') return (
    <section className="coplio-card border-l-4 border-l-[#374151]">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-[#374151]" />
        <p className="font-semibold text-coplio-text text-sm">Migrations appliquées avec succès</p>
      </div>
      {results.map((r) => (
        <p key={r.id} className="text-xs text-muted-foreground mt-1">✓ {r.message}</p>
      ))}
    </section>
  )

  return (
    <section className="coplio-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
          <Database className="w-4 h-4 text-purple-600" />
        </div>
        <div>
          <h2 className="font-semibold text-coplio-text text-sm">Migrations base de données</h2>
          <p className="text-xs text-muted-foreground">Appliquer les mises à jour du schéma SQL</p>
        </div>
      </div>

      {status === 'no-db' ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
          <p className="font-semibold">DATABASE_URL manquant dans Vercel</p>
          <p>1. Va sur <span className="font-mono">supabase.com/dashboard → Settings → Database</span></p>
          <p>2. Copie la &ldquo;Connection string&rdquo; (mode Transaction)</p>
          <p>3. Ajoute <span className="font-mono">DATABASE_URL</span> dans Vercel → Settings → Env Vars</p>
          <p>4. Redéploie puis reviens ici</p>
        </div>
      ) : status === 'error' ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 mb-3">
          {results.length > 0
            ? results.map((r) => <p key={r.id}>⚠ {r.message}</p>)
            : <p>Erreur lors de l&apos;application des migrations</p>
          }
        </div>
      ) : null}

      <div className="flex gap-2 mt-3">
        <input
          id="migration-secret"
          type="password"
          placeholder="CRON_SECRET"
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          onClick={runMigrations}
          disabled={status === 'loading'}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60"
        >
          {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          Appliquer
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Entrez votre CRON_SECRET (visible dans Vercel → Settings → Env Vars)
      </p>
    </section>
  )
}

function Field({
  label, value, type = 'text', disabled = false, onChange,
}: {
  label: string; value: string; type?: string; disabled?: boolean; onChange?: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-coplio-text mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-[#374151]/20 focus:border-transparent
          placeholder:text-gray-400 disabled:bg-coplio-bg disabled:text-muted-foreground
          transition-shadow"
      />
    </div>
  )
}
