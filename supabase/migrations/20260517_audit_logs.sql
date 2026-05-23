-- Audit trail / historique des actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  cabinet_id  uuid        NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  user_id     uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  action      text        NOT NULL,        -- 'create' | 'update' | 'delete' | 'send' | 'pay' | 'invite' | 'login'
  entite      text        NOT NULL,        -- 'copropriete' | 'appel_charges' | 'sinistre' | 'ag' | ...
  entite_id   text,                        -- ID de l'entité concernée
  entite_nom  text,                        -- Nom lisible de l'entité
  metadata    jsonb,                       -- Données contextuelles (montant, statut, etc.)
  created_at  timestamptz DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_audit_logs_cabinet    ON audit_logs(cabinet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user       ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entite     ON audit_logs(entite);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Les membres d'un cabinet peuvent lire les logs de leur cabinet
CREATE POLICY "audit_logs_read" ON audit_logs
  FOR SELECT
  USING (
    cabinet_id IN (
      SELECT cabinet_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Seule la service role peut écrire (les inserts se font via API server-side)
-- Les policies d'insert via service_role sont autorisées par défaut
