import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isConfigured } from '@/lib/docuseal'
import { withErrorHandler } from '@/lib/api-handler'

export const GET = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  return NextResponse.json({
    docuseal_configured: isConfigured(),
    // Rétrocompatibilité frontend si d'autres endroits lisent encore yousign_configured
    yousign_configured: false,
  })
})