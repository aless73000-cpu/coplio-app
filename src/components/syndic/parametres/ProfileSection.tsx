'use client'

import { useState } from 'react'
import { User, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Profile } from '@/types'
import { Field } from './Field'

type Props = {
  profile: Profile
}

export function ProfileSection({ profile }: Props) {
  const [profileData, setProfileData] = useState({
    prenom: profile.prenom ?? '',
    nom: profile.nom ?? '',
    telephone: profile.telephone ?? '',
  })

  const [profileStatus, setProfileStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [profileError, setProfileError] = useState('')

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

  return (
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
  )
}
