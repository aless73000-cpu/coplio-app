import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FacturesHonorairesClient } from '@/components/syndic/FacturesHonorairesClient'

export const metadata = { title: 'Honoraires & facturation' }

export default async function HonorairesPage(
  props: { searchParams: Promise<{ copropriete?: string }> }
) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) redirect('/onboarding')

  const { data: coprops } = await supabase
    .from('coproprietes')
    .select('id, nom')
    .eq('cabinet_id', profile.cabinet_id)
    .order('nom')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/comptabilite" className="text-muted-foreground hover:text-coplio-text">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-coplio-text">Honoraires &amp; facturation</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Émettez vos factures d&apos;honoraires au syndicat (forfait mensuel ou annuel)
          </p>
        </div>
      </div>

      <FacturesHonorairesClient
        coprops={coprops ?? []}
        initialCopropriete={searchParams.copropriete ?? null}
      />
    </div>
  )
}
