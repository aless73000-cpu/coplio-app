import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Couche d'accès « entité comptable » — refactor compta générique.
 *
 * Pendant la transition (migrations M1→M4 appliquées, M5 cutover pas encore
 * joué), `copropriete_id` ET `entite_comptable_id` coexistent. Ce helper
 * permet de migrer le code progressivement, route par route :
 *
 *   AVANT :  .eq('copropriete_id', coproprieteId)
 *   APRÈS :  .eq('entite_comptable_id', await getEntiteComptableIdForCopropriete(supabase, coproprieteId))
 *
 * ⚠️ Après application des migrations, régénérer les types :
 *      npx supabase gen types typescript ...
 *    puis retirer le cast `asUntyped` ci-dessous (les colonnes/tables
 *    `entite_comptable_id`, `entites_comptables`, `mandats_gestion`
 *    seront alors connues du type `Database`).
 */

export type TiersType = 'coproprietaire' | 'locataire' | 'proprietaire' | 'fournisseur'

export type TypeEntiteComptable = 'copropriete' | 'mandat_gestion'

export interface Tiers {
  tiers_type: TiersType
  tiers_id: string
}

/** Cast localisé tant que les types Supabase ne sont pas régénérés. */
function asUntyped(supabase: SupabaseClient<Database>): SupabaseClient {
  return supabase as unknown as SupabaseClient
}

/**
 * Résout l'entité comptable d'une copropriété.
 * @throws si la copropriété est introuvable ou sans entité (backfill M1 manquant).
 */
export async function getEntiteComptableIdForCopropriete(
  supabase: SupabaseClient<Database>,
  coproprieteId: string,
): Promise<string> {
  const { data, error } = await asUntyped(supabase)
    .from('coproprietes')
    .select('entite_comptable_id')
    .eq('id', coproprieteId)
    .single()

  if (error || !data?.entite_comptable_id) {
    throw new Error(
      `Entité comptable introuvable pour la copropriété ${coproprieteId} ` +
        `(migration M1 appliquée ?).`,
    )
  }
  return data.entite_comptable_id as string
}

/** Résout l'entité comptable d'un mandat de gestion. */
export async function getEntiteComptableIdForMandat(
  supabase: SupabaseClient<Database>,
  mandatId: string,
): Promise<string> {
  const { data, error } = await asUntyped(supabase)
    .from('mandats_gestion')
    .select('entite_comptable_id')
    .eq('id', mandatId)
    .single()

  if (error || !data?.entite_comptable_id) {
    throw new Error(`Entité comptable introuvable pour le mandat ${mandatId}.`)
  }
  return data.entite_comptable_id as string
}

/**
 * Vérifie qu'une entité comptable appartient bien au cabinet courant.
 * À utiliser comme garde d'isolation (équivalent du check copro → cabinet_id).
 */
export async function assertEntiteDansCabinet(
  supabase: SupabaseClient<Database>,
  entiteComptableId: string,
  cabinetId: string,
): Promise<boolean> {
  const { data } = await asUntyped(supabase)
    .from('entites_comptables')
    .select('id')
    .eq('id', entiteComptableId)
    .eq('cabinet_id', cabinetId)
    .single()

  return Boolean(data)
}
