import Link from 'next/link'
import { LayoutDashboard, SlidersHorizontal } from 'lucide-react'

export function DashboardPrefsSection({ userId: _userId }: { userId: string }) {
  return (
    <section className="coplio-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
          <LayoutDashboard className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h2 className="font-semibold text-coplio-text">Mon Tableau de bord</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Réorganisez et masquez les blocs de votre dashboard
          </p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        Cliquez ci-dessous pour ouvrir votre tableau de bord en mode édition. Vous verrez vos blocs en situation réelle et pourrez les glisser pour les réorganiser.
      </p>
      <Link
        href="/dashboard?edit=true"
        className="inline-flex items-center gap-2 bg-[#374151] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#4B5563] transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Personnaliser mon tableau de bord
      </Link>
    </section>
  )
}
