import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Phone, Mail, MapPin, Shield, Users, Wrench,
  Building2, User, AlertTriangle, Calendar,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

function ContactLine({ icon: Icon, label, value, href }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  href?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a href={href} className="text-sm font-medium text-[#374151] hover:underline truncate block">
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium text-coplio-text truncate">{value}</p>
        )}
      </div>
    </div>
  )
}

export default async function MesContacts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles')
    .select('lot_id, cabinet_id, lot:lots(copropriete_id)')
    .eq('id', user.id)
    .single()

  if (!profile?.lot_id) {
    return (
      <div className="max-w-3xl mx-auto py-4">
        <h1 className="text-2xl font-bold text-coplio-text mb-6">Annuaire</h1>
        <div className="bg-white rounded-2xl border border-border p-10 text-center shadow-sm">
          <AlertTriangle className="w-10 h-10 text-coplio-amber mx-auto mb-3" />
          <p className="font-semibold text-coplio-text">Aucun lot associé</p>
          <p className="text-sm text-muted-foreground mt-1">Contactez votre syndic pour accéder à vos informations.</p>
        </div>
      </div>
    )
  }

  const coproprieteId = (profile.lot as { copropriete_id?: string } | null)?.copropriete_id
  const admin = createAdminClient()

  const [
    { data: copropriete },
    { data: cabinet },
    { data: conseilSyndical },
    { data: prestataires },
  ] = await Promise.all([
    coproprieteId
      ? admin.from('coproprietes').select('id, nom, adresse, code_postal, ville, gestionnaire_id, assureur, numero_contrat_assurance, expiration_assurance').eq('id', coproprieteId).single()
      : Promise.resolve({ data: null }),
    profile.cabinet_id
      ? admin.from('cabinets').select('nom, telephone, email_contact, adresse, code_postal, ville').eq('id', profile.cabinet_id).single()
      : Promise.resolve({ data: null }),
    coproprieteId
      ? admin.from('conseil_syndical').select('id, prenom, nom, role, telephone, email, lot_numero').eq('copropriete_id', coproprieteId).order('role')
      : Promise.resolve({ data: [] }),
    profile.cabinet_id
      ? admin.from('prestataires').select('id, nom, metier, telephone, email, commentaire').eq('cabinet_id', profile.cabinet_id).eq('actif', true).order('metier').limit(30)
      : Promise.resolve({ data: [] }),
  ])

  let gestionnaire: { prenom?: string | null; nom?: string | null; email?: string | null; telephone?: string | null } | null = null
  if (copropriete?.gestionnaire_id) {
    const { data: g } = await admin.from('profiles').select('prenom, nom, email, telephone').eq('id', copropriete.gestionnaire_id).single()
    gestionnaire = g
  }

  const now = new Date()
  const expirationAssurance = copropriete?.expiration_assurance ? new Date(copropriete.expiration_assurance) : null
  const joursAvantExpiration = expirationAssurance
    ? Math.ceil((expirationAssurance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null
  const assuranceExpired = joursAvantExpiration !== null && joursAvantExpiration < 0
  const assuranceWarning = joursAvantExpiration !== null && joursAvantExpiration >= 0 && joursAvantExpiration < 90

  const conseilList = conseilSyndical ?? []
  const prestatairesList = prestataires ?? []

  // Grouper prestataires par métier
  const prestatairesByMetier = prestatairesList.reduce<Record<string, typeof prestatairesList>>((acc, p) => {
    const metier = p.metier ?? 'Autre'
    if (!acc[metier]) acc[metier] = []
    acc[metier].push(p)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Annuaire</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Contacts utiles de votre copropriété</p>
      </div>

      {/* Syndic */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-[#374151]" />
          </div>
          <h2 className="font-semibold text-coplio-text">Votre syndic</h2>
        </div>
        <div className="px-5 py-4 space-y-3">
          {cabinet?.nom && (
            <p className="font-semibold text-coplio-text">{cabinet.nom}</p>
          )}
          {gestionnaire && (
            <div className="flex items-start gap-3 pb-3 border-b border-border">
              <div className="w-9 h-9 bg-coplio-bg rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-coplio-text">
                  {gestionnaire.prenom} {gestionnaire.nom}
                  <span className="text-xs text-muted-foreground font-normal ml-2">Gestionnaire</span>
                </p>
                {gestionnaire.email && (
                  <a href={`mailto:${gestionnaire.email}`} className="flex items-center gap-1.5 text-xs text-[#374151] hover:underline">
                    <Mail className="w-3 h-3" />{gestionnaire.email}
                  </a>
                )}
                {gestionnaire.telephone && (
                  <a href={`tel:${gestionnaire.telephone}`} className="flex items-center gap-1.5 text-xs text-[#374151] hover:underline">
                    <Phone className="w-3 h-3" />{gestionnaire.telephone}
                  </a>
                )}
              </div>
            </div>
          )}
          <div className="space-y-2.5">
            {cabinet?.telephone && (
              <ContactLine icon={Phone} label="Téléphone" value={cabinet.telephone} href={`tel:${cabinet.telephone}`} />
            )}
            {cabinet?.email_contact && (
              <ContactLine icon={Mail} label="Email" value={cabinet.email_contact} href={`mailto:${cabinet.email_contact}`} />
            )}
            {(cabinet?.adresse || cabinet?.ville) && (
              <ContactLine
                icon={MapPin}
                label="Adresse"
                value={[cabinet.adresse, cabinet.code_postal, cabinet.ville].filter(Boolean).join(' ')}
              />
            )}
            {!cabinet?.telephone && !cabinet?.email_contact && !gestionnaire && (
              <p className="text-sm text-muted-foreground">Coordonnées non renseignées.</p>
            )}
          </div>
        </div>
      </div>

      {/* Assurance */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="font-semibold text-coplio-text">Assurance de la copropriété</h2>
        </div>
        <div className="px-5 py-4">
          {copropriete?.assureur ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Assureur</p>
                <p className="text-sm font-semibold text-coplio-text">{copropriete.assureur}</p>
              </div>
              {copropriete.numero_contrat_assurance && (
                <div>
                  <p className="text-xs text-muted-foreground">N° de contrat</p>
                  <p className="text-sm font-mono font-medium text-coplio-text">{copropriete.numero_contrat_assurance}</p>
                </div>
              )}
              {expirationAssurance && (
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
                  assuranceExpired
                    ? 'bg-coplio-red-bg border-coplio-red/20'
                    : assuranceWarning
                      ? 'bg-coplio-amber-bg border-coplio-amber/20'
                      : 'bg-coplio-bg border-border'
                }`}>
                  <Calendar className={`w-4 h-4 flex-shrink-0 ${assuranceExpired ? 'text-coplio-red' : assuranceWarning ? 'text-coplio-amber' : 'text-muted-foreground'}`} />
                  <div>
                    <p className={`text-sm font-medium ${assuranceExpired ? 'text-coplio-red' : assuranceWarning ? 'text-coplio-amber' : 'text-coplio-text'}`}>
                      {assuranceExpired
                        ? 'Contrat expiré'
                        : assuranceWarning
                          ? `Expire dans ${joursAvantExpiration} jour${joursAvantExpiration > 1 ? 's' : ''}`
                          : `Valide jusqu'au ${formatDate(copropriete.expiration_assurance!)}`}
                    </p>
                    {!assuranceExpired && (
                      <p className="text-xs text-muted-foreground mt-0.5">Échéance : {formatDate(copropriete.expiration_assurance!)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Informations d&apos;assurance non renseignées par votre syndic.</p>
          )}
        </div>
      </div>

      {/* Conseil syndical */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <h2 className="font-semibold text-coplio-text">Conseil syndical</h2>
          {conseilList.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">{conseilList.length} membre{conseilList.length > 1 ? 's' : ''}</span>
          )}
        </div>
        {conseilList.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-muted-foreground">Aucun membre renseigné.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conseilList.map((membre) => (
              <div key={membre.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-coplio-text">{membre.prenom} {membre.nom}</p>
                    {membre.role && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                        {membre.role}
                      </span>
                    )}
                    {membre.lot_numero && (
                      <span className="text-[10px] text-muted-foreground">Lot {membre.lot_numero}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {membre.telephone && (
                      <a href={`tel:${membre.telephone}`} className="flex items-center gap-1 text-xs text-[#374151] hover:underline">
                        <Phone className="w-3 h-3" />{membre.telephone}
                      </a>
                    )}
                    {membre.email && (
                      <a href={`mailto:${membre.email}`} className="flex items-center gap-1 text-xs text-[#374151] hover:underline">
                        <Mail className="w-3 h-3" />{membre.email}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prestataires */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 bg-coplio-amber-bg rounded-lg flex items-center justify-center">
            <Wrench className="w-4 h-4 text-coplio-amber" />
          </div>
          <h2 className="font-semibold text-coplio-text">Prestataires & intervenants</h2>
          {prestatairesList.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">{prestatairesList.length}</span>
          )}
        </div>
        {prestatairesList.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-muted-foreground">Aucun prestataire renseigné par votre syndic.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {Object.entries(prestatairesByMetier).map(([metier, liste]) => (
              <div key={metier}>
                <div className="px-5 py-2 bg-coplio-bg">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{metier}</p>
                </div>
                {liste.map((p) => (
                  <div key={p.id} className="px-5 py-3.5 flex items-start gap-3">
                    <div className="w-8 h-8 bg-coplio-amber-bg rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Wrench className="w-3.5 h-3.5 text-coplio-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-coplio-text">{p.nom}</p>
                      {p.commentaire && (
                        <p className="text-xs text-muted-foreground mt-0.5">{p.commentaire}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        {p.telephone && (
                          <a href={`tel:${p.telephone}`} className="flex items-center gap-1 text-xs text-[#374151] hover:underline">
                            <Phone className="w-3 h-3" />{p.telephone}
                          </a>
                        )}
                        {p.email && (
                          <a href={`mailto:${p.email}`} className="flex items-center gap-1 text-xs text-[#374151] hover:underline">
                            <Mail className="w-3 h-3" />{p.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
