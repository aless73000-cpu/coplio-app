-- ═══════════════════════════════════════════════════════════
-- FIX RLS — Coplio
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Fonctions helper
CREATE OR REPLACE FUNCTION get_user_cabinet_id()
RETURNS UUID AS $$
  SELECT cabinet_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 2. Supprimer les anciennes policies (évite les doublons)
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies
    WHERE tablename IN (
      'cabinets','profiles','coproprietes','lots','coproprietaires',
      'coproprietaire_lots','appels_charges','documents','sinistres',
      'sinistre_etapes','sinistre_devis','assemblees_generales',
      'ag_resolutions','ag_votes','conversations','messages',
      'notifications','relances','relance_parametres'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 3. CABINETS
CREATE POLICY "cabinet_select_own" ON cabinets
  FOR SELECT USING (id = get_user_cabinet_id());

CREATE POLICY "cabinet_update_owner" ON cabinets
  FOR UPDATE USING (id = get_user_cabinet_id());

-- 4. PROFILES
CREATE POLICY "profiles_select_same_cabinet" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR cabinet_id = get_user_cabinet_id()
  );

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- 5. COPROPRIETES
CREATE POLICY "coproprietes_select" ON coproprietes
  FOR SELECT USING (cabinet_id = get_user_cabinet_id());

CREATE POLICY "coproprietes_insert" ON coproprietes
  FOR INSERT WITH CHECK (cabinet_id = get_user_cabinet_id());

CREATE POLICY "coproprietes_update" ON coproprietes
  FOR UPDATE USING (cabinet_id = get_user_cabinet_id());

CREATE POLICY "coproprietes_delete" ON coproprietes
  FOR DELETE USING (cabinet_id = get_user_cabinet_id());

-- 6. LOTS
CREATE POLICY "lots_select" ON lots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coproprietes c
      WHERE c.id = lots.copropriete_id AND (
        c.cabinet_id = get_user_cabinet_id()
        OR lots.id = (SELECT lot_id FROM profiles WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "lots_write" ON lots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM coproprietes c
      WHERE c.id = lots.copropriete_id AND c.cabinet_id = get_user_cabinet_id()
    )
  );

-- 7. COPROPRIETAIRES
CREATE POLICY "coproprietaires_select" ON coproprietaires
  FOR SELECT USING (cabinet_id = get_user_cabinet_id());

CREATE POLICY "coproprietaires_write" ON coproprietaires
  FOR ALL USING (cabinet_id = get_user_cabinet_id());

-- 8. COPROPRIETAIRE_LOTS
CREATE POLICY "coproprietaire_lots_select" ON coproprietaire_lots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coproprietaires c
      WHERE c.id = coproprietaire_lots.coproprietaire_id
        AND c.cabinet_id = get_user_cabinet_id()
    )
  );

CREATE POLICY "coproprietaire_lots_write" ON coproprietaire_lots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM coproprietaires c
      WHERE c.id = coproprietaire_lots.coproprietaire_id
        AND c.cabinet_id = get_user_cabinet_id()
    )
  );

-- 9. APPELS_CHARGES
CREATE POLICY "appels_charges_cabinet" ON appels_charges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM coproprietes c
      WHERE c.id = appels_charges.copropriete_id
        AND c.cabinet_id = get_user_cabinet_id()
    )
  );

CREATE POLICY "appels_charges_copropriétaire" ON appels_charges
  FOR SELECT USING (
    lot_id = (SELECT lot_id FROM profiles WHERE id = auth.uid())
  );

-- 10. DOCUMENTS
CREATE POLICY "documents_select" ON documents
  FOR SELECT USING (
    cabinet_id = get_user_cabinet_id()
    OR (
      visible_coproprietaires = TRUE
      AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'owner_resident'
          AND (documents.lot_id IS NULL OR documents.lot_id = p.lot_id)
      )
    )
  );

CREATE POLICY "documents_write" ON documents
  FOR ALL USING (cabinet_id = get_user_cabinet_id());

-- 11. SINISTRES
CREATE POLICY "sinistres_cabinet" ON sinistres
  FOR ALL USING (cabinet_id = get_user_cabinet_id());

CREATE POLICY "sinistres_copropriétaire_select" ON sinistres
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'owner_resident'
        AND p.lot_id = ANY(sinistres.lots_concernes)
    )
  );

-- 12. SINISTRE_ETAPES / DEVIS
CREATE POLICY "sinistre_etapes_cabinet" ON sinistre_etapes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sinistres s
      WHERE s.id = sinistre_etapes.sinistre_id
        AND s.cabinet_id = get_user_cabinet_id()
    )
  );

CREATE POLICY "sinistre_devis_cabinet" ON sinistre_devis
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sinistres s
      WHERE s.id = sinistre_devis.sinistre_id
        AND s.cabinet_id = get_user_cabinet_id()
    )
  );

-- 13. ASSEMBLEES_GENERALES
CREATE POLICY "ag_cabinet" ON assemblees_generales
  FOR ALL USING (cabinet_id = get_user_cabinet_id());

CREATE POLICY "ag_copropriétaire_select" ON assemblees_generales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN lots l ON l.id = p.lot_id
      WHERE p.id = auth.uid()
        AND p.role = 'owner_resident'
        AND l.copropriete_id = assemblees_generales.copropriete_id
    )
  );

-- 14. AG_RESOLUTIONS & VOTES
CREATE POLICY "ag_resolutions_cabinet" ON ag_resolutions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assemblees_generales ag
      WHERE ag.id = ag_resolutions.ag_id
        AND ag.cabinet_id = get_user_cabinet_id()
    )
  );

-- BUG #2 FIX : isolation par cabinet via jointure sur assemblees_generales
-- Ancienne policy incorrecte : USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()))
-- → permettait à tout utilisateur connecté de modifier n'importe quel vote
CREATE POLICY "ag_votes_write" ON ag_votes
  FOR ALL USING (
    -- Gestionnaire syndic : accès via son cabinet
    EXISTS (
      SELECT 1 FROM ag_resolutions r
      JOIN assemblees_generales ag ON ag.id = r.ag_id
      JOIN coproprietes c ON c.id = ag.copropriete_id
      WHERE r.id = ag_votes.resolution_id
        AND c.cabinet_id = get_user_cabinet_id()
    )
    OR
    -- Copropriétaire : peut voir/créer son propre vote (via son lot)
    EXISTS (
      SELECT 1 FROM ag_resolutions r
      JOIN assemblees_generales ag ON ag.id = r.ag_id
      JOIN lots l ON l.copropriete_id = ag.copropriete_id
      JOIN profiles p ON p.lot_id = l.id
      WHERE r.id = ag_votes.resolution_id
        AND p.id = auth.uid()
        AND p.role = 'owner_resident'
    )
  );

-- 15. CONVERSATIONS & MESSAGES
-- BUG #3 FIX : coproprietaire_id référence coproprietaires.id (≠ auth.uid() = profiles.id)
-- On passe par coproprietaire_lots → profiles.lot_id pour trouver le bon copropriétaire
CREATE POLICY "conversations_cabinet" ON conversations
  FOR ALL USING (
    -- Gestionnaire syndic
    cabinet_id = get_user_cabinet_id()
    OR
    -- Copropriétaire : via son lot → coproprietaire_lots → coproprietaire_id
    EXISTS (
      SELECT 1 FROM coproprietaire_lots cl
      JOIN profiles p ON p.lot_id = cl.lot_id
      WHERE cl.coproprietaire_id = conversations.coproprietaire_id
        AND p.id = auth.uid()
        AND p.role = 'owner_resident'
    )
  );

CREATE POLICY "messages_access" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.cabinet_id = get_user_cabinet_id() OR c.coproprietaire_id = auth.uid())
    )
  );

-- 16. NOTIFICATIONS
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- 17. RELANCES
CREATE POLICY "relances_cabinet" ON relances
  FOR ALL USING (cabinet_id = get_user_cabinet_id());

-- relance_parametres : accès via copropriete_id
CREATE POLICY "relance_parametres_access" ON relance_parametres
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM coproprietes c
      WHERE c.id = relance_parametres.copropriete_id
        AND c.cabinet_id = get_user_cabinet_id()
    )
  );
