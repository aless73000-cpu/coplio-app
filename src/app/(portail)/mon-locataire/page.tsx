import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { LocataireManager } from '@/components/portail/LocataireManager'
import { LocataireThread } from '@/components/portail/LocataireThread'

export const metadata = { title: 'Mon locataire' }

export default async function MonLocatairePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, lot_id, lot:lots(numero, copropriete:coproprietes(nom))')
    .eq('id', user.id)
    .single()

  // Réservé aux copropriétaires (les locataires n'invitent pas)
  if (!profile || profile.role !== 'owner_resident') redirect('/accueil')

  const lot = profile.lot as { numero: string | null; copropriete: { nom: string } | null } | null

  // Le locataire a cabinet_id = NULL → invisible via RLS pour le propriétaire.
  // On le récupère via le client admin, scopé à landlord_id = propriétaire.
  const admin = createAdminClient()
  const { data: tenant } = await admin
    .from('profiles')
    .select('id, prenom, nom, email')
    .eq('landlord_id', user.id)
    .eq('role', 'tenant')
    .maybeSingle()

  // Pas de locataire → l'invitation se fait depuis les Paramètres
  if (!tenant) redirect('/mon-compte')

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/accueil" className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors shadow-sm">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ letterSpacing: '-0.02em' }}>Mon locataire</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {lot?.copropriete?.nom}{lot?.numero && ` · Lot ${lot.numero}`}
          </p>
        </div>
      </div>

      <LocataireManager tenant={tenant ?? null} />

      {/* Messagerie privée avec le locataire */}
      <LocataireThread otherLabel="votre locataire" />
    </div>
  )
}
