import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  FileText,
  Scale,
  ArrowRightLeft,
  TrendingUp,
  Download,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Receipt,
  BookMarked,
  CalendarDays,
} from 'lucide-react'
import { formatEuro } from '@/lib/utils'

export default async function ComptabilitePage({
  searchParams,
}: {
  searchParams: { copropriete?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) redirect('/onboarding')

  const { data: coprops } = await supabase
    .from('coproprietes')
    .select('id, nom')
    .eq('cabinet_id', profile.cabinet_id)
    .order('nom')

  const coproprieteIds = (coprops ?? []).map((c) => c.id)
  const selectedId = searchParams.copropriete ?? coproprieteIds[0] ?? null

  // Statistiques comptables
  const { data: ecrituresStats } = selectedId ? await supabase
    .from('ecritures_comptables')
    .select('statut', { count: 'exact' })
    .eq('copropriete_id', selectedId) : { data: null }

  const { data: brouillons, count: nbBrouillons } = selectedId ? await supabase
    .from('ecritures_comptables')
    .select('id', { count: 'exact' })
    .eq('copropriete_id', selectedId)
    .eq('statut', 'brouillon') : { data: null, count: 0 }

  // Exercice en cours
  const { data: exerciceEnCours } = selectedId ? await supabase
    .from('exercices')
    .select('id, annee, statut')
    .eq('copropriete_id', selectedId)
    .eq('statut', 'en_cours')
    .order('annee', { ascending: false })
    .limit(1)
    .single() : { data: null }

  const modules = [
    {
      href: `/comptabilite/ecritures${selectedId ? `?copropriete=${selectedId}` : ''}`,
      icon: ArrowRightLeft,
      label: 'Saisie des écritures',
      description: 'Journaux achats, banque, OD',
      badge: nbBrouillons ? `${nbBrouillons} brouillon${nbBrouillons > 1 ? 's' : ''}` : null,
      badgeColor: 'bg-amber-50 text-amber-700',
    },
    {
      href: `/comptabilite/plan-comptable${selectedId ? `?copropriete=${selectedId}` : ''}`,
      icon: BookOpen,
      label: 'Plan comptable',
      description: 'Comptes syndic — Arrêté 14 mars 2005',
      badge: null,
      badgeColor: '',
    },
    {
      href: `/comptabilite/grand-livre${selectedId ? `?copropriete=${selectedId}` : ''}`,
      icon: FileText,
      label: 'Grand livre',
      description: 'Historique de toutes les écritures par compte',
      badge: null,
      badgeColor: '',
    },
    {
      href: `/comptabilite/balance${selectedId ? `?copropriete=${selectedId}` : ''}`,
      icon: Scale,
      label: 'Balance des comptes',
      description: 'Soldes débit/crédit par compte',
      badge: null,
      badgeColor: '',
    },
    {
      href: `/comptabilite/factures${selectedId ? `?copropriete=${selectedId}` : ''}`,
      icon: Receipt,
      label: 'Factures fournisseurs',
      description: 'Cycle devis → facture → paiement',
      badge: null,
      badgeColor: '',
    },
    {
      href: `/comptabilite/rapprochement${selectedId ? `?copropriete=${selectedId}` : ''}`,
      icon: TrendingUp,
      label: 'Rapprochement bancaire',
      description: 'Import relevé et lettrage des écritures',
      badge: null,
      badgeColor: '',
    },
    {
      href: `/comptabilite/export${selectedId ? `?copropriete=${selectedId}` : ''}`,
      icon: Download,
      label: 'Export FEC & CSV',
      description: 'FEC DGFiP, balance, annexes comptables',
      badge: null,
      badgeColor: '',
    },
    {
      href: `/comptabilite/journaux${selectedId ? `?copropriete=${selectedId}` : ''}`,
      icon: BookMarked,
      label: 'Journaux',
      description: 'Achats, Banque, OD — configuration',
      badge: null,
      badgeColor: '',
    },
    {
      href: `/comptabilite/exercices${selectedId ? `?copropriete=${selectedId}` : ''}`,
      icon: CalendarDays,
      label: 'Exercices',
      description: 'Créer et clôturer les exercices comptables',
      badge: null,
      badgeColor: '',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-coplio-text">Comptabilité</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Plan comptable syndic conforme à l&apos;arrêté du 14 mars 2005
          </p>
        </div>
      </div>

      {/* Sélecteur de copropriété */}
      {coprops && coprops.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {coprops.map((c) => (
            <Link
              key={c.id}
              href={`/comptabilite?copropriete=${c.id}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                selectedId === c.id
                  ? 'bg-[#374151] text-white border-[#374151]'
                  : 'bg-white text-coplio-text border-border hover:border-[#374151]/30'
              }`}
            >
              {c.nom}
            </Link>
          ))}
        </div>
      )}

      {/* Alerte brouillons */}
      {(nbBrouillons ?? 0) > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{nbBrouillons} écriture{(nbBrouillons ?? 0) > 1 ? 's' : ''} en brouillon</span>
            {' '}— pensez à les valider avant la clôture de l&apos;exercice.
          </p>
          <Link
            href={`/comptabilite/ecritures?copropriete=${selectedId}&statut=brouillon`}
            className="ml-auto text-sm font-medium text-amber-700 hover:text-amber-900 flex-shrink-0"
          >
            Voir →
          </Link>
        </div>
      )}

      {/* Exercice en cours */}
      {exerciceEnCours && (
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-[#374151] flex-shrink-0" />
          <p className="text-sm text-coplio-text">
            Exercice en cours : <span className="font-semibold">{exerciceEnCours.annee}</span>
          </p>
        </div>
      )}

      {/* Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {modules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="coplio-card flex items-center gap-4 hover:border-slate-200 hover:shadow-md transition-all group"
          >
            <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#374151] transition-colors">
              <mod.icon className="w-5 h-5 text-[#374151] group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-coplio-text text-sm">{mod.label}</p>
                {mod.badge && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${mod.badgeColor}`}>
                    {mod.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#374151] flex-shrink-0 transition-colors" />
          </Link>
        ))}
      </div>

      {!selectedId && (
        <div className="coplio-card text-center py-12">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text">Aucune copropriété</p>
          <p className="text-sm text-muted-foreground mt-1">
            Créez d&apos;abord une copropriété pour accéder à la comptabilité.
          </p>
        </div>
      )}
    </div>
  )
}
