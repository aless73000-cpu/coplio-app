import type { SupabaseClient } from '@supabase/supabase-js'

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'send'
  | 'pay'
  | 'invite'
  | 'login'
  | 'status_change'
  | 'upload'
  | 'export'

export type AuditEntite =
  | 'copropriete'
  | 'lot'
  | 'coproprietaire'
  | 'appel_charges'
  | 'paiement'
  | 'sinistre'
  | 'assemblee'
  | 'document'
  | 'message'
  | 'membre_equipe'
  | 'vote'
  | 'budget'

export interface LogActionParams {
  cabinet_id: string
  user_id: string
  action: AuditAction
  entite: AuditEntite
  entite_id?: string
  entite_nom?: string
  metadata?: Record<string, unknown>
}

/**
 * Enregistre une action dans l'audit trail.
 * Silencieux en cas d'erreur (ne doit jamais bloquer la logique métier).
 */
export async function logAction(
  supabase: SupabaseClient,
  params: LogActionParams
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      cabinet_id: params.cabinet_id,
      user_id:    params.user_id,
      action:     params.action,
      entite:     params.entite,
      entite_id:  params.entite_id ?? null,
      entite_nom: params.entite_nom ?? null,
      metadata:   params.metadata ?? null,
    })
  } catch {
    // Silencieux — l'audit ne doit jamais bloquer une action métier
  }
}

export const ACTION_LABELS: Record<AuditAction, string> = {
  create:        'Création',
  update:        'Modification',
  delete:        'Suppression',
  send:          'Envoi',
  pay:           'Paiement',
  invite:        'Invitation',
  login:         'Connexion',
  status_change: 'Changement de statut',
  upload:        'Upload fichier',
  export:        'Export',
}

export const ENTITE_LABELS: Record<AuditEntite, string> = {
  copropriete:    'Copropriété',
  lot:            'Lot',
  coproprietaire: 'Copropriétaire',
  appel_charges:  'Appel de charges',
  paiement:       'Paiement',
  sinistre:       'Sinistre',
  assemblee:      'Assemblée',
  document:       'Document',
  message:        'Message',
  membre_equipe:  'Membre équipe',
  vote:           'Vote',
  budget:         'Budget',
}
