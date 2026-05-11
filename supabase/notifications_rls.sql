-- Activer RLS sur la table notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent lire leurs propres notifications
CREATE POLICY IF NOT EXISTS "users_read_own_notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres notifications (marquer comme lu)
CREATE POLICY IF NOT EXISTS "users_update_own_notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Le service role peut insérer des notifications (pour les API routes)
CREATE POLICY IF NOT EXISTS "service_insert_notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Ajouter la table notifications au realtime de Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
