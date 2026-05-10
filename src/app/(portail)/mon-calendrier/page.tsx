import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar, CreditCard, Wrench, Users, MapPin, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { formatEuro } from '@/lib/utils'

type EventType = 'ag' | 'charge' | 'charge_retard' | 'sinistre'

interface CalEvent {
  id: string
  date: Date
  titre: string
  sous_titre?: string
  type: EventType
  montant?: number
  lieu?: string
  isPast: boolean
  isToday: boolean
  isUrgent?: boolean
}

export default async function MonCalendrier() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles')
    .select('lot_id, lot:lots(copropriete_id, copropriete:coproprietes(nom))')
    .eq('id', user.id)
    .single()

  const lotId = profile?.lot_id
  const coproprieteId = (profile?.lot as { copropriete_id?: string } | null)?.copropriete_id
  const coproprieteNom = (profile?.lot as { copropriete?: { nom?: string } } | null)?.copropriete?.nom

  const now = new Date()
  const sixMoisAvant = new Date(now)
  sixMoisAvant.setMonth(sixMoisAvant.getMonth() - 2)
  const sixMoisApres = new Date(now)
  sixMoisApres.setMonth(sixMoisApres.getMonth() + 6)

  const events: CalEvent[] = []

  // ── Assemblées générales ──────────────────────────────────────
  if (coproprieteId) {
    const { data: ags } = await supabase
      .from('assemblees_generales')
      .select('id, titre, date_ag, lieu, status')
      .eq('copropriete_id', coproprieteId)
      .gte('date_ag', sixMoisAvant.toISOString())
      .lte('date_ag', sixMoisApres.toISOString())
      .order('date_ag')

    for (const ag of ags ?? []) {
      const d = new Date(ag.date_ag)
      const isPast = d < now && ag.status === 'terminee'
      const isToday = d.toDateString() === now.toDateString()
      events.push({
        id: ag.id,
        date: d,
        titre: ag.titre,
        sous_titre: ag.status === 'terminee' ? 'Terminée' : undefined,
        type: 'ag',
        lieu: ag.lieu,
        isPast,
        isToday,
      })
    }
  }

  // ── Appels de charges ─────────────────────────────────────────
  if (lotId) {
    const { data: appels } = await supabase
      .from('appels_charges')
      .select('id, libelle, montant, montant_paye, date_echeance, paye')
      .eq('lot_id', lotId)
      .gte('date_echeance', sixMoisAvant.toISOString().split('T')[0])
      .lte('date_echeance', sixMoisApres.toISOString().split('T')[0])
      .order('date_echeance')

    for (const a of appels ?? []) {
      const d = new Date(a.date_echeance + 'T12:00:00')
      const isPast = d < now
      const isToday = d.toDateString() === now.toDateString()
      const isRetard = !a.paye && isPast
      events.push({
        id: a.id,
        date: d,
        titre: a.libelle,
        type: isRetard ? 'charge_retard' : 'charge',
        montant: a.montant - a.montant_paye,
        isPast: a.paye,
        isToday,
        isUrgent: isRetard,
      })
    }
  }

  // ── Sinistres en cours ────────────────────────────────────────
  if (lotId) {
    const { data: sinistres } = await supabase
      .from('sinistres')
      .select('id, titre, status, date_sinistre, reference')
      .contains('lots_concernes', [lotId])
      .neq('status', 'cloture')
      .order('date_sinistre', { ascending: false })
      .limit(5)

    for (const s of sinistres ?? []) {
      const dateStr = s.date_sinistre ?? new Date().toISOString().split('T')[0]
      const d = new Date(dateStr + 'T12:00:00')
      events.push({
        id: s.id,
        date: d,
        titre: s.titre,
        sous_titre: s.reference,
        type: 'sinistre',
        isPast: false,
        isToday: false,
        isUrgent: s.status === 'urgence',
      })
    }
  }

  // ── Trier et regrouper par mois ───────────────────────────────
  events.sort((a, b) => a.date.getTime() - b.date.getTime())

  const byMonth: Record<string, CalEvent[]> = {}
  for (const ev of events) {
    const key = `${ev.date.getFullYear()}-${ev.date.getMonth()}`
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(ev)
  }

  const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
  const todayStr = now.toDateString()
  const upcoming = events.filter(e => !e.isPast && e.date >= now)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Calendrier</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {coproprieteNom ?? 'Votre résidence'} · {upcoming.length} événement{upcoming.length > 1 ? 's' : ''} à venir
        </p>
      </div>

      {/* Résumé rapide */}
      {upcoming.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: 'Prochaine AG',
              event: upcoming.find(e => e.type === 'ag'),
              icon: Users,
              color: 'bg-coplio-green-light text-coplio-green',
            },
            {
              label: 'Prochaine charge',
              event: upcoming.find(e => e.type === 'charge' || e.type === 'charge_retard'),
              icon: CreditCard,
              color: 'bg-blue-50 text-blue-600',
            },
            {
              label: 'Sinistre en cours',
              event: upcoming.find(e => e.type === 'sinistre'),
              icon: Wrench,
              color: 'bg-coplio-amber-bg text-coplio-amber',
            },
          ].map(({ label, event, icon: Icon, color }) => (
            <div key={label} className="coplio-card py-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xs text-muted-foreground">{label}</p>
              {event ? (
                <>
                  <p className="text-sm font-semibold text-coplio-text mt-0.5 line-clamp-1">{event.titre}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-0.5">Aucun</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Timeline par mois */}
      {Object.keys(byMonth).length === 0 ? (
        <div className="coplio-card text-center py-16">
          <div className="w-14 h-14 bg-coplio-green-light rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-7 h-7 text-coplio-green" />
          </div>
          <p className="font-medium text-coplio-text">Aucun événement à venir</p>
          <p className="text-sm text-muted-foreground mt-1">Votre calendrier est vide pour les prochains mois.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(byMonth).map(([key, monthEvents]) => {
            const [year, month] = key.split('-').map(Number)
            const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()
            return (
              <div key={key}>
                {/* En-tête du mois */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    isCurrentMonth
                      ? 'bg-coplio-green text-white'
                      : 'bg-coplio-bg text-muted-foreground'
                  }`}>
                    {MOIS[month]} {year}
                  </div>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">
                    {monthEvents.length} événement{monthEvents.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Événements du mois */}
                <div className="space-y-2 pl-1">
                  {monthEvents.map((ev) => {
                    const isToday = ev.date.toDateString() === todayStr
                    return (
                      <EventRow key={ev.id + ev.type} event={ev} isToday={isToday} />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Ligne d'événement ──────────────────────────────────────── */
function EventRow({ event, isToday }: { event: CalEvent; isToday: boolean }) {
  const jour = event.date.getDate()
  const jourSemaine = event.date.toLocaleDateString('fr-FR', { weekday: 'short' })

  const typeConfig = {
    ag:            { icon: Users,         bg: 'bg-coplio-green-light',  iconColor: 'text-coplio-green',  border: 'border-coplio-green/20' },
    charge:        { icon: CreditCard,    bg: 'bg-blue-50',             iconColor: 'text-blue-500',      border: 'border-blue-100' },
    charge_retard: { icon: AlertTriangle, bg: 'bg-coplio-red-bg',       iconColor: 'text-coplio-red',    border: 'border-coplio-red/20' },
    sinistre:      { icon: Wrench,        bg: 'bg-coplio-amber-bg',     iconColor: 'text-coplio-amber',  border: 'border-coplio-amber/20' },
  }[event.type]

  const Icon = typeConfig.icon

  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${
      event.isPast
        ? 'opacity-50 bg-white border-transparent'
        : isToday
        ? 'bg-coplio-green-light/40 border-coplio-green/30 shadow-sm'
        : `bg-white ${typeConfig.border}`
    }`}>
      {/* Date */}
      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-bold ${
        isToday ? 'bg-coplio-green text-white' : 'bg-coplio-bg text-coplio-text'
      }`}>
        <span className="text-[10px] uppercase opacity-70 leading-none">{jourSemaine}</span>
        <span className="text-lg leading-tight">{jour}</span>
      </div>

      {/* Icône type */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        event.isPast ? 'bg-gray-100' : typeConfig.bg
      }`}>
        {event.isPast
          ? <CheckCircle2 className="w-4 h-4 text-gray-400" />
          : <Icon className={`w-4 h-4 ${typeConfig.iconColor}`} />
        }
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-medium text-sm truncate ${event.isPast ? 'text-muted-foreground line-through' : 'text-coplio-text'}`}>
            {event.titre}
          </p>
          {event.isUrgent && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-coplio-red text-white flex-shrink-0">
              URGENT
            </span>
          )}
          {isToday && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-coplio-green text-white flex-shrink-0">
              Aujourd'hui
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {event.sous_titre && (
            <span className="text-xs text-muted-foreground">{event.sous_titre}</span>
          )}
          {event.lieu && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />{event.lieu}
            </span>
          )}
          {event.montant !== undefined && event.montant > 0 && (
            <span className={`text-xs font-semibold ${event.type === 'charge_retard' ? 'text-coplio-red' : 'text-coplio-text'}`}>
              {formatEuro(event.montant)}
              {event.type === 'charge_retard' && ' — en retard'}
            </span>
          )}
          {event.type === 'charge' && event.montant !== undefined && event.montant <= 0 && (
            <span className="text-xs font-medium text-coplio-green flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Réglé
            </span>
          )}
        </div>
      </div>

      {/* Heure si AG */}
      {event.type === 'ag' && (
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-coplio-text flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            {event.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}
    </div>
  )
}
