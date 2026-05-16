import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'
import { Home, FileText, CreditCard, Wrench, MessageCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Espace copropriétaire — Coplio',
}

const FEATURES = [
  { icon: CreditCard, label: 'Mes charges & appels de fonds' },
  { icon: FileText, label: 'Mes documents (PV, règlement…)' },
  { icon: Wrench, label: 'Suivi des travaux & sinistres' },
  { icon: MessageCircle, label: 'Messagerie avec mon syndic' },
]

export default function PortailLoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string }
}) {
  return (
    <div className="min-h-screen bg-coplio-bg flex flex-col items-center justify-center px-5 py-10">
      {/* Card principale */}
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 mb-6 w-fit">
          <div className="w-8 h-8 bg-coplio-green rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-coplio-green">Coplio</span>
        </Link>

        {/* Header vert */}
        <div className="bg-coplio-green rounded-2xl px-6 pt-8 pb-6 mb-4 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Home className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold">Votre espace copropriétaire</h1>
            <p className="text-white/70 text-sm mt-1">Connectez-vous avec les identifiants reçus par email</p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl border border-border px-6 py-6 mb-4">
          {searchParams.error && (
            <div className="mb-4 p-3 bg-coplio-red-bg border border-coplio-red/20 rounded-xl">
              <p className="text-coplio-red text-sm">{searchParams.error}</p>
            </div>
          )}
          {searchParams.message && (
            <div className="mb-4 p-3 bg-coplio-green-light border border-coplio-green/20 rounded-xl">
              <p className="text-coplio-green text-sm">{searchParams.message}</p>
            </div>
          )}

          <LoginForm redirectTo="/accueil" />

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Premier accès ? Vérifiez vos emails —{' '}
            <span className="font-medium">votre syndic vous a envoyé un lien d&apos;invitation.</span>
          </p>
        </div>

        {/* Ce que vous pouvez faire */}
        <div className="bg-white rounded-2xl border border-border px-5 py-5 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Votre portail vous permet de
          </p>
          <ul className="space-y-2.5">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-coplio-green-light rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-coplio-green" />
                </div>
                <span className="text-sm text-coplio-text">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Lien syndic */}
        <p className="text-center text-xs text-muted-foreground">
          Vous êtes syndic ?{' '}
          <Link href="/login" className="text-coplio-green font-medium hover:underline">
            Accéder à l&apos;espace gestionnaire
          </Link>
        </p>
      </div>
    </div>
  )
}
