-- ═══════════════════════════════════════════════════════════════
-- FIX BUGS CRITIQUES RLS — Coplio
-- À exécuter dans Supabase Dashboard → SQL Editor
-- Bugs corrigés :
--   #2 : ag_votes permettait à tout utilisateur de modifier tous les votes
--   #3 : conversations.coproprietaire_id comparé à auth.uid() (UUIDs différents)
-- ═══════════════════════════════════════════════════════════════

-- ── Bug #2 : RLS ag_votes ──────────────────────────────────────
-- ag_votes.resolution_id → ag_resolutions.ag_id → assemblees_generales → coproprietes
DROP POLICY IF EXISTS "ag_votes_write" ON ag_votes;

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

-- ── Bug #3 : RLS conversations ─────────────────────────────────
-- Ancienne policy incorrecte : coproprietaire_id = auth.uid()
-- coproprietaire_id référence coproprietaires.id ≠ profiles.id (auth.uid())
-- Fix : jointure via coproprietaire_lots → profiles.lot_id

DROP POLICY IF EXISTS "conversations_cabinet" ON conversations;

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
