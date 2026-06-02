-- ════════════════════════════════════════════════════════════════
-- COPLIO — Portail Locataire
-- Ajoute le rôle `tenant`, le lien propriétaire→locataire, la
-- visibilité documents locataires, la messagerie locataire, et les
-- policies RLS minimales (défense en profondeur).
--
-- ⚠️ Sécurité : le locataire a cabinet_id = NULL → il N'HÉRITE PAS
-- des policies larges `cabinet_id = get_user_cabinet_id()`.
-- Ses lectures passent par des requêtes server-side scopées au lot,
-- + ces policies RLS étroites en filet de sécurité.
-- ════════════════════════════════════════════════════════════════

-- 1. Enum : nouveau rôle (doit être committé séparément avant usage)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'tenant';

-- 2. profiles : lien locataire → propriétaire
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS landlord_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. documents : visibilité locataires (miroir de visible_coproprietaires)
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS visible_locataires boolean DEFAULT false;

-- 4. conversations : support messagerie locataire
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE conversations
  ALTER COLUMN coproprietaire_id DROP NOT NULL;

-- 5. RLS — policies tenant (défense en profondeur)

-- profiles : un tenant lit son propre profil (déjà couvert par
-- profiles_select_same_cabinet via id = auth.uid()) — rien à ajouter.

-- sinistres : un tenant voit les sinistres de SON lot
DROP POLICY IF EXISTS sinistres_tenant_select ON sinistres;
CREATE POLICY sinistres_tenant_select ON sinistres
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'tenant'
        AND p.lot_id = ANY (sinistres.lots_concernes)
    )
  );

-- documents : un tenant voit les docs visible_locataires de SA copropriété
DROP POLICY IF EXISTS documents_tenant_select ON documents;
CREATE POLICY documents_tenant_select ON documents
  FOR SELECT TO authenticated
  USING (
    visible_locataires = true
    AND EXISTS (
      SELECT 1 FROM profiles p
      JOIN lots l ON l.id = p.lot_id
      WHERE p.id = auth.uid()
        AND p.role = 'tenant'
        AND l.copropriete_id = documents.copropriete_id
    )
  );

-- conversations : un tenant accède à SES conversations
DROP POLICY IF EXISTS conversations_tenant ON conversations;
CREATE POLICY conversations_tenant ON conversations
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- NB : pas de policy RLS tenant sur `lots` / `coproprietes`.
-- Une policy coproprietes→lots crée une RÉCURSION INFINIE avec la policy
-- lots→coproprietes existante (et casse appels_charges). Le nom du
-- lot/copropriété pour l'affichage est donc récupéré côté serveur via le
-- client admin (scopé au lot du locataire), pas via RLS.

-- ── Durcissement RLS : exclure les locataires des données sensibles ──
-- Ces policies préexistantes filtraient par `lot_id = mon lot_id` SANS
-- vérifier le rôle. Le locataire partageant le lot_id du propriétaire,
-- il pouvait lire charges/votes. On exige désormais role = 'owner_resident'.
DROP POLICY IF EXISTS "appels_charges_copropriétaire" ON appels_charges;
CREATE POLICY "appels_charges_copropriétaire" ON appels_charges
  FOR SELECT TO public
  USING (lot_id = (SELECT profiles.lot_id FROM profiles
                   WHERE profiles.id = auth.uid() AND profiles.role = 'owner_resident'));

DROP POLICY IF EXISTS ag_votes_own ON ag_votes;
CREATE POLICY ag_votes_own ON ag_votes
  FOR ALL TO public
  USING (lot_id = (SELECT profiles.lot_id FROM profiles
                   WHERE profiles.id = auth.uid() AND profiles.role = 'owner_resident'
                     AND profiles.lot_id IS NOT NULL LIMIT 1))
  WITH CHECK (lot_id = (SELECT profiles.lot_id FROM profiles
                        WHERE profiles.id = auth.uid() AND profiles.role = 'owner_resident'
                          AND profiles.lot_id IS NOT NULL LIMIT 1));

-- messages : un tenant accède aux messages de SES conversations
DROP POLICY IF EXISTS messages_tenant ON messages;
CREATE POLICY messages_tenant ON messages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND c.tenant_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND c.tenant_id = auth.uid()
    )
  );

-- Messagerie privée locataire ↔ propriétaire — le SYNDIC n'y a PAS accès.
-- 1) cabinet_id nullable : les fils locataire ont cabinet_id NULL → la policy
--    conversations_cabinet du syndic (cabinet_id = get_user_cabinet_id()) ne matche pas.
ALTER TABLE conversations ALTER COLUMN cabinet_id DROP NOT NULL;
UPDATE conversations SET cabinet_id = NULL WHERE tenant_id IS NOT NULL;

-- 2) is_my_tenant() : SECURITY DEFINER pour que le propriétaire vérifie le lien
--    sans être bloqué par la RLS de profiles (le locataire a cabinet_id NULL).
CREATE OR REPLACE FUNCTION is_my_tenant(p_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_tenant_id AND landlord_id = auth.uid() AND role = 'tenant'
  )
$$;

-- 3) Le propriétaire accède aux conversations + messages de SON locataire
DROP POLICY IF EXISTS conversations_landlord ON conversations;
CREATE POLICY conversations_landlord ON conversations
  FOR ALL TO authenticated
  USING (is_my_tenant(tenant_id))
  WITH CHECK (is_my_tenant(tenant_id));

DROP POLICY IF EXISTS messages_landlord ON messages;
CREATE POLICY messages_landlord ON messages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations c
                 WHERE c.id = messages.conversation_id AND is_my_tenant(c.tenant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM conversations c
                      WHERE c.id = messages.conversation_id AND is_my_tenant(c.tenant_id)));
