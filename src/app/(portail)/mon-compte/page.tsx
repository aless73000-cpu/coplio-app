import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, Mail, Phone, Home, Building2, LogOut } from 'lucide-react'
import { formatEuro } from '@/lib/utils'
import { LOT_TYPE_LABELS } from '@/types'

export default async function MonComptePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="bg-coplio-green px-6 pt-12 pb-8 text-white">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
          <User className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">
          {profile?.prenom} {profile?.nom}
        </h1>
        <p className="text-white/70 text-sm mt-0.5">{user.email}</p>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {/* Informations personnelles */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-coplio-bg">
            <h2 className="font-semibold text-sm text-coplio-text">Mes coordonnées</h2>
          </div>
          <div className="divide-y divide-border">
            <div className="flex items-center gap-3 px-4 py-3">
              <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-coplio-text">{user.email}</p>
              </div>
            </div>
            {profile?.telephone && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="text-sm font-medium text-coplio-text">{profile.telephone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mon lot */}
        {lot && (
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-coplio-bg">
              <h2 className="font-semibold text-sm text-coplio-text">Mon logement</h2>
            </div>
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-coplio-green-light rounded-xl flex items-center justify-center flex-shrink-0">
                  <Home className="w-5 h-5 text-coplio-green" />
                </div>
                <div>
                  <p className="font-semibold text-coplio-text">
                    Lot {lot.numero}
                    {lot.etage && <span className="font-normal text-muted-foreground"> · {lot.etage}</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {LOT_TYPE_LABELS[lot.type as keyof typeof LOT_TYPE_LABELS] ?? lot.type}
                    {lot.surface && ` · ${lot.surface} m²`}
                  </p>
                </div>
              </div>

              <div className="pt-1 grid grid-cols-2 gap-3">
                <div className="bg-coplio-bg rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Tantièmes</p>
                  <p className="font-bold text-coplio-text mt-0.5">{lot.tantiemes}</p>
                </div>
                <div className={`rounded-xl p-3 ${lot.solde_compte < 0 ? 'bg-red-50' : 'bg-coplio-green-light'}`}>
                  <p className="text-xs text-muted-foreground">Solde compte</p>
                  <p className={`font-bold mt-0.5 ${lot.solde_compte < 0 ? 'text-red-600' : 'text-coplio-green'}`}>
                    {formatEuro(lot.solde_compte)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Copropriété */}
        {lot?.copropriete && (
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-coplio-bg">
              <h2 className="font-semibold text-sm text-coplio-text">Ma copropriété</h2>
            </div>
            <div className="flex items-start gap-3 px-4 py-4">
              <div className="w-10 h-10 bg-coplio-green-light rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-coplio-green" />
              </div>
              <div>
                <p className="font-semibold text-coplio-text">{lot.copropriete.nom}</p>
                {lot.copropriete.adresse && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {lot.copropriete.adresse}
                    {lot.copropriete.code_postal && `, ${lot.copropriete.code_postal}`}
                    {lot.copropriete.ville && ` ${lot.copropriete.ville}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Déconnexion */}
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-white border border-border
                       text-coplio-text font-medium py-3 px-4 rounded-2xl hover:bg-coplio-bg transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  )
}
