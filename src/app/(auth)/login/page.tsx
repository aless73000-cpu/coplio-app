import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'
import { Home } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Connexion',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string; error?: string; message?: string }
}) {
  return (
    <div className="min-h-screen bg-coplio-bg flex">
      {/* Panneau gauche — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-coplio-green flex-col justify-between p-12 relative overflow-hidden">
        {/* Cercles décoratifs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-coplio-green" />
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">Coplio</span>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-white text-3xl font-bold leading-tight mb-4">
            La gestion de copropriété
            <br />
            <span className="text-coplio-green-medium">nouvelle génération</span>
          </h2>
          <p className="text-white/70 text-lg">
            Conçu pour les syndics indépendants qui veulent gagner du temps et
            offrir une expérience moderne à leurs copropriétaires.
          </p>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { value: '500+', label: 'Syndics actifs' },
              { value: '12 000', label: 'Lots gérés' },
              { value: '4.9/5', label: 'Satisfaction' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-white font-bold text-xl">{value}</p>
                <p className="text-white/60 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Témoignage */}
          <blockquote className="mt-8 bg-white/10 rounded-xl p-5 border border-white/20">
            <p className="text-white/90 text-sm italic">
              &ldquo;Coplio a transformé mon cabinet. Je gagne 2 heures par semaine sur les relances
              et mes copropriétaires adorent le portail mobile.&rdquo;
            </p>
            <footer className="mt-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-xs font-bold">MS</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Marie S.</p>
                <p className="text-white/60 text-xs">Syndic indépendant, Lyon</p>
              </div>
            </footer>
          </blockquote>
        </div>

        <p className="relative z-10 text-white/40 text-xs">
          © 2024 Coplio. Tous droits réservés.
        </p>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo mobile uniquement */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-coplio-green rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-coplio-green">Coplio</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-coplio-text">Bon retour 👋</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Connectez-vous à votre espace syndic
            </p>
          </div>

          {/* Alertes */}
          {searchParams.error && (
            <div className="mb-4 p-3 bg-coplio-red-bg border border-coplio-red/20 rounded-lg">
              <p className="text-coplio-red text-sm">{searchParams.error}</p>
            </div>
          )}
          {searchParams.message && (
            <div className="mb-4 p-3 bg-coplio-green-light border border-coplio-green/20 rounded-lg">
              <p className="text-coplio-green text-sm">{searchParams.message}</p>
            </div>
          )}

          <LoginForm redirectTo={searchParams.redirectTo} />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Pas encore de compte ?{' '}
            <Link
              href="/register"
              className="text-coplio-green font-medium hover:underline"
            >
              Démarrer l&apos;essai gratuit 14 jours
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Vous êtes copropriétaire ?{' '}
            <a
              href={process.env.NEXT_PUBLIC_PORTAIL_URL ?? '/portail'}
              className="text-coplio-green hover:underline"
            >
              Accéder au portail
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
