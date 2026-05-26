import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'

// ── DELETE /api/assemblees/[id]/pouvoirs/[pouvoir_id] ─────────────
// Révoque un mandat. Uniquement avant la clôture de l'AG.
export const DELETE = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string; pouvoir_id: string }> }
) => {
  const { id, pouvoir_id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

  const admin = createAdminClient()

  // Vérifier que le pouvoir appartient à cette AG et à ce cabinet
  const { data: pouvoir } = await admin
    .from('pouvoirs')
    .select('id, ag:assemblees_generales(id, status, copropriete:coproprietes(cabinet_id))')
    .eq('id', pouvoir_id)
    .eq('ag_id', id)
    .single()

  if (!pouvoir) return NextResponse.json({ error: 'Pouvoir introuvable' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ag = pouvoir.ag as any
  if (ag?.copropriete?.cabinet_id !== profile.cabinet_id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  if (ag?.status === 'terminee' || ag?.status === 'annulee') {
    return NextResponse.json({ error: 'L\'AG est terminée, les pouvoirs ne peuvent plus être modifiés' }, { status: 400 })
  }

  const { error } = await admin
    .from('pouvoirs')
    .delete()
    .eq('id', pouvoir_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
})
