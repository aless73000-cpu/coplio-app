import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, Mail, Phone, Home, Building2, Shield, Hash } from 'lucide-react'
import { formatEuro } from '@/lib/utils'
import { LOT_TYPE_LABELS } from '@/types'

export default async function MonComptePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, lot:lots(id, numero, type, etage, surface, tantiemes, solde_compte, copropriete:coproprietes(nom, adresse, code_postal, ville))')
    .eq('id', user.id)
    .single()

  const lot = profile?.lot as {
    id: string
    numero: string
    type: string
    etage?: string
    surface?: number
    tantiemes: number
    solde_compte: number
    copropriete: { nom: string; adresse?: string; code_postal?: string; ville?: string }
  } | null

  const initials = `${profile?.prenom?.[0] ?? ''}${profile?.nom?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Mon compte</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Vos informations personnelles et votre logement</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Colonne gauche — profil */}
        <div className="col-span-1 space-y-4">
          {/* Avatar */}
          <div className="coplio-card flex flex-col items-center text-center py-8">
            <div className="w-20 h-20 rounded-full bg-coplio-green flex items-center justify-center mb-4">
              <span className="text-white text-2xl font-bold">{initials || <User className="w-8 h-8" />}</span>
            </div>
            <h2 className="font-bold text-coplio-text text-lg">{profile?.prenom} {profile?.nom}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-coplio-green-light text-coplio-green">
              <Shield className="w-3 h-3" />
              Copropriétaire
            </span>
          </div>

          {/* Solde */}
          {lot && (
            <div className={`coplio-card ${lot.solde_compte < 0 ? 'border-red-200 bg-red-50' : 'border-coplio-green/20 bg-coplio-green-light'}`}>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Solde compte</p>
              <p className={`text-3xl font-bold ${lot.solde_compte < 0 ? 'text-red-600' : 'text-coplio-green'}`}>
                {formatEuro(lot.solde_compte)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {lot.solde_compte >= 0 ? 'Votre compte est à jour' : 'Solde débiteur — contactez votre syndic'}
              </p>
            </div>
          )}
        </div>

        {/* Colonne droite — détails */}
        <div className="col-span-2 space-y-4">
          {/* Coordonnées */}
          <div className="coplio-card">
            <h3 className="font-semibold text-coplio-text mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Mes coordonnées
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-coplio-bg rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Prénom</p>
                <p className="font-medium text-coplio-text">{profile?.prenom ?? '—'}</p>
              </div>
              <div className="bg-coplio-bg rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Nom</p>
                <p className="font-medium text-coplio-text">{profile?.nom ?? '—'}</p>
              </div>
              <div className="bg-coplio-bg rounded-xl p-4 flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Email</p>
                  <p className="font-medium text-coplio-text text-sm truncate">{user.email}</p>
                </div>
              </div>
              <div className="bg-coplio-bg rounded-xl p-4 flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Téléphone</p>
                  <p className="font-medium text-coplio-text text-sm">{profile?.telephone ?? '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mon logement */}
          {lot && (
            <div className="coplio-card">
              <h3 className="font-semibold text-coplio-text mb-4 flex items-center gap-2">
                <Home className="w-4 h-4 text-muted-foreground" />
                Mon logement
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-coplio-bg rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Numéro de lot</p>
                  <p className="font-bold text-coplio-text text-lg">Lot {lot.numero}</p>
                  {lot.etage && <p className="text-xs text-muted-foreground mt-0.5">{lot.etage}</p>}
                </div>
                <div className="bg-coplio-bg rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Type</p>
                  <p className="font-medium text-coplio-text">
                    {LOT_TYPE_LABELS[lot.type as keyof typeof LOT_TYPE_LABELS] ?? lot.type}
                  </p>
                  {lot.surface && <p className="text-xs text-muted-foreground mt-0.5">{lot.surface} m²</p>}
                </div>
                <div className="bg-coplio-bg rounded-xl p-4 flex items-center gap-3">
                  <Hash className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Tantièmes</p>
                    <p className="font-bold text-coplio-text">{lot.tantiemes} / 10 000</p>
                  </div>
                </div>
                {lot.copropriete && (
                  <div className="bg-coplio-bg rounded-xl p-4 flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Copropriété</p>
                      <p className="font-medium text-coplio-text text-sm truncate">{lot.copropriete.nom}</p>
                      {lot.copropriete.ville && (
                        <p className="text-xs text-muted-foreground">{lot.copropriete.ville}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sécurité */}
          <div className="coplio-card">
            <h3 className="font-semibold text-coplio-text mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              Sécurité
            </h3>
            <div className="flex items-center justify-between p-4 bg-coplio-bg rounded-xl">
              <div>
                <p className="font-medium text-coplio-text text-sm">Mot de passe</p>
                <p className="text-xs text-muted-foreground mt-0.5">Modifiez votre mot de passe de connexion</p>
              </div>
              <a
                href={`/portail/reset-password?email=${encodeURIComponent(user.email ?? '')}`}
                className="text-sm font-medium text-coplio-green hover:underline"
              >
                Modifier
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
