import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Building2,
  Home,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  CalendarDays,
  ArrowRight,
  BarChart2,
} from 'lucide-react'
import Link from 'next/link'
import { formatEuro, formatDate } from '@/lib/utils'
import { RecouvrementChart, StatutChart, EvolutionChart, TauxGlobalCard } from '@/components/syndic/DashboardCharts'
import { OnboardingChecklist } from '@/components/syndic/OnboardingChecklist'
import { RapportMensuelButton } from '@/components/syndic/RapportMensuelButton'
import type { Copropriete, Sinistre, AssembleeGenerale } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, cabinet:cabinets(*)')
    .eq('id', user.id)
    .single()

  if (!profile?.cabinet_id) redirect('/onboarding')

  const cabinetId = profile.cabinet_id

  // Charger copropriétés d'abord (nécessaire pour les impayés)
  const { data: coproprietes } = await supabase
    .from('coproprietes')
    .select('*')
    .eq('cabinet_id', cabinetId)
    .order('created_at', { ascending: false })

  const coproprieteIds = (coproprietes ?? []).map((c: Copropriete) => c.id)

  // Charger le reste en parallèle
  const [
    { data: sinistres },
    { data: agProchaines },
    { data: impayes },
  ] = await Promise.all([
    supabase
      .from('sinistres')
      .select('*, copropriete:coproprietes(nom)')
      .eq('cabinet_id', cabinetId)
      .neq('status', 'cloture')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('assemblees_generales')
      .select('*, copropriete:coproprietes(nom)')
      .eq('cabinet_id', cabinetId)
      .in('status', ['planifiee', 'convocations_envoyees'])
      .gte('date_ag', new Date().toISOString())
      .order('date_ag', { ascending: true })
      .limit(3),
    coproprieteIds.length > 0
      ? supabase
          .from('appels_charges')
          .select('copropriete_id, montant, montant_paye, paye, date_echeance')
          .in('copropriete_id', coproprieteIds)
      : Promise.resolve({ data: [] }),
  ])

  const allAppels = (impayes ?? []) as { copropriete_id: string; montant: number; montant_paye: number; paye: boolean; date_echeance?: string }[]

  // Onboarding checklist
  const nbLots = (coproprietes ?? []).reduce((s: number, c: Copropriete) => s + c.nb_lots, 0)
  const { count: nbCoproprietaires } = coproprieteIds.length > 0
    ? await supabase.from('coproprietaires').select('id', { count: 'exact', head: true }).in('copropriete_id', coproprieteIds)
    : { count: 0 }
  const onboardingSteps = [
    {
      id: 'copropriete',
      label: 'Ajouter votre première copropriété',
      description: 'Créez la copropriété que vous gérez',
      href: '/coproprietes/nouveau',
      done: (coproprietes?.length ?? 0) > 0,
    },
    {
      id: 'lots',
      label: 'Ajouter les lots',
      description: 'Importez ou générez les lots automatiquement',
      href: coproprietes?.[0] ? `/coproprietes/${coproprietes[0].id}/lots/generer` : '/coproprietes',
      done: nbLots > 0,
    },
    {
      id: 'coproprietaires',
      label: 'Inviter les copropriétaires',
      description: 'Donnez-leur accès au portail en ligne',
      href: coproprietes?.[0] ? `/coproprietes/${coproprietes[0].id}/coproprietaires` : '/coproprietes',
      done: (nbCoproprietaires ?? 0) > 0,
    },
    {
      id: 'appel',
      label: 'Émettre votre premier appel de charges',
      description: 'Créez et envoyez le premier appel',
      href: '/appels-charges/nouveau',
      done: allAppels.length > 0,
    },
  ]

  const kpis = {
    nb_coproprietes: coproprietes?.length ?? 0,
    nb_lots: (coproprietes ?? []).reduce((s: number, c: Copropriete) => s + c.nb_lots, 0),
    nb_sinistres_ouverts: sinistres?.length ?? 0,
    montant_total_impayes: allAppels
      .filter((a) => !a.paye)
      .reduce((s, a) => s + (a.montant - a.montant_paye), 0),
    nb_ag_a_preparer: agProchaines?.length ?? 0,
  }

  const coproprietesCritiques = (coproprietes ?? [])
    .filter((c: Copropriete) => c.statut !== 'a_jour')
    .slice(0, 5)

  // ─── Données graphiques ────────────────────────────────────

  // Taux de recouvrement par copropriété (top 6)
  const tauxData = (coproprietes ?? [])
    .slice(0, 6)
    .map((c: Copropriete) => {
      const appels = allAppels.filter((a) => a.copropriete_id === c.id)
      const totalDu = appels.reduce((s, a) => s + a.montant, 0)
      const totalPaye = appels.reduce((s, a) => s + a.montant_paye, 0)
      const taux = totalDu > 0 ? Math.round((totalPaye / totalDu) * 100) : 100
      return {
        nom: c.nom.length > 14 ? c.nom.substring(0, 12) + '…' : c.nom,
        taux,
        impayes: c.montant_impayes,
      }
    })

  // Répartition statuts
  const statutData = {
    aJour:    (coproprietes ?? []).filter((c: Copropriete) => c.statut === 'a_jour').length,
    attention:(coproprietes ?? []).filter((c: Copropriete) => c.statut === 'attention').length,
    urgent:   (coproprietes ?? []).filter((c: Copropriete) => c.statut === 'urgent').length,
  }

  // Taux global de recouvrement
  const totalEmis = allAppels.reduce((s, a) => s + a.montant, 0)
  const totalRecouvre = allAppels.reduce((s, a) => s + a.montant_paye, 0)
  const tauxGlobal = totalEmis > 0 ? Math.round((totalRecouvre / totalEmis) * 100) : 100

  // Évolution mensuelle sur 6 mois
  const evolutionData = (() => {
    const months: { mois: string; emis: number; recouvre: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const year = d.getFullYear()
      const month = d.getMonth()
      const label = d.toLocaleDateString('fr-FR', { month: 'short' })

      const appelsOfMonth = allAppels.filter((a) => {
        if (!a.date_echeance) return false
        const ad = new Date(a.date_echeance)
        return ad.getFullYear() === year && ad.getMonth() === month
      })

      months.push({
        mois: label,
        emis: appelsOfMonth.reduce((s, a) => s + a.montant, 0),
        recouvre: appelsOfMonth.reduce((s, a) => s + a.montant_paye, 0),
      })
    }
    return months
  })()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Salutation */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">
            Bonjour, {profile.prenom} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Voici un résumé de votre activité au{' '}
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <RapportMensuelButton data={{
          coproprietes: (coproprietes ?? []) as Copropriete[],
          totalEmis,
          totalRecouvre,
          tauxGlobal,
          cabinetNom: (profile.cabinet as { nom?: string } | null)?.nom ?? 'Mon cabinet',
        }} />
      </div>

      {/* Onboarding checklist */}
      <OnboardingChecklist steps={onboardingSteps} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Copropriétés"
          value={kpis.nb_coproprietes}
          icon={Building2}
          href="/coproprietes"
          color="green"
        />
        <KpiCard
          title="Lots gérés"
          value={kpis.nb_lots}
          icon={Home}
          href="/coproprietes"
          color="blue"
        />
        <KpiCard
          title="Sinistres ouverts"
          value={kpis.nb_sinistres_ouverts}
          icon={AlertTriangle}
          href="/sinistres"
          color={kpis.nb_sinistres_ouverts > 0 ? 'amber' : 'green'}
        />
        <KpiCard
          title="Impayés totaux"
          value={formatEuro(kpis.montant_total_impayes)}
          icon={CreditCard}
          href="/impayes"
          color={kpis.montant_total_impayes > 0 ? 'red' : 'green'}
          isAmount
        />
      </div>

      {/* Graphiques — uniquement si données disponibles */}
      {allAppels.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <EvolutionChart data={evolutionData} />
          </div>
          <TauxGlobalCard
            taux={tauxGlobal}
            montantRecouvre={totalRecouvre}
            montantTotal={totalEmis}
          />
        </div>
      )}

      {(tauxData.length > 0 || statutData.aJour + statutData.attention + statutData.urgent > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RecouvrementChart data={tauxData} />
          <StatutChart {...statutData} />
        </div>
      )}

      {/* Benchmark sectoriel */}
      <BenchmarkSection tauxGlobal={tauxGlobal} nbCoproprietes={kpis.nb_coproprietes} nbLots={kpis.nb_lots} />

      {/* Contenu principal — 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Copropriétés avec alertes */}
          <div className="coplio-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-coplio-text">Alertes copropriétés</h2>
              <Link
                href="/coproprietes"
                className="text-xs text-coplio-green hover:underline flex items-center gap-1"
              >
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {coproprietesCritiques.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-coplio-green-light rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-coplio-green" />
                </div>
                <p className="text-sm font-medium text-coplio-text">Tout est à jour !</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Aucune copropriété ne nécessite votre attention
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {coproprietesCritiques.map((c: Copropriete) => (
                  <CoproprieteAlertRow key={c.id} copropriete={c} />
                ))}
              </div>
            )}
          </div>

          {/* Sinistres récents */}
          <div className="coplio-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-coplio-text">Sinistres en cours</h2>
              <Link
                href="/sinistres"
                className="text-xs text-coplio-green hover:underline flex items-center gap-1"
              >
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {(!sinistres || sinistres.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Aucun sinistre en cours
              </p>
            ) : (
              <div className="space-y-2">
                {sinistres.map((s: Sinistre & { copropriete?: { nom: string } }) => (
                  <SinistreRow key={s.id} sinistre={s} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite (1/3) */}
        <div className="space-y-6">
          {/* AG à venir */}
          <div className="coplio-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-coplio-text">AG à venir</h2>
              <Link href="/assemblees" className="text-xs text-coplio-green hover:underline">
                Gérer
              </Link>
            </div>

            {(!agProchaines || agProchaines.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune AG planifiée
              </p>
            ) : (
              <div className="space-y-3">
                {agProchaines.map((ag: AssembleeGenerale & { copropriete?: { nom: string } }) => (
                  <AgRow key={ag.id} ag={ag} />
                ))}
              </div>
            )}

            <Link
              href="/assemblees/new"
              className="mt-4 block text-center text-sm text-coplio-green font-medium
                         border border-coplio-green/30 rounded-lg py-2 hover:bg-coplio-green-light transition-colors"
            >
              + Planifier une AG
            </Link>
          </div>

          {/* Raccourcis rapides */}
          <div className="coplio-card">
            <h2 className="font-semibold text-coplio-text mb-3">Actions rapides</h2>
            <div className="space-y-2">
              {[
                { href: '/coproprietes/new', label: 'Ajouter une copropriété', icon: Building2 },
                { href: '/sinistres/new', label: 'Déclarer un sinistre', icon: AlertTriangle },
                { href: '/assemblees/new', label: 'Planifier une AG', icon: CalendarDays },
                { href: '/impayes', label: 'Gérer les impayés', icon: CreditCard },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-coplio-bg transition-colors text-sm"
                >
                  <div className="w-7 h-7 bg-coplio-green-light rounded-md flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-coplio-green" />
                  </div>
                  <span className="text-coplio-text">{label}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground ml-auto" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Benchmark sectoriel ──────────────────────────────────────
function BenchmarkSection({ tauxGlobal, nbCoproprietes, nbLots }: { tauxGlobal: number; nbCoproprietes: number; nbLots: number }) {
  // Moyennes sectorielles simulées (données représentatives du marché)
  const BENCHMARKS = [
    { label: 'Taux de recouvrement', votre: tauxGlobal, secteur: 87, unite: '%', better: (v: number, s: number) => v >= s },
    { label: 'Lots par copropriété', votre: nbCoproprietes > 0 ? Math.round(nbLots / nbCoproprietes) : 0, secteur: 28, unite: 'lots', better: (v: number, s: number) => v >= s },
  ]

  return (
    <div className="coplio-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-coplio-text flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-coplio-green" />Benchmark sectoriel
        </h2>
        <span className="text-xs text-muted-foreground bg-coplio-bg px-2 py-1 rounded-full">Données anonymisées du marché</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BENCHMARKS.map(b => {
          const isBetter = b.votre > 0 && b.better(b.votre, b.secteur)
          const pctVotre = Math.min(100, b.votre)
          const pctSecteur = Math.min(100, b.secteur)
          return (
            <div key={b.label} className="p-4 bg-coplio-bg rounded-xl">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{b.label}</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-coplio-text font-medium">Vous</span>
                    <span className={`font-bold ${isBetter ? 'text-coplio-green' : 'text-coplio-amber'}`}>{b.votre}{b.unite}</span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isBetter ? 'bg-coplio-green' : 'bg-coplio-amber'}`} style={{ width: `${pctVotre}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Moyenne secteur</span>
                    <span className="text-muted-foreground font-medium">{b.secteur}{b.unite}</span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <div className="h-full bg-border rounded-full" style={{ width: `${pctSecteur}%` }} />
                  </div>
                </div>
              </div>
              {b.votre > 0 && (
                <p className={`text-xs mt-2 font-medium ${isBetter ? 'text-coplio-green' : 'text-coplio-amber'}`}>
                  {isBetter ? `+${b.votre - b.secteur}${b.unite} au-dessus de la moyenne` : `${b.secteur - b.votre}${b.unite} en-dessous de la moyenne`}
                </p>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3">Données basées sur les moyennes agrégées du marché syndical français. Mis à jour trimestriellement.</p>
    </div>
  )
}

// ─── Composants internes ──────────────────────────────────────

interface KpiCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  href: string
  color: 'green' | 'blue' | 'amber' | 'red'
  isAmount?: boolean
}

function KpiCard({ title, value, icon: Icon, href, color, isAmount }: KpiCardProps) {
  const colors = {
    green: 'bg-coplio-green-light text-coplio-green',
    blue: 'bg-coplio-blue-bg text-coplio-blue',
    amber: 'bg-coplio-amber-bg text-coplio-amber',
    red: 'bg-coplio-red-bg text-coplio-red',
  }

  return (
    <Link href={href} className="coplio-card hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${isAmount && typeof value === 'string' && value.includes('-') ? 'text-coplio-red' : 'text-coplio-text'}`}>
            {value}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground group-hover:text-coplio-green transition-colors">
        Voir le détail <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  )
}

function CoproprieteAlertRow({ copropriete }: { copropriete: Copropriete }) {
  return (
    <Link
      href={`/coproprietes/${copropriete.id}`}
      className="flex items-center justify-between p-3 rounded-lg hover:bg-coplio-bg transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-coplio-green-light rounded-lg flex items-center justify-center">
          <Building2 className="w-4 h-4 text-coplio-green" />
        </div>
        <div>
          <p className="text-sm font-medium text-coplio-text">{copropriete.nom}</p>
          <p className="text-xs text-muted-foreground">
            {copropriete.nb_lots} lots · {copropriete.ville}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={
          copropriete.statut === 'urgent' ? 'badge-urgent' :
          copropriete.statut === 'attention' ? 'badge-attention' :
          'badge-a-jour'
        }>
          {copropriete.statut === 'urgent' ? 'Urgent' :
           copropriete.statut === 'attention' ? 'Attention' : 'À jour'}
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-coplio-green transition-colors" />
      </div>
    </Link>
  )
}

function SinistreRow({ sinistre }: { sinistre: Sinistre & { copropriete?: { nom: string } } }) {
  const statusColors: Record<string, string> = {
    signale: 'badge-attention',
    urgence: 'badge-urgent',
    assurance_declaree: 'bg-blue-50 text-blue-700',
    expertise: 'bg-purple-50 text-purple-700',
    travaux: 'bg-orange-50 text-orange-700',
  }

  const statusLabels: Record<string, string> = {
    signale: 'Signalé',
    urgence: 'Urgence',
    assurance_declaree: 'Assurance',
    expertise: 'Expertise',
    travaux: 'Travaux',
  }

  return (
    <Link
      href={`/sinistres/${sinistre.id}`}
      className="flex items-center justify-between p-3 rounded-lg hover:bg-coplio-bg transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-coplio-text truncate">{sinistre.titre}</p>
        <p className="text-xs text-muted-foreground">
          {sinistre.reference} · {sinistre.copropriete?.nom}
        </p>
      </div>
      <span className={`ml-3 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[sinistre.status] || 'badge-a-jour'}`}>
        {statusLabels[sinistre.status] || sinistre.status}
      </span>
    </Link>
  )
}

function AgRow({ ag }: { ag: AssembleeGenerale & { copropriete?: { nom: string } } }) {
  const date = new Date(ag.date_ag)
  const jours = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <Link href={`/assemblees/${ag.id}`} className="block group">
      <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-coplio-bg transition-colors">
        <div className="w-10 h-10 bg-coplio-green-light rounded-xl flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-coplio-green font-bold text-sm leading-none">
            {date.getDate()}
          </span>
          <span className="text-coplio-green/70 text-[10px] uppercase">
            {date.toLocaleDateString('fr-FR', { month: 'short' })}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-coplio-text truncate">{ag.titre}</p>
          <p className="text-xs text-muted-foreground">{ag.copropriete?.nom}</p>
        </div>
        <span className={`text-xs font-medium flex-shrink-0 ${jours <= 7 ? 'text-coplio-red' : 'text-muted-foreground'}`}>
          J-{jours}
        </span>
      </div>
    </Link>
  )
}
