import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '../.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
    .map(([k, ...v]) => [k, v.join('=')])
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const TEST_EMAIL = 'test.copro@coplio.fr'
const TEST_PASSWORD = 'TestCoplio2024!'

async function main() {
  // 1. Trouver le premier cabinet disponible
  const { data: cabinets } = await supabase.from('cabinets').select('id, nom').limit(1)
  if (!cabinets?.length) { console.error('Aucun cabinet trouvé'); process.exit(1) }
  const cabinet = cabinets[0]
  console.log(`Cabinet trouvé : ${cabinet.nom} (${cabinet.id})`)

  // 2. Créer ou récupérer l'utilisateur auth
  let userId
  const { data: existing } = await supabase.auth.admin.listUsers()
  const existingUser = existing?.users?.find(u => u.email === TEST_EMAIL)

  if (existingUser) {
    userId = existingUser.id
    // Mettre à jour le mot de passe
    await supabase.auth.admin.updateUserById(userId, { password: TEST_PASSWORD })
    console.log(`Utilisateur existant mis à jour : ${userId}`)
  } else {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { prenom: 'Jean', nom: 'Dupont', role: 'owner_resident' }
    })
    if (error) { console.error('Erreur création user:', error); process.exit(1) }
    userId = created.user.id
    console.log(`Utilisateur créé : ${userId}`)
  }

  // 3. Créer le profil si inexistant
  const { data: profileExist } = await supabase.from('profiles').select('id').eq('id', userId).single()
  if (!profileExist) {
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      email: TEST_EMAIL,
      prenom: 'Jean',
      nom: 'Dupont',
      role: 'owner_resident',
      cabinet_id: cabinet.id,
    })
    if (error) console.error('Erreur profil:', error)
    else console.log('Profil créé')
  } else {
    console.log('Profil déjà existant')
  }

  // 4. Créer le copropriétaire si inexistant
  const { data: croExist } = await supabase.from('coproprietaires').select('id').eq('email', TEST_EMAIL).single()
  if (!croExist) {
    const { error } = await supabase.from('coproprietaires').insert({
      cabinet_id: cabinet.id,
      prenom: 'Jean',
      nom: 'Dupont',
      email: TEST_EMAIL,
      portail_actif: true,
    })
    if (error) console.error('Erreur coproprietaire:', error)
    else console.log('Copropriétaire créé')
  } else {
    console.log('Copropriétaire déjà existant')
  }

  console.log('\n✅ Compte test prêt :')
  console.log(`   Email    : ${TEST_EMAIL}`)
  console.log(`   Mot de passe : ${TEST_PASSWORD}`)
  console.log(`   URL      : https://coplio.fr/portail`)
}

main().catch(console.error)
