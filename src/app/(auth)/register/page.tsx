import { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { Home, Check } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Démarrer l\'essai gratuit',
}

const FEATURES = [
  'Essai 14 jours gratuit, sans CB',
  'Portail copropriétaire inclus',
  'Toutes les fonctionnalités Pro',
  'Annulation à tout moment',
]

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-coplio-bg flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-6 sm:mb-8 justify-center w-fit mx-auto">
          <div className="w-9 h-9 bg-coplio-green rounded-xl flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-coplio-green">Coplio</span>
        </Link>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-coplio-text">
              Commencer gratuitement
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              14 jours d&apos;essai gratuit — aucune carte requise
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-6">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-coplio-text">
                <Check className="w-4 h-4 text-coplio-green flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>

          <RegisterForm />

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-coplio-green font-medium hover:underline">
              Se connecter
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            En créant un compte, vous acceptez nos{' '}
            <a href="/cgu" className="hover:underline">CGU</a>,{' '}
            notre <a href="/confidentialite" className="hover:underline">politique de confidentialité</a>{' '}
            et nos <a href="/mentions-legales" className="hover:underline">mentions légales</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
