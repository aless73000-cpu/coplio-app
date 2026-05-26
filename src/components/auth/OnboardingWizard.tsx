'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Home, Building2, User, Check, Loader2, ChevronRight, Zap } from 'lucide-react'
import { PLANS_CONFIG } from '@/types'

const steps = [
  { id: 1, title: 'Votre profil', icon: User },
  { id: 2, title: 'Votre cabinet', icon: Building2 },
  { id: 3, title: 'Votre plan', icon: Zap },
  { id: 4, title: 'Prêt !', icon: Check },
]

const PLAN_OPTIONS = [
  {
    key: 'starter',
    name: PLANS_CONFIG.starter.name,
    price: PLANS_CONFIG.starter.price,
    highlight: 'Idéal pour démarrer',
    features: ['1 gestionnaire', 'Jusqu\'à 75 lots', 'Portail inclus'],
    popular: false,
    href: '/facturation?plan=starter',
  },
  {
    key: 'pro',
    name: PLANS_CONFIG.pro.name,
    price: PLANS_CONFIG.pro.price,
    highlight: 'Le plus populaire',
    features: ['Jusqu\'à 5 gestionnaires', '400 lots', 'Votes en ligne & relances'],
    popular: true,
    href: '/facturation?plan=pro',
  },
  {
    key: 'expert',
    name: PLANS_CONFIG.expert.name,
    price: PLANS_CONFIG.expert.price,
    highlight: 'Grands cabinets',
    features: ['Illimité', 'API & portail brandé', 'Support prioritaire'],
    popular: false,
    href: '/facturation?plan=expert',
  },
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

      setCurrentStep(3) // → sélection du plan
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
    focus:outline-none focus:ring-2 focus:ring-[#374151]/20 focus:border-transparent
    placeholder:text-gray-400 transition-shadow`

  return (
    <div className="w-full max-w-lg">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 justify-center">
        <div className="w-9 h-9 bg-[#374151] rounded-xl flex items-center justify-center">
          <Home className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl text-[#374151]">Coplio</span>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  currentStep > step.id
                    ? 'bg-[#374151] text-white'
                    : currentStep === step.id
                    ? 'bg-[#374151] text-white'
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
                  currentStep >= step.id ? 'text-[#374151]' : 'text-muted-foreground'
                }`}
              >
                {step.title}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-16 h-0.5 mb-4 mx-2 transition-colors ${
                  currentStep > step.id ? 'bg-[#374151]' : 'bg-border'
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
                className="w-full bg-[#374151] text-white font-medium py-2.5 px-4 rounded-lg
                           hover:bg-[#374151]/90 transition-colors flex items-center justify-center gap-2 text-sm"
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
                  className="flex-1 bg-[#374151] text-white font-medium py-2.5 px-4 rounded-lg
                             hover:bg-[#374151]/90 transition-colors disabled:opacity-60
                             flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Créer mon cabinet
                </button>
              </div>
            </form>
          </>
        )}

        {/* Étape 3 — Sélection du plan */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-bold text-coplio-text mb-1">Choisissez votre plan</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Vous êtes en essai gratuit 14 jours — vous pouvez aussi décider plus tard.
            </p>

            <div className="space-y-3 mb-6">
              {PLAN_OPTIONS.map((plan) => (
                <a
                  key={plan.key}
                  href={plan.href}
                  className={`block rounded-xl border p-4 transition-all hover:shadow-md ${
                    plan.popular
                      ? 'border-[#374151] bg-slate-50 ring-1 ring-[#374151]/20'
                      : 'border-border hover:border-[#374151]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-coplio-text text-sm">{plan.name}</span>
                      {plan.popular && (
                        <span className="text-[10px] font-bold bg-[#374151] text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Populaire
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-coplio-text">
                      {plan.price}€<span className="text-xs font-normal text-muted-foreground">/mois</span>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{plan.highlight}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {plan.features.map((f) => (
                      <span key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="w-3 h-3 text-[#374151]" />{f}
                      </span>
                    ))}
                  </div>
                </a>
              ))}
            </div>

            <button
              onClick={() => setCurrentStep(4)}
              className="w-full text-sm text-muted-foreground hover:text-coplio-text transition-colors underline-offset-2 hover:underline"
            >
              Continuer avec l&apos;essai gratuit →
            </button>
          </div>
        )}

        {/* Étape 4 — Succès */}
        {currentStep === 4 && (
          <div className="text-center py-2">
            {/* Badge succès animé */}
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 bg-[#374151]/20 rounded-full animate-ping opacity-50" />
              <div className="relative w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                <Check className="w-9 h-9 text-[#374151]" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-coplio-text mb-2">Votre cabinet est prêt ! 🎉</h2>
            <p className="text-muted-foreground text-sm mb-1">
              Essai gratuit de <strong className="text-coplio-text">14 jours</strong> démarré.
            </p>
            <p className="text-xs text-muted-foreground mb-8">
              Aucune carte bancaire requise · Annulation en 1 clic
            </p>

            {/* CTA principal */}
            <a
              href="/coproprietes/new"
              className="flex items-center justify-center gap-2 w-full bg-[#374151] text-white
                         font-semibold py-3 px-4 rounded-xl hover:bg-[#374151]/90 transition-colors
                         text-sm mb-3"
            >
              <Building2 className="w-4 h-4" />
              Créer ma première copropriété
              <ChevronRight className="w-4 h-4" />
            </a>

            {/* Sous-actions */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                { emoji: '👥', label: 'Inviter des copropriétaires', href: '/coproprietaires/new' },
                { emoji: '📄', label: 'Importer des données', href: '/importer' },
              ].map(({ emoji, label, href }) => (
                <a
                  key={href}
                  href={href}
                  className="flex items-center gap-2 text-xs text-coplio-text bg-coplio-bg
                             p-2.5 rounded-lg hover:bg-border transition-colors"
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                </a>
              ))}
            </div>

            {/* Lien secondaire */}
            <button
              onClick={goToDashboard}
              className="text-sm text-muted-foreground hover:text-coplio-text transition-colors underline-offset-2 hover:underline"
            >
              Aller au tableau de bord d&apos;abord →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
