import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  Home,
  Users,
  FileText,
  AlertTriangle,
  CreditCard,
  CalendarDays,
  Edit,
  MapPin,
  ChevronLeft,
  Plus,
} from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'
import type { Lot, Sinistre, Document } from '@/types'

interface PageProps {
  params: { id: string }
}

export default async function CoproprieteDetailPage({ params }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()

  const { data: copropriete } = await supabase
    .from('coproprietes')
    .select('*')
    .eq('id', params.id)
    .eq('cabinet_id', profile?.cabinet_id ?? '')
    .single()

  if (!copropriete) notFound()

  // Charger les données liées en parallèle
  const [
    { data: lots },
    { data: sinistres },
    { data: documents },
    { data: ags },
    { data: appels },
  ] = await Promise.all([
    supabase
      .from('lots')
      .select('*')
      .eq('copropriete_id', copropriete.id)
      .order('numero'),
    supabase
      .from('sinistres')
      .select('*')
      .eq('copropriete_id', copropriete.id)
      .neq('status', 'cloture')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('documents')
      .select('*')
      .eq('copropriete_id', copropriete.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('assemblees_generales')
      .select('*')
      .eq('copropriete_id', copropriete.id)
      .order('date_ag', { ascending: false })
      .limit(3),
    supabase
      .from('appels_charges')
      .select('montant, montant_paye, paye, date_echeance')
      .eq('copropriete_id', copropriete.id),
  ])

  // Stats de recouvrement
  const totalCharges = (appels ?? []).reduce((s, a) => s + a.montant, 0)
  const totalRecouvre = (appels ?? []).reduce((s, a) => s + a.montant_paye, 0)
  const tauxRecouvrement = totalCharges > 0 ? Math.round((totalRecouvre / totalCharges) * 100) : 100
  const totalImpayes = (appels ?? []).filter(a => !a.paye && new Date(a.date_echeance) < new Date())
  const montantImpayes = totalImpayes.reduce((s, a) => s + (a.montant - a.montant_paye), 0)
  const prochainAG = (ags ?? []).find(ag => new Date(ag.date_ag) > new Date())

  const statusConfig = {
    a_jour: { cls: 'badge-a-jour', label: 'À jour' },
    attention: { cls: 'badge-attention', label: 'Attention' },
    urgent: { cls: 'badge-urgent', label: 'Urgent' },
  }

  const { cls: statusCls, label: statusLabel } =
    statusConfig[copropriete.statut as keyof typeof statusConfig] ?? statusConfig.a_jour

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/coproprietes" className="hover:text-coplio-green flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" />
          Copropriétés
        </Link>
        <span>/</span>
        <span className="text-coplio-text font-medium">{copropriete.nom}</span>
      </div>

      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-coplio-green-light rounded-2xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-7 h-7 text-coplio-green" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-coplio-text">{copropriete.nom}</h1>
              <span className={statusCls}>{statusLabel}</span>
            </div>
            {copropriete.adresse && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {copropriete.adresse}
                {copropriete.code_postal && `, ${copropriete.code_postal}`}
                {copropriete.ville && ` ${copropriete.ville}`}
              </div>
            )}
          </div>
        </div>
        <Link
          href={`/coproprietes/${copropriete.id}/edit`}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm
                     hover:bg-coplio-bg transition-colors"
        >
          <Edit className="w-4 h-4" />
          Modifier
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="coplio-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Lots</p>
          <p className="text-2xl font-bold text-coplio-text mt-1">{lots?.length ?? 0}</p>
        </div>
        <div className="coplio-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Sinistres ouverts</p>
          <p className={`text-2xl font-bold mt-1 ${(sinistres?.length ?? 0) > 0 ? 'text-coplio-amber' : 'text-coplio-text'}`}>
            {sinistres?.length ?? 0}
          </p>
        </div>
        <div className="coplio-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Impayés</p>
          <p className={`text-2xl font-bold mt-1 ${montantImpayes > 0 ? 'text-coplio-red' : 'text-coplio-text'}`}>
            {formatEuro(montantImpayes)}
          </p>
        </div>
        <div className="coplio-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Taux recouvrement</p>
          <p className={`text-2xl font-bold mt-1 ${tauxRecouvrement >= 90 ? 'text-coplio-green' : tauxRecouvrement >= 70 ? 'text-coplio-amber' : 'text-coplio-red'}`}>
            {tauxRecouvrement}%
          </p>
          <div className="mt-2 h-1.5 bg-coplio-bg rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${tauxRecouvrement >= 90 ? 'bg-coplio-green' : tauxRecouvrement >= 70 ? 'bg-coplio-amber' : 'bg-coplio-red'}`}
              style={{ width: `${tauxRecouvrement}%` }}
            />
          </div>
        </div>
      </div>

      {/* Prochaine AG */}
      {prochainAG && (
        <div className="coplio-card bg-coplio-green-light border-coplio-green/20 flex items-center gap-4">
          <div className="w-10 h-10 bg-coplio-green rounded-xl flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-coplio-text text-sm">Prochaine AG : {prochainAG.titre}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(prochainAG.date_ag).toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
              {prochainAG.lieu ? ` · ${prochainAG.lieu}` : ''}
            </p>
          </div>
          <Link href={`/assemblees/${prochainAG.id}`} className="text-xs text-coplio-green hover:underline flex-shrink-0">
            Voir →
          </Link>
        </div>
      )}

      {/* Contenu en 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lots */}
          <SectionCard
            title="Lots"
            count={lots?.length ?? 0}
            href={`/coproprietes/${copropriete.id}/lots`}
            addHref={`/coproprietes/${copropriete.id}/lots/new`}
          >
            {lots && lots.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium text-xs">Numéro</th>
                      <th className="text-left py-2 text-muted-foreground font-medium text-xs">Type</th>
                      <th className="text-left py-2 text-muted-foreground font-medium text-xs">Surface</th>
                      <th className="text-right py-2 text-muted-foreground font-medium text-xs">Tantièmes</th>
                      <th className="text-right py-2 text-muted-foreground font-medium text-xs">Solde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lots.slice(0, 8).map((lot: Lot) => (
                      <tr key={lot.id} className="border-b border-border hover:bg-coplio-bg transition-colors">
                        <td className="py-2.5">
                          <Link href={`/lots/${lot.id}`} className="font-medium text-coplio-green hover:underline">
                            Lot {lot.numero}
                          </Link>
                          {lot.etage && <span className="text-xs text-muted-foreground ml-1">· {lot.etage}</span>}
                        </td>
                        <td className="py-2.5 text-muted-foreground capitalize">{lot.type}</td>
                        <td className="py-2.5 text-muted-foreground">{lot.surface ? `${lot.surface} m²` : '—'}</td>
                        <td className="py-2.5 text-right">{lot.tantiemes}</td>
                        <td className={`py-2.5 text-right font-medium ${lot.solde_compte < 0 ? 'text-coplio-red' : 'text-coplio-text'}`}>
                          {formatEuro(lot.solde_compte)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun lot enregistré</p>
            )}
          </SectionCard>

          {/* Sinistres */}
          <SectionCard
            title="Sinistres en cours"
            count={sinistres?.length ?? 0}
            href={`/sinistres?copropriete=${copropriete.id}`}
            addHref="/sinistres/new"
          >
            {sinistres && sinistres.length > 0 ? (
              <div className="space-y-2">
                {sinistres.map((s: Sinistre) => (
                  <Link
                    key={s.id}
                    href={`/sinistres/${s.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-coplio-bg transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{s.titre}</p>
                      <p className="text-xs text-muted-foreground">{s.reference}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      s.status === 'urgence' ? 'badge-urgent' :
                      s.status === 'signale' ? 'badge-attention' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {s.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun sinistre en cours</p>
            )}
          </SectionCard>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Informations */}
          <div className="coplio-card">
            <h3 className="font-semibold text-coplio-text mb-4">Informations</h3>
            <dl className="space-y-3">
              {[
                { label: 'Tantièmes totaux', value: `${ copropriete.tantiemes_totaux ?? '10 000' }` },
                {
                  label: 'Année de construction',
                  value: copropriete.annee_construction?.toString() ?? '—',
                },
                {
                  label: 'Surface totale',
                  value: copropriete.surface_totale ? `${copropriete.surface_totale} m²` : '—',
                },
                { label: 'Assureur', value: copropriete.assureur ?? '—' },
                {
                  label: 'Expiration assurance',
                  value: copropriete.expiration_assurance
                    ? formatDate(copropriete.expiration_assurance)
                    : '—',
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium text-coplio-text">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Documents récents */}
          <div className="coplio-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-coplio-text">Documents récents</h3>
              <Link href="/documents" className="text-xs text-coplio-green hover:underline">
                Voir tout
              </Link>
            </div>
            {documents && documents.length > 0 ? (
              <div className="space-y-2">
                {documents.slice(0, 4).map((doc: Document) => (
                  <div key={doc.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-coplio-bg transition-colors">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-coplio-text truncate flex-1">{doc.nom}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-3">Aucun document</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  count,
  href,
  addHref,
  children,
}: {
  title: string
  count: number
  href: string
  addHref: string
  children: React.ReactNode
}) {
  return (
    <div className="coplio-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-coplio-text">{title}</h2>
          <span className="bg-coplio-bg text-muted-foreground text-xs px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href={addHref} className="text-xs text-coplio-green hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" />
            Ajouter
          </Link>
          <span className="text-border">|</span>
          <Link href={href} className="text-xs text-coplio-green hover:underline">
            Voir tout
          </Link>
        </div>
      </div>
      {children}
    </div>
  )
}
