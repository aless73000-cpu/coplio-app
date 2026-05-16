import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

// GET — liste les membres de l'équipe du cabinet
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('cabinet_id, role').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet introuvable' }, { status: 400 })

  const admin = createAdminClient()
  const { data: membres } = await admin
    .from('profiles')
    .select('id, prenom, nom, email, role, created_at')
    .eq('cabinet_id', profile.cabinet_id)
    .in('role', ['owner', 'manager'])
    .order('created_at')

  return NextResponse.json(membres ?? [])
}

// POST — inviter un gestionnaire
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') {
    return NextResponse.json({ error: 'Seul le propriétaire du compte peut inviter des gestionnaires' }, { status: 403 })
  }

  const { email } = await request.json()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Vérifier quota gestionnaires
  const { data: cabinet } = await admin.from('cabinets').select('max_gestionnaires, plan').eq('id', profile.cabinet_id!).single()
  if (cabinet) {
    const { count } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('cabinet_id', profile.cabinet_id!)
      .in('role', ['owner', 'manager'])

    const maxGest = cabinet.max_gestionnaires ?? 999
    if (maxGest < 999 && (count ?? 0) >= maxGest) {
      return NextResponse.json({
        error: `Limite atteinte : votre plan ${cabinet.plan} autorise ${maxGest} gestionnaire${maxGest > 1 ? 's' : ''}. Passez à un plan supérieur.`,
        code: 'PLAN_LIMIT_REACHED',
      }, { status: 403 })
    }
  }

  // Vérifier si l'email n'est pas déjà dans le cabinet
  const { data: existing } = await admin
    .from('profiles')
    .select('id, cabinet_id')
    .eq('email', email.toLowerCase())
    .single()

  if (existing?.cabinet_id === profile.cabinet_id) {
    return NextResponse.json({ error: 'Cet utilisateur est déjà dans votre équipe' }, { status: 400 })
  }

  // Inviter via Supabase Auth (envoie un magic link par email)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email.toLowerCase(),
    {
      redirectTo: `${appUrl}/dashboard`,
      data: {
        role: 'manager',
        cabinet_id: profile.cabinet_id,
      },
    }
  )

  if (inviteError) {
    // User might already exist in auth but not in our cabinet
    console.error('Invite error:', inviteError)
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  // Pre-create profile so they're linked to the cabinet on first login
  if (invited?.user) {
    await admin.from('profiles').upsert({
      id: invited.user.id,
      email: email.toLowerCase(),
      role: 'manager',
      cabinet_id: profile.cabinet_id,
      langue: 'fr',
      notifications_push: true,
      onboarding_complete: true,
    }, { onConflict: 'id' })
  }

  return NextResponse.json({ success: true, email })
}

// DELETE — retirer un gestionnaire
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('cabinet_id, role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return NextResponse.json({ error: 'Seul le propriétaire peut retirer des membres' }, { status: 403 })
  }

  const { memberId } = await request.json()
  if (!memberId || memberId === user.id) {
    return NextResponse.json({ error: 'Action non permise' }, { status: 400 })
  }

  const admin = createAdminClient()
  await admin.from('profiles').update({ cabinet_id: null, role: 'manager' }).eq('id', memberId).eq('cabinet_id', profile.cabinet_id!)

  return NextResponse.json({ success: true })
}
