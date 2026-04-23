import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, User, Mail, Phone } from 'lucide-react'

export default async function CopropriétairesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()

  if (!profile?.cabinet_id) redirect('/onboarding')

  const { data: copropriétaires } = await supabase
    .from('copropriétaires')
    .select('*, lots:copropriétaire_lots(lot:lots(numero, copropriete:coproprietes(nom)))')
    .eq('cabinet_id', profile.cabinet_id)
    .order('nom')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Copropriétaires</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {copropriétaires?.length ?? 0} copropriétaire{(copropriétaires?.length ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/coproprietaires/new"
          className="flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </Link>
      </div>

      {copropriétaires && copropriétaires.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {copropriétaires.map((c: {
            id: string
            prenom: string
            nom: string
            email: string
            telephone?: string
            lots?: { lot: { numero: string; copropriete: { nom: string } } }[]
          }) => (
            <Link key={c.id} href={`/coproprietaires/${c.id}`} className="coplio-card hover:border-coplio-green/30 transition-colors block">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-coplio-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-coplio-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-coplio-text">{c.prenom} {c.nom}</p>
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      {c.email}
                    </p>
                    {c.telephone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        {c.telephone}
                      </p>
                    )}
                  </div>
                  {c.lots && c.lots.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.lots.slice(0, 2).map((cl, i) => (
                        <span key={i} className="text-xs bg-coplio-bg text-muted-foreground px-2 py-0.5 rounded-full">
                          Lot {cl.lot.numero} · {cl.lot.copropriete.nom}
                        </span>
                      ))}
                      {c.lots.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{c.lots.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="coplio-card text-center py-16">
          <div className="w-14 h-14 bg-coplio-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-7 h-7 text-coplio-green" />
          </div>
          <h3 className="font-semibold text-coplio-text mb-1">Aucun copropriétaire</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Ajoutez vos copropriétaires pour leur donner accès au portail.
          </p>
          <Link
            href="/coproprietaires/new"
            className="inline-flex items-center gap-2 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un copropriétaire
          </Link>
        </div>
      )}
    </div>
  )
}
