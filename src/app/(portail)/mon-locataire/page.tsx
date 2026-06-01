import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, KeyRound } from 'lucide-react'
import { LocataireManager } from '@/components/portail/LocataireManager'

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

      {/* Explication */}
      <div className="flex items-start gap-3 bg-blue-50/60 border border-blue-100 rounded-2xl px-4 py-3.5">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <KeyRound className="w-4 h-4 text-blue-600" />
        </div>
        <p className="text-sm text-blue-900/80 leading-relaxed">
          Si vous louez votre bien, invitez votre locataire à un espace allégé : il pourra
          <strong> signaler des problèmes</strong> au syndic et consulter les infos utiles, sans accès
          à vos charges, votes ou documents financiers.
        </p>
      </div>

      <LocataireManager tenant={tenant ?? null} />
    </div>
  )
}
