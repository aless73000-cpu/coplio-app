-- ════════════════════════════════════════════════════════════════
-- Bug #2 : ag_votes — politique RLS trop permissive
-- La politique "ag_votes_write" autorisait TOUT utilisateur
-- authentifié à lire/écrire tous les votes d'AG.
-- ════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "ag_votes_write" ON ag_votes;

-- Syndic : accès à tous les votes des AGs de son cabinet
CREATE POLICY "ag_votes_syndic" ON ag_votes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ag_resolutions r
      JOIN assemblees_generales ag ON ag.id = r.ag_id
      WHERE r.id = ag_votes.resolution_id
        AND ag.cabinet_id = get_user_cabinet_id()
    )
  );

-- Copropriétaire : accès uniquement à ses propres votes (via coproprietaires.profile_id)
CREATE POLICY "ag_votes_own" ON ag_votes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM coproprietaires c
      WHERE c.id = ag_votes.coproprietaire_id
        AND c.profile_id = auth.uid()
    )
  );


-- ════════════════════════════════════════════════════════════════
-- Bug #3 : vote_reponses — incohérence UUID (audit + Bug #5 fix)
-- Le Bug #5 a corrigé la route pour insérer coproprietaires.id
-- (pas profiles.id/auth.uid). La RLS et la FK doivent suivre.
-- ════════════════════════════════════════════════════════════════

-- Corriger la FK : vote_reponses.coproprietaire_id → coproprietaires(id)
ALTER TABLE vote_reponses
  DROP CONSTRAINT IF EXISTS vote_reponses_coproprietaire_id_fkey;

ALTER TABLE vote_reponses
  ADD CONSTRAINT vote_reponses_coproprietaire_id_fkey
    FOREIGN KEY (coproprietaire_id) REFERENCES coproprietaires(id) ON DELETE CASCADE;

-- Mettre à jour la politique "owner_reponses" pour matcher via profile_id
DROP POLICY IF EXISTS "owner_reponses" ON vote_reponses;

CREATE POLICY "owner_reponses" ON vote_reponses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM coproprietaires c
      WHERE c.id = vote_reponses.coproprietaire_id
        AND c.profile_id = auth.uid()
    )
  );

-- La politique syndic reste inchangée (déjà correcte)
-- "syndic_reponses_select" : vote_id IN (SELECT id FROM votes WHERE cabinet_id = ...)


-- ════════════════════════════════════════════════════════════════
-- Bug #3 (conversations) : note
-- conversations.coproprietaire_id stocke actuellement profiles.id
-- (auth.uid) — cohérent avec le code app. La politique actuelle
-- "coproprietaire_id = auth.uid()" est donc correcte.
-- Aucune modification SQL nécessaire pour ce cas.
-- ════════════════════════════════════════════════════════════════
