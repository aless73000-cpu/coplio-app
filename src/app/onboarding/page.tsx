'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home, Building2, CheckCircle2, Loader2, ArrowRight, User, ArrowLeft,
} from 'lucide-react'

const inputClass = `w-full px-3 py-2.5 text-sm bg-white border border-border rounded-xl
  focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent
  placeholder:text-muted-foreground transition-shadow`

const STEPS = [
  { id: 1, label: 'Votre profil', icon: User },
  { id: 2, label: 'Votre cabinet', icon: Building2 },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [profile, setProfile] = useState({ prenom: '', nom: '', telephone: '' })
  const [cabinet, setCabinet] = useState({
    nomCabinet: '',
    siret: '',
    adresse: '',
    codePostal: '',
    ville: '',
    telephoneCabinet: '',
    emailContact: '',
  })

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, ...cabinet }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création')
        return
      }
      router.push('/dashboard')
    } catch {
      setError('Erreur réseau, veuillez réessayer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-coplio-bg flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-10 h-10 bg-coplio-green rounded-xl flex items-center justify-center">
          <Home className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-coplio-text">Coplio</span>
      </Link>

      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          {STEPS.map((s, i) => {
            const done = step > s.id
            const current = step === s.id
            const Icon = s.icon
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  done ? 'bg-coplio-green' : current ? 'bg-coplio-green' : 'bg-border'
                }`}>
                  {done
                    ? <CheckCircle2 className="w-4 h-4 text-white" />
                    : <Icon className={`w-4 h-4 ${current ? 'text-white' : 'text-muted-foreground'}`} />
                  }
                </div>
                <span className={`text-sm font-medium hidden sm:block ${current || done ? 'text-coplio-text' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 ml-2 transition-all ${step > s.id ? 'bg-coplio-green' : 'bg-border'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-bold text-coplio-text">Bienvenue sur Coplio 👋</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Commençons par créer votre profil. Cela prend moins de 2 minutes.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-coplio-text mb-1.5">Prénom *</label>
                  <input
                    className={inputClass}
                    placeholder="Jean"
                    value={profile.prenom}
                    onChange={(e) => setProfile((p) => ({ ...p, prenom: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-coplio-text mb-1.5">Nom *</label>
                  <input
                    className={inputClass}
                    placeholder="Dupont"
                    value={profile.nom}
                    onChange={(e) => setProfile((p) => ({ ...p, nom: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Téléphone</label>
                <input
                  className={inputClass}
                  placeholder="06 12 34 56 78"
                  type="tel"
                  value={profile.telephone}
                  onChange={(e) => setProfile((p) => ({ ...p, telephone: e.target.value }))}
                />
              </div>

              <button
                onClick={() => {
                  if (!profile.prenom || !profile.nom) {
                    setError('Prénom et nom requis')
                    return
                  }
                  setError('')
                  setStep(2)
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-coplio-green text-white font-medium rounded-xl hover:bg-coplio-green/90 transition-colors"
              >
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-bold text-coplio-text">Votre cabinet</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Ces informations apparaîtront sur vos documents et courriers.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Nom du cabinet *</label>
                <input
                  className={inputClass}
                  placeholder="Cabinet Immobilier Dupont"
                  value={cabinet.nomCabinet}
                  onChange={(e) => setCabinet((c) => ({ ...c, nomCabinet: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-coplio-text mb-1.5">SIRET</label>
                  <input
                    className={inputClass}
                    placeholder="123 456 789 00012"
                    value={cabinet.siret}
                    onChange={(e) => setCabinet((c) => ({ ...c, siret: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-coplio-text mb-1.5">Téléphone</label>
                  <input
                    className={inputClass}
                    placeholder="01 23 45 67 89"
                    type="tel"
                    value={cabinet.telephoneCabinet}
                    onChange={(e) => setCabinet((c) => ({ ...c, telephoneCabinet: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Adresse</label>
                <input
                  className={inputClass}
                  placeholder="10 rue de la Paix"
                  value={cabinet.adresse}
                  onChange={(e) => setCabinet((c) => ({ ...c, adresse: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-coplio-text mb-1.5">Code postal</label>
                  <input
                    className={inputClass}
                    placeholder="75001"
                    value={cabinet.codePostal}
                    onChange={(e) => setCabinet((c) => ({ ...c, codePostal: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-coplio-text mb-1.5">Ville</label>
                  <input
                    className={inputClass}
                    placeholder="Paris"
                    value={cabinet.ville}
                    onChange={(e) => setCabinet((c) => ({ ...c, ville: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Email de contact</label>
                <input
                  className={inputClass}
                  placeholder="contact@cabinet.fr"
                  type="email"
                  value={cabinet.emailContact}
                  onChange={(e) => setCabinet((c) => ({ ...c, emailContact: e.target.value }))}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 px-4 py-3 border border-border rounded-xl text-sm text-muted-foreground hover:bg-coplio-bg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !cabinet.nomCabinet}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-coplio-green text-white font-medium rounded-xl
                    hover:bg-coplio-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Création en cours…</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Créer mon cabinet</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Essai gratuit 14 jours · Aucune carte bancaire requise
        </p>
      </div>
    </div>
  )
}
