import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardCanvas } from '@/components/dashboard/DashboardCanvas'
import type { DashboardData } from '@/components/dashboard/DashboardCanvas'
import type { Copropriete } from '@/types'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { edit?: string }
}) {
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
  const cabinet = profile.cabinet as { nom?: string; trial_ends_at?: string | null; plan?: string | null } | null

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  // ── Phase 1 : copropriétés + requêtes indépendantes en parallèle ─────────
  // sinistres, agProchaines, nbCoproprietaires, nbPortailActif, agRecentes
  // n'ont pas besoin de coproprieteIds (filtrent sur cabinet_id).
  const [
    { data: coproprietes },
    { data: sinistres },
    { data: agProchaines },
    { count: nbCoproprietairesTotal },
    { count: nbPortailActif },
    { data: agRecentes },
  ] = await Promise.all([
    supabase
      .from('coproprietes')
      .select('*')
      .eq('cabinet_id', cabinetId)
      .order('created_at', { ascending: false }),
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
    supabase
      .from('coproprietaires')
      .select('id', { count: 'exact', head: true })
      .eq('cabinet_id', cabinetId),
    supabase
      .from('coproprietaires')
      .select('id', { count: 'exact', head: true })
      .eq('cabinet_id', cabinetId)
      .eq('portail_actif', true),
    supabase
      .from('assemblees_generales')
      .select('copropriete_id, date_ag, status')
      .eq('cabinet_id', cabinetId)
      .eq('status', 'terminee')
      .gte('date_ag', oneYearAgo.toISOString()),
  ])

  const coproprieteIds = (coproprietes ?? []).map((c) => c.id)

  // ── Phase 2 : requêtes dépendantes de coproprieteIds ────────────────────
  const [
    { data: impayes },
    { count: nbLotsOccupes },
    { data: fondsTravaux },
  ] = await Promise.all([
    coproprieteIds.length > 0
      ? supabase
          .from('appels_charges')
          .select('copropriete_id, montant, montant_paye, paye, date_echeance')
          .in('copropriete_id', coproprieteIds)
      : Promise.resolve({ data: [] }),
    coproprieteIds.length > 0
      ? supabase
          .from('lots')
          .select('id', { count: 'exact', head: true })
          .in('copropriete_id', coproprieteIds)
          .not('coproprietaire_id', 'is', null)
      : Promise.resolve({ count: 0 }),
    coproprieteIds.length > 0
      ? supabase
          .from('fonds_travaux')
          .select('copropriete_id, annee')
          .in('copropriete_id', coproprieteIds)
          .order('annee', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  const allAppels = (impayes ?? []) as {
    copropriete_id: string
    montant: number
    montant_paye: number
    paye: boolean
    date_echeance?: string
  }[]

  // ─── KPIs ──────────────────────────────────────────────────
  const nbLots = (coproprietes ?? []).reduce((s: number, c) => s + (c.nb_lots ?? 0), 0)

  const kpis = {
    nb_coproprietes: coproprietes?.length ?? 0,
    nb_lots: nbLots,
    nb_sinistres_ouverts: sinistres?.length ?? 0,
    montant_total_impayes: allAppels
      .filter((a) => !a.paye)
      .reduce((s, a) => s + (a.montant - a.montant_paye), 0),
    nb_ag_a_preparer: agProchaines?.length ?? 0,
    nb_coproprietaires: nbCoproprietairesTotal ?? 0,
    nb_portail_actif: nbPortailActif ?? 0,
  }

  // ─── Onboarding ────────────────────────────────────────────
  const onboardingSteps = [
    {
      id: 'copropriete',
      label: 'Ajouter votre première copropriété',
      description: 'Créez la copropriété que vous gérez',
      href: '/coproprietes/new',
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
      href: '/coproprietaires',
      done: (nbCoproprietairesTotal ?? 0) > 0,
    },
    {
      id: 'appel',
      label: 'Émettre votre premier appel de charges',
      description: 'Créez et envoyez le premier appel',
      href: '/appels-charges/new',
      done: allAppels.length > 0,
    },
  ]

  // ─── Alertes intelligentes ─────────────────────────────────
  type SmartAlert = { id: string; severity: 'warning' | 'info'; message: string; href: string; cta: string }
  const smartAlerts: SmartAlert[] = []

  const agRecentesCoproIds = new Set((agRecentes ?? []).map((a: { copropriete_id: string }) => a.copropriete_id))
  const coprosSansAg = (coproprietes ?? []).filter((c) => !agRecentesCoproIds.has(c.id))
  if (coprosSansAg.length > 0) {
    smartAlerts.push({
      id: 'ag-overdue',
      severity: 'warning',
      message: `${coprosSansAg.length} copropriété${coprosSansAg.length > 1 ? 's' : ''} sans AG tenue depuis plus de 12 mois`,
      href: '/assemblees/new',
      cta: 'Planifier une AG',
    })
  }

  const lotsVacants = kpis.nb_lots - (nbLotsOccupes ?? 0)
  if (lotsVacants > 0 && kpis.nb_lots > 0) {
    smartAlerts.push({
      id: 'lots-vacants',
      severity: 'info',
      message: `${lotsVacants} lot${lotsVacants > 1 ? 's' : ''} sans copropriétaire affecté`,
      href: '/coproprietaires',
      cta: 'Gérer les copropriétaires',
    })
  }

  const totalCopros = nbCoproprietairesTotal ?? 0
  const nbPortail = nbPortailActif ?? 0
  if (totalCopros > 0 && nbPortail / totalCopros < 0.5) {
    smartAlerts.push({
      id: 'portail-adoption',
      severity: 'info',
      message: `Seulement ${Math.round((nbPortail / totalCopros) * 100)}% des copropriétaires ont activé leur portail`,
      href: '/coproprietaires',
      cta: 'Envoyer les invitations',
    })
  }

  // Impayés depuis plus de 60 jours
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
  const impayes60 = allAppels.filter(
    (a) => !a.paye && a.date_echeance && new Date(a.date_echeance) < sixtyDaysAgo
  )
  if (impayes60.length > 0) {
    const montant60 = impayes60.reduce((s, a) => s + (a.montant - a.montant_paye), 0)
    const m = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(montant60)
    smartAlerts.push({
      id: 'impayes-60j',
      severity: 'warning',
      message: `${impayes60.length} impayé${impayes60.length > 1 ? 's' : ''} en retard depuis plus de 60 jours (${m})`,
      href: '/impayes',
      cta: 'Lancer des relances',
    })
  }

  // AG prochaine dans moins de 15 jours
  const in15Days = new Date()
  in15Days.setDate(in15Days.getDate() + 15)
  const agUrgentes = (agProchaines ?? []).filter(
    (ag: { date_ag: string }) => new Date(ag.date_ag) <= in15Days
  )
  if (agUrgentes.length > 0) {
    smartAlerts.push({
      id: 'ag-urgente',
      severity: 'warning',
      message: `${agUrgentes.length} AG ${agUrgentes.length > 1 ? 'ont lieu' : 'a lieu'} dans moins de 15 jours`,
      href: '/assemblees',
      cta: 'Préparer',
    })
  }

  // Sinistres ouverts depuis plus de 30 jours
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sinistresAnciens = (sinistres ?? []).filter(
    (s: { created_at?: string | null }) => s.created_at && new Date(s.created_at) < thirtyDaysAgo
  )
  if (sinistresAnciens.length > 0) {
    smartAlerts.push({
      id: 'sinistres-anciens',
      severity: 'warning',
      message: `${sinistresAnciens.length} sinistre${sinistresAnciens.length > 1 ? 's' : ''} ouvert${sinistresAnciens.length > 1 ? 's' : ''} depuis plus de 30 jours`,
      href: '/sinistres',
      cta: 'Gérer',
    })
  }

  // ─── Données graphiques ────────────────────────────────────
  const tauxData = (coproprietes ?? [])
    .slice(0, 6)
    .map((c) => {
      const appels = allAppels.filter((a) => a.copropriete_id === c.id)
      const totalDu = appels.reduce((s, a) => s + a.montant, 0)
      const totalPaye = appels.reduce((s, a) => s + a.montant_paye, 0)
      const taux = totalDu > 0 ? Math.round((totalPaye / totalDu) * 100) : 100
      return {
        nom: c.nom.length > 14 ? c.nom.substring(0, 12) + '…' : c.nom,
        taux,
        impayes: c.montant_impayes ?? 0,
      }
    })

  const statutData = {
    aJour:    (coproprietes ?? []).filter((c) => c.statut === 'a_jour').length,
    attention:(coproprietes ?? []).filter((c) => c.statut === 'attention').length,
    urgent:   (coproprietes ?? []).filter((c) => c.statut === 'urgent').length,
  }

  const totalEmis     = allAppels.reduce((s, a) => s + a.montant, 0)
  const totalRecouvre = allAppels.reduce((s, a) => s + a.montant_paye, 0)
  const tauxGlobal    = totalEmis > 0 ? Math.round((totalRecouvre / totalEmis) * 100) : 100

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

  const coproprietesCritiques = (coproprietes ?? [])
    .filter((c) => c.statut !== 'a_jour')
    .slice(0, 5)

  // ─── Passer tout au canvas client ─────────────────────────
  const dashboardData: DashboardData = {
    userId:     user.id,
    prenom:     profile.prenom ?? 'vous',
    cabinetNom: cabinet?.nom ?? 'Mon cabinet',
    trialEndsAt: cabinet?.trial_ends_at ?? null,
    plan:        cabinet?.plan ?? null,
    onboardingSteps,
    kpis,
    tauxGlobal,
    totalEmis,
    totalRecouvre,
    smartAlerts,
    evolutionData,
    tauxData,
    statutData,
    coproprietesCritiques: coproprietesCritiques as Copropriete[],
    allCoproprietes: (coproprietes ?? []) as Copropriete[],
    sinistres:   sinistres ?? null,
    agProchaines: agProchaines ?? null,
    hasAppels:   allAppels.length > 0,
    conformiteData: {
      agRecentes: (agRecentes ?? []) as { copropriete_id: string; date_ag: string; status: string }[],
      fondsTravaux: (fondsTravaux ?? []) as { copropriete_id: string; annee: number | null }[],
    },
  }

  return <DashboardCanvas data={dashboardData} autoEdit={searchParams.edit === 'true'} />
}
