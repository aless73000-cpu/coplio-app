'use client'

import { useState } from 'react'
import Link from 'next/link'
import { User, Building2, Bell, Loader2, CheckCircle2, Users, ChevronRight } from 'lucide-react'
import type { Profile, Cabinet } from '@/types'

type Props = {
  profile: Profile & { cabinet?: Cabinet | null }
}

export function ParametresClient({ profile }: Props) {
  const cabinet = profile.cabinet

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
            <Field
              label="Prénom"
              value={profileData.prenom}
              onChange={(v) => setProfileData((d) => ({ ...d, prenom: v }))}
            />
            <Field
              label="Nom"
              value={profileData.nom}
              onChange={(v) => setProfileData((d) => ({ ...d, nom: v }))}
            />
          </div>
          <Field label="Email" value={profile.email ?? ''} disabled />
          <Field
            label="Téléphone"
            value={profileData.telephone}
            type="tel"
            onChange={(v) => setProfileData((d) => ({ ...d, telephone: v }))}
          />
        </div>

        {profileError && <p className="mt-3 text-sm text-coplio-red">{profileError}</p>}

        <button
          onClick={saveProfile}
          disabled={profileStatus === 'loading'}
          className="mt-5 flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors disabled:opacity-60"
        >
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

        <div className="space-y-4">
          <Field
            label="Nom du cabinet"
            value={cabinetData.nom}
            onChange={(v) => setCabinetData((d) => ({ ...d, nom: v }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="SIRET"
              value={cabinetData.siret}
              onChange={(v) => setCabinetData((d) => ({ ...d, siret: v }))}
            />
            <Field
              label="Téléphone"
              value={cabinetData.telephone}
              type="tel"
              onChange={(v) => setCabinetData((d) => ({ ...d, telephone: v }))}
            />
          </div>
          <Field
            label="Adresse"
            value={cabinetData.adresse}
            onChange={(v) => setCabinetData((d) => ({ ...d, adresse: v }))}
          />
          <div className="grid grid-cols-3 gap-4">
            <Field
              label="Code postal"
              value={cabinetData.code_postal}
              onChange={(v) => setCabinetData((d) => ({ ...d, code_postal: v }))}
            />
            <div className="col-span-2">
              <Field
                label="Ville"
                value={cabinetData.ville}
                onChange={(v) => setCabinetData((d) => ({ ...d, ville: v }))}
              />
            </div>
          </div>
          <Field
            label="Email de contact"
            value={cabinetData.email_contact}
            type="email"
            onChange={(v) => setCabinetData((d) => ({ ...d, email_contact: v }))}
          />
        </div>

        {cabinetError && <p className="mt-3 text-sm text-coplio-red">{cabinetError}</p>}

        <button
          onClick={saveCabinet}
          disabled={cabinetStatus === 'loading'}
          className="mt-5 flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors disabled:opacity-60"
        >
          {cabinetStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {cabinetStatus === 'success' && <CheckCircle2 className="w-4 h-4" />}
          {cabinetStatus === 'success' ? 'Enregistré !' : 'Enregistrer'}
        </button>
      </section>

      {/* Équipe */}
      <Link href="/parametres/equipe" className="coplio-card flex items-center justify-between hover:border-coplio-green/40 transition-colors group">
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

      {/* Notifications */}
      <section className="coplio-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-coplio-green-light rounded-xl flex items-center justify-center">
            <Bell className="w-4 h-4 text-coplio-green" />
          </div>
          <h2 className="font-semibold text-coplio-text">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Récapitulatif quotidien par email', value: false },
            { label: 'Notifications email', value: false },
            { label: 'Notifications SMS', value: false },
          ].map(({ label, value }) => (
            <label key={label} className="flex items-center justify-between py-2">
              <span className="text-sm text-coplio-text">{label}</span>
              <div className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${value ? 'bg-coplio-green' : 'bg-border'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}

function Field({
  label,
  value,
  type = 'text',
  disabled = false,
  onChange,
}: {
  label: string
  value: string
  type?: string
  disabled?: boolean
  onChange?: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-coplio-text mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full px-3 py-2 text-sm border border-border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent
          ${disabled ? 'bg-coplio-bg text-muted-foreground cursor-not-allowed' : 'bg-white'}`}
      />
    </div>
  )
}
