'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Home, Building2, User, Check, Loader2, ChevronRight } from 'lucide-react'

const steps = [
  { id: 1, title: 'Votre profil', icon: User },
  { id: 2, title: 'Votre cabinet', icon: Building2 },
  { id: 3, title: 'Prêt à démarrer', icon: Check },
]

const step1Schema = z.object({
  prenom: z.string().min(2, 'Prénom requis'),
  nom: z.string().min(2, 'Nom requis'),
  telephone: z.string().optional(),
})

const step2Schema = z.object({
  nomCabinet: z.string().min(2, 'Nom requis'),
  siret: z
    .string()
    .length(14, 'SIRET : 14 chiffres')
    .optional()
    .or(z.literal('')),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  telephone: z.string().optional(),
  emailContact: z.string().email('Email invalide').optional().or(z.literal('')),
})

type Step1Values = z.infer<typeof step1Schema>
type Step2Values = z.infer<typeof step2Schema>

interface OnboardingWizardProps {
  userId: string
  userEmail: string
  userMeta: Record<string, unknown>
}

export function OnboardingWizard({ userId, userEmail, userMeta }: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null)

  const form1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      prenom: (userMeta.prenom as string) ?? '',
      nom: (userMeta.nom as string) ?? '',
    },
  })

  const form2 = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      nomCabinet: (userMeta.nom_cabinet as string) ?? '',
    },
  })

  async function handleStep1(values: Step1Values) {
    setStep1Data(values)
    setCurrentStep(2)
  }

  async function handleStep2(values: Step2Values) {
    if (!step1Data) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom: step1Data.prenom,
          nom: step1Data.nom,
          telephone: step1Data.telephone,
          nomCabinet: values.nomCabinet,
          siret: values.siret,
          adresse: values.adresse,
          codePostal: values.codePostal,
          ville: values.ville,
          telephoneCabinet: values.telephone,
          emailContact: values.emailContact,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Une erreur est survenue.')

      setCurrentStep(3)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  function goToDashboard() {
    router.push('/dashboard')
    router.refresh()
  }

  const inputClass = `w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
    focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent
    placeholder:text-muted-foreground transition-shadow`

  return (
    <div className="w-full max-w-lg">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 justify-center">
        <div className="w-9 h-9 bg-coplio-green rounded-xl flex items-center justify-center">
          <Home className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl text-coplio-green">Coplio</span>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  currentStep > step.id
                    ? 'bg-coplio-green text-white'
                    : currentStep === step.id
                    ? 'bg-coplio-green text-white'
                    : 'bg-white border-2 border-border text-muted-foreground'
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-xs mt-1 font-medium ${
                  currentStep >= step.id ? 'text-coplio-green' : 'text-muted-foreground'
                }`}
              >
                {step.title}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-16 h-0.5 mb-4 mx-2 transition-colors ${
                  currentStep > step.id ? 'bg-coplio-green' : 'bg-border'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
        {/* Étape 1 */}
        {currentStep === 1 && (
          <>
            <h2 className="text-xl font-bold text-coplio-text mb-1">Votre profil</h2>
            <p className="text-muted-foreground text-sm mb-6">Ces informations sont affichées dans l&apos;app.</p>

            <form onSubmit={form1.handleSubmit(handleStep1)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-coplio-text mb-1.5">Prénom *</label>
                  <input {...form1.register('prenom')} className={inputClass} />
                  {form1.formState.errors.prenom && (
                    <p className="mt-1 text-xs text-coplio-red">{form1.formState.errors.prenom.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-coplio-text mb-1.5">Nom *</label>
                  <input {...form1.register('nom')} className={inputClass} />
                  {form1.formState.errors.nom && (
                    <p className="mt-1 text-xs text-coplio-red">{form1.formState.errors.nom.message}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Téléphone</label>
                <input
                  {...form1.register('telephone')}
                  className={inputClass}
                  placeholder="06 12 34 56 78"
                  type="tel"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-coplio-green text-white font-medium py-2.5 px-4 rounded-lg
                           hover:bg-coplio-green/90 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                Continuer
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        {/* Étape 2 */}
        {currentStep === 2 && (
          <>
            <h2 className="text-xl font-bold text-coplio-text mb-1">Votre cabinet</h2>
            <p className="text-muted-foreground text-sm mb-6">Ces informations apparaissent sur les documents générés.</p>

            {error && (
              <div className="mb-4 p-3 bg-coplio-red-bg border border-coplio-red/20 rounded-lg">
                <p className="text-coplio-red text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={form2.handleSubmit(handleStep2)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Nom du cabinet *</label>
                <input {...form2.register('nomCabinet')} className={inputClass} placeholder="Cabinet Syndic Dupont" />
                {form2.formState.errors.nomCabinet && (
                  <p className="mt-1 text-xs text-coplio-red">{form2.formState.errors.nomCabinet.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-coplio-text mb-1.5">SIRET</label>
                  <input
                    {...form2.register('siret')}
                    className={inputClass}
                    placeholder="12345678901234"
                    maxLength={14}
                  />
                  {form2.formState.errors.siret && (
                    <p className="mt-1 text-xs text-coplio-red">{form2.formState.errors.siret.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-coplio-text mb-1.5">Téléphone</label>
                  <input {...form2.register('telephone')} className={inputClass} placeholder="04 72 00 00 00" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Adresse</label>
                <input {...form2.register('adresse')} className={inputClass} placeholder="12 rue de la Paix" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-coplio-text mb-1.5">Code postal</label>
                  <input {...form2.register('codePostal')} className={inputClass} placeholder="69000" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-coplio-text mb-1.5">Ville</label>
                  <input {...form2.register('ville')} className={inputClass} placeholder="Lyon" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-coplio-text mb-1.5">Email de contact</label>
                <input
                  {...form2.register('emailContact')}
                  type="email"
                  className={inputClass}
                  placeholder="contact@cabinet.fr"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 bg-coplio-bg text-coplio-text font-medium py-2.5 px-4 rounded-lg
                             hover:bg-border transition-colors text-sm"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-coplio-green text-white font-medium py-2.5 px-4 rounded-lg
                             hover:bg-coplio-green/90 transition-colors disabled:opacity-60
                             flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Créer mon cabinet
                </button>
              </div>
            </form>
          </>
        )}

        {/* Étape 3 — Succès */}
        {currentStep === 3 && (
          <div className="text-center py-2">
            <div className="w-16 h-16 bg-coplio-green-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-coplio-green" />
            </div>
            <h2 className="text-xl font-bold text-coplio-text mb-1">Votre cabinet est prêt ! 🎉</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Essai gratuit de <strong>14 jours</strong> démarré. Aucune carte bancaire requise.
            </p>

            {/* Étapes suggérées */}
            <div className="grid grid-cols-1 gap-2 mb-6 text-left">
              {[
                { emoji: '🏢', label: 'Ajoutez votre première copropriété', href: '/coproprietes/new' },
                { emoji: '👥', label: 'Invitez vos copropriétaires', href: '/coproprietaires' },
                { emoji: '📄', label: 'Importez vos documents', href: '/documents/upload' },
              ].map(({ emoji, label, href }) => (
                <a
                  key={href}
                  href={href}
                  className="flex items-center gap-3 text-sm text-coplio-text bg-coplio-green-light
                             p-3 rounded-lg hover:bg-coplio-green/10 transition-colors cursor-pointer"
                >
                  <span className="text-lg">{emoji}</span>
                  <span className="flex-1">{label}</span>
                  <ChevronRight className="w-4 h-4 text-coplio-green" />
                </a>
              ))}
            </div>

            <button
              onClick={goToDashboard}
              className="w-full bg-coplio-green text-white font-medium py-2.5 px-4 rounded-lg
                         hover:bg-coplio-green/90 transition-colors text-sm"
            >
              Voir mon tableau de bord →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
