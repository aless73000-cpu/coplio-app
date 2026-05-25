import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'
import { Home, CheckCircle2 } from 'lucide-react'
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
    <div className="min-h-screen bg-[#F5F5F7] flex">

      {/* ── Panneau gauche — branding ─────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[44%] flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0C5E47 0%, #084D3A 100%)' }}
      >
        {/* Orbs décoratifs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,.06) 0%, transparent 60%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(60,196,154,.12) 0%, transparent 65%)', transform: 'translate(-30%, 30%)' }} />
        {/* Grille subtile */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 w-fit group">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-apple-sm group-hover:scale-105 transition-transform">
              <Home className="w-5 h-5 text-coplio-green" />
            </div>
            <span className="text-white font-semibold text-xl" style={{ letterSpacing: '-0.025em' }}>
              Coplio
            </span>
          </Link>
        </div>

        {/* Contenu central */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-white text-[2rem] font-bold leading-[1.15] mb-4" style={{ letterSpacing: '-0.03em' }}>
              La gestion de copropriété,{' '}
              <span style={{ color: '#3CC49A' }}>nouvelle génération</span>
            </h2>
            <p className="text-white/60 text-base leading-relaxed max-w-sm">
              Conçu pour les syndics indépendants qui veulent gagner du temps et offrir une expérience moderne à leurs copropriétaires.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '500+', label: 'Syndics actifs' },
              { value: '12 000', label: 'Lots gérés' },
              { value: '4.9/5', label: 'Satisfaction' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/[0.08] border border-white/10 rounded-2xl p-4 text-center backdrop-blur-sm">
                <p className="text-white font-bold text-lg" style={{ letterSpacing: '-0.02em' }}>{value}</p>
                <p className="text-white/45 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Témoignage */}
          <div className="bg-white/[0.07] border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <p className="text-white/80 text-sm leading-relaxed italic">
              &ldquo;Coplio a transformé mon cabinet. Je gagne 2 heures par semaine sur les relances
              et mes copropriétaires adorent le portail mobile.&rdquo;
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">MS</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Marie S.</p>
                <p className="text-white/45 text-xs">Syndic indépendant, Lyon</p>
              </div>
            </div>
          </div>

          {/* Garanties */}
          <div className="space-y-2">
            {['Données hébergées en Europe · RGPD', 'Support réactif sous 24h', 'Sans engagement'].map((t) => (
              <div key={t} className="flex items-center gap-2.5 text-white/50 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#3CC49A] flex-shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/25 text-xs">
          © {new Date().getFullYear()} Coplio. Tous droits réservés.
        </p>
      </div>

      {/* ── Panneau droit — formulaire ────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[400px]">

          {/* Logo mobile */}
          <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-10 w-fit">
            <div className="w-9 h-9 bg-coplio-green rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-xl text-coplio-green" style={{ letterSpacing: '-0.025em' }}>Coplio</span>
          </Link>

          {/* Titre */}
          <div className="mb-8">
            <h1 className="text-[1.75rem] font-bold text-[#1D1D1F]" style={{ letterSpacing: '-0.03em' }}>
              Bon retour 👋
            </h1>
            <p className="text-[#6E6E73] mt-1.5 text-sm">
              Connectez-vous à votre espace syndic
            </p>
          </div>

          {/* Alertes URL params */}
          {searchParams.error && (
            <div className="mb-5 p-3.5 bg-coplio-red-bg border border-coplio-red/20 rounded-xl">
              <p className="text-coplio-red text-sm">{searchParams.error}</p>
            </div>
          )}
          {searchParams.message && (
            <div className="mb-5 p-3.5 bg-coplio-green-light border border-coplio-green/20 rounded-xl">
              <p className="text-coplio-green text-sm">{searchParams.message}</p>
            </div>
          )}

          <LoginForm redirectTo={searchParams.redirectTo} />

          <div className="mt-8 pt-6 border-t border-[#E8E8ED] space-y-3 text-center">
            <p className="text-sm text-[#6E6E73]">
              Pas encore de compte ?{' '}
              <Link href="/register" className="text-coplio-green font-medium hover:underline">
                Démarrer l&apos;essai gratuit 14 jours
              </Link>
            </p>
            <p className="text-xs text-[#AEAEB2]">
              Vous êtes copropriétaire ?{' '}
              <Link href="/portail" className="text-coplio-green hover:underline">
                Accéder au portail
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
