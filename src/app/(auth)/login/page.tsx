import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Connexion' }

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string; error?: string; message?: string }
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-10 group">
        <div className="w-9 h-9 bg-[#374151] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
          <span className="text-white text-sm font-bold">C</span>
        </div>
        <span className="font-bold text-xl text-[#374151]" style={{ letterSpacing: '-0.02em' }}>Coplio</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-[420px] bg-white rounded-3xl border border-slate-100 p-8"
        style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 20px 60px rgba(0,0,0,0.07)' }}>

        <div className="mb-7">
          <h1 className="text-2xl font-bold text-[#374151]" style={{ letterSpacing: '-0.03em' }}>
            Bon retour 👋
          </h1>
          <p className="text-slate-400 mt-1.5 text-sm">Connectez-vous à votre espace syndic</p>
        </div>

        {searchParams.error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-red-600 text-sm">{searchParams.error}</p>
          </div>
        )}
        {searchParams.message && (
          <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-slate-600 text-sm">{searchParams.message}</p>
          </div>
        )}

        <LoginForm redirectTo={searchParams.redirectTo} />
      </div>

      <div className="mt-6 space-y-2 text-center">
        <p className="text-sm text-slate-400">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-[#374151] font-semibold hover:underline">
            Essai gratuit 14 jours
          </Link>
        </p>
        <p className="text-xs text-slate-300">
          Copropriétaire ?{' '}
          <Link href="/portail" className="text-[#374151] hover:underline">Accéder au portail</Link>
        </p>
      </div>

    </div>
  )
}
