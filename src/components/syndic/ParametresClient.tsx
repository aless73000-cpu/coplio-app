'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { User, Building2, Bell, Loader2, CheckCircle2, Users, ChevronRight, Upload, BellRing, FileUp } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import type { Profile, Cabinet } from '@/types'

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
      if (!res.ok) { setProfileError(data.error ?? 'Erreur'); setProfileStatus('error'); return }
      setProfileStatus('success')
      setTimeout(() => setProfileStatus('idle'), 3000)
    } catch {
      setProfileError('Erreur réseau')
      setProfileStatus('error')
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
    if (!res.ok) { setLogoError(data.error ?? 'Erreur upload'); return }
    setLogoUrl(data.logo_url)
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
      if (!res.ok) { setCabinetError(data.error ?? 'Erreur'); setCabinetStatus('error'); return }
      setCabinetStatus('success')
      setTimeout(() => setCabinetStatus('idle'), 3000)
    } catch {
      setCabinetError('Erreur réseau')
      setCabinetStatus('error')
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
          <div className="w-9 h-9 bg-coplio-green-light rounded-xl flex items-center justify-center">
            <User className="w-4 h-4 text-coplio-green" />
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
          className="mt-5 flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors disabled:opacity-60">
          {profileStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {profileStatus === 'success' && <CheckCircle2 className="w-4 h-4" />}
          {profileStatus === 'success' ? 'Enregistré !' : 'Enregistrer les modifications'}
        </button>
      </section>

      {/* Cabinet */}
      <section className="coplio-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-coplio-green-light rounded-xl flex items-center justify-center">
            <Building2 className="w-4 h-4 text-coplio-green" />
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
              className="flex items-center gap-1.5 text-xs font-medium text-coplio-green border border-coplio-green/40 px-3 py-1.5 rounded-lg hover:bg-coplio-green-light transition-colors disabled:opacity-60">
              {logoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {logoUploading ? 'Upload en cours...' : 'Changer le logo'}
            </button>
            {logoError && <p className="text-xs text-coplio-red mt-1">{logoError}</p>}
            {logoUrl && !logoUploading && (
              <p className="text-xs text-coplio-green mt-1 flex items-center gap-1">
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
          className="mt-5 flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors disabled:opacity-60">
          {cabinetStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {cabinetStatus === 'success' && <CheckCircle2 className="w-4 h-4" />}
          {cabinetStatus === 'success' ? 'Enregistré !' : 'Enregistrer'}
        </button>
      </section>

      {/* Équipe */}
      <Link href="/equipe" className="coplio-card flex items-center justify-between hover:border-coplio-green/40 transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-coplio-green-light rounded-xl flex items-center justify-center">
            <Users className="w-4 h-4 text-coplio-green" />
          </div>
          <div>
            <h2 className="font-semibold text-coplio-text">Mon équipe</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Inviter et gérer vos gestionnaires</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-coplio-green transition-colors" />
      </Link>

      {/* Outils */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/relances-config" className="coplio-card flex items-center justify-between hover:border-coplio-green/40 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
              <BellRing className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-coplio-text text-sm">Relances auto</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Impayés & rappels</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-coplio-green transition-colors" />
        </Link>

        <Link href="/importer" className="coplio-card flex items-center justify-between hover:border-coplio-green/40 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <FileUp className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-coplio-text text-sm">Import CSV</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Lots & copropriétaires</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-coplio-green transition-colors" />
        </Link>
      </div>

      {/* Notifications */}
      <section className="coplio-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-coplio-green-light rounded-xl flex items-center justify-center">
            <Bell className="w-4 h-4 text-coplio-green" />
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
                  className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${push.state === 'subscribed' ? 'bg-coplio-green' : 'bg-border'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${push.state === 'subscribed' ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
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
          focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent
          placeholder:text-muted-foreground disabled:bg-coplio-bg disabled:text-muted-foreground
          transition-shadow"
      />
    </div>
  )
}
