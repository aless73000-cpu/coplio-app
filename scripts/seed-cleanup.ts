/**
 * COPLIO — Nettoyage des données de démo (seed-demo-full)
 * Supprime le cabinet "demo@coplio.fr" (cascade : copros, lots, appels,
 * copropriétaires, AG, sinistres, docs, prestataires, etc.) + les comptes
 * auth associés (demo@coplio.fr et tous les *@horizon-demo.fr).
 *
 * Usage : npx tsx scripts/seed-cleanup.ts
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variables manquantes. Usage :\n  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-cleanup.ts')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

async function main() {
  console.log('\n🧹 Nettoyage des données de démo\n')

  // 1. Cabinet demo → cascade
  const { data: cab } = await db.from('cabinets').select('id').eq('email_contact', 'demo@coplio.fr').maybeSingle()
  if (cab?.id) {
    const { error } = await db.from('cabinets').delete().eq('id', cab.id)
    if (error) throw new Error(`delete cabinet: ${error.message}`)
    console.log(`  ✓ Cabinet ${cab.id} supprimé (cascade copros/lots/appels/…)`)
  } else {
    console.log('  • Aucun cabinet demo@coplio.fr trouvé')
  }

  // 2. Comptes auth : demo@coplio.fr + *@horizon-demo.fr
  let deleted = 0, page = 1
  for (;;) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(`listUsers: ${error.message}`)
    const targets = data.users.filter(u => u.email === 'demo@coplio.fr' || (u.email?.endsWith('@horizon-demo.fr')))
    for (const u of targets) {
      const { error: delErr } = await db.auth.admin.deleteUser(u.id)
      if (delErr) console.log(`  ⚠ échec suppression ${u.email}: ${delErr.message}`)
      else deleted++
    }
    if (data.users.length < 1000) break
    page++
  }
  console.log(`  ✓ ${deleted} comptes auth supprimés`)
  console.log('\n✅ Nettoyage terminé\n')
}

main().catch(e => { console.error('\n❌ ERREUR:', e.message); process.exit(1) })
