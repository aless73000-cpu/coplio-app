import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, Clock, MapPin, CreditCard, Wrench, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Agenda' }

interface AgendaEvent {
  id: string
  type: 'ag' | 'echeance' | 'sinistre'
  titre: string
  sous_titre?: string
  date: string
  lien: string
  statut?: string
}

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()

  if (!profile?.cabinet_id) redirect('/onboarding')

  const cabinetId = profile.cabinet_id
  const now = new Date().toISOString()
  const in90days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

  // AG à venir (90 prochains jours)
  const { data: coproprietes } = await supabase
    .from('coproprietes')
    .select('id')
    .eq('cabinet_id', cabinetId)

  const coproprieteIds = (coproprietes ?? []).map((c) => c.id)

  const [ags, echeances, sinistres] = await Promise.all([
    supabase
      .from('assemblees_generales')
      .select('id, titre, date_ag, lieu, status, copropriete:coproprietes(nom)')
      .in('copropriete_id', coproprieteIds.length > 0 ? coproprieteIds : ['none'])
      .gte('date_ag', now)
      .lte('date_ag', in90days)
      .neq('status', 'annulee')
      .order('date_ag', { ascending: true })
      .limit(20),

    supabase
      .from('appels_charges')
      .select('id, libelle, date_echeance, paye, copropriete:coproprietes(nom)')
      .in('copropriete_id', coproprieteIds.length > 0 ? coproprieteIds : ['none'])
      .eq('paye', false)
      .gte('date_echeance', now)
      .lte('date_echeance', in90days)
      .order('date_echeance', { ascending: true })
      .limit(20),

    supabase
      .from('sinistres')
      .select('id, titre, date_sinistre, statut, copropriete:coproprietes(nom)')
      .in('copropriete_id', coproprieteIds.length > 0 ? coproprieteIds : ['none'])
      .neq('statut', 'cloture')
      .order('date_sinistre', { ascending: false })
      .limit(10),
  ])

  // Fusionner et trier par date
  const events: AgendaEvent[] = [
    ...(ags.data ?? []).map((a) => ({
      id: a.id,
      type: 'ag' as const,
      titre: a.titre ?? 'Assemblée générale',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sous_titre: (a.copropriete as any)?.nom,
      date: a.date_ag,
      lien: `/assemblees/${a.id}`,
      statut: a.status,
    })),
    ...(echeances.data ?? []).map((e) => ({
      id: e.id,
      type: 'echeance' as const,
      titre: e.libelle,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sous_titre: (e.copropriete as any)?.nom,
      date: e.date_echeance,
      lien: `/appels-charges`,
      statut: 'À régler',
    })),
    ...(sinistres.data ?? []).map((s) => ({
      id: s.id,
      type: 'sinistre' as const,
      titre: s.titre,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sous_titre: (s.copropriete as any)?.nom,
      date: s.date_sinistre,
      lien: `/sinistres/${s.id}`,
      statut: s.statut,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Grouper par mois
  const grouped = events.reduce((acc, ev) => {
    const month = new Date(ev.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    if (!acc[month]) acc[month] = []
    acc[month].push(ev)
    return acc
  }, {} as Record<string, AgendaEvent[]>)

  const typeConfig = {
    ag: { icon: CalendarDays, color: 'bg-coplio-blue-bg text-coplio-blue', label: 'AG' },
    echeance: { icon: CreditCard, color: 'bg-coplio-amber-bg text-coplio-amber', label: 'Échéance' },
    sinistre: { icon: Wrench, color: 'bg-coplio-red-bg text-coplio-red', label: 'Sinistre' },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Agenda</h1>
        <p className="text-muted-foreground text-sm mt-1">
          AG, échéances et sinistres des 90 prochains jours
        </p>
      </div>

      {events.length === 0 ? (
        <div className="coplio-card text-center py-16">
          <div className="w-14 h-14 bg-coplio-green-light rounded-full flex items-center justify-center mx-auto mb-3">
            <CalendarDays className="w-7 h-7 text-coplio-green" />
          </div>
          <p className="font-medium text-coplio-text">Rien à l&apos;horizon</p>
          <p className="text-sm text-muted-foreground mt-1">Aucun événement dans les 90 prochains jours.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([month, items]) => (
            <div key={month}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 capitalize">
                {month}
              </h2>
              <div className="space-y-2">
                {items.map((ev) => {
                  const { icon: Icon, color, label } = typeConfig[ev.type]
                  const date = new Date(ev.date)
                  const isToday = date.toDateString() === new Date().toDateString()
                  const isSoon = date.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000

                  return (
                    <Link
                      key={`${ev.type}-${ev.id}`}
                      href={ev.lien}
                      className="coplio-card flex items-center gap-4 hover:shadow-md transition-shadow group p-4"
                    >
                      {/* Date */}
                      <div className={`flex-shrink-0 w-14 text-center rounded-xl py-2 ${isToday ? 'bg-coplio-green text-white' : 'bg-coplio-bg'}`}>
                        <p className={`text-xl font-bold leading-none ${isToday ? 'text-white' : 'text-coplio-text'}`}>
                          {date.getDate()}
                        </p>
                        <p className={`text-xs mt-0.5 ${isToday ? 'text-white/80' : 'text-muted-foreground'}`}>
                          {date.toLocaleDateString('fr-FR', { month: 'short' })}
                        </p>
                      </div>

                      {/* Icône type */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-coplio-text text-sm truncate">{ev.titre}</p>
                          {isSoon && !isToday && (
                            <span className="text-xs bg-coplio-amber-bg text-coplio-amber px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                              Bientôt
                            </span>
                          )}
                          {isToday && (
                            <span className="text-xs bg-coplio-green text-white px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                              Aujourd&apos;hui
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {ev.sous_titre && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {ev.sous_titre}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${color}`}>
                            {label}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-coplio-green transition-colors flex-shrink-0" />
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
