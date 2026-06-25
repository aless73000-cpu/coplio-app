import Link from 'next/link'
import { Users, ChevronRight, BellRing, FileUp, Wrench, BookOpen } from 'lucide-react'

export function ShortcutsSection() {
  return (
    <>
      {/* Équipe */}
      <Link href="/equipe" className="coplio-card flex items-center justify-between hover:border-[#374151]/40 transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
            <Users className="w-4 h-4 text-[#374151]" />
          </div>
          <div>
            <h2 className="font-semibold text-coplio-text">Mon équipe</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Inviter et gérer vos gestionnaires</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#374151] transition-colors" />
      </Link>

      {/* Outils */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/relances-config" className="coplio-card flex items-center justify-between hover:border-[#374151]/40 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
              <BellRing className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-coplio-text text-sm">Relances auto</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Impayés & rappels</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#374151] transition-colors" />
        </Link>

        <Link href="/importer" className="coplio-card flex items-center justify-between hover:border-[#374151]/40 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <FileUp className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-coplio-text text-sm">Import Excel</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Lots & copropriétaires en un fichier</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#374151] transition-colors" />
        </Link>

        <Link href="/prestataires" className="coplio-card flex items-center justify-between hover:border-[#374151]/40 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
              <Wrench className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold text-coplio-text text-sm">Prestataires</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Gérer vos intervenants</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#374151] transition-colors" />
        </Link>

        <Link href="/carnet-entretien" className="coplio-card flex items-center justify-between hover:border-[#374151]/40 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-coplio-text text-sm">Carnet d&apos;entretien</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Suivi des interventions</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#374151] transition-colors" />
        </Link>
      </div>
    </>
  )
}
