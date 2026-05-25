import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-coplio-bg flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-10 h-10 bg-[#111827] rounded-xl flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-coplio-text">Coplio</span>
        </div>

        {/* Illustration */}
        <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <span className="text-5xl">🔍</span>
        </div>

        <h1 className="text-7xl font-bold text-[#111827] mb-3">404</h1>
        <h2 className="text-xl font-semibold text-coplio-text mb-3">Page introuvable</h2>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          Cette page n&apos;existe pas ou a été déplacée.
          Vérifiez l&apos;URL ou retournez au tableau de bord.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#111827] text-white font-medium rounded-xl hover:bg-[#111827]/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            Tableau de bord
          </Link>
          <Link
            href="javascript:history.back()"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-border text-coplio-text font-medium rounded-xl hover:bg-coplio-bg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Page précédente
          </Link>
        </div>
      </div>
    </div>
  )
}
