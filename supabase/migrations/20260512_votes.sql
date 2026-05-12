-- ════════════════════════════════════════════
-- VOTES (AG / consultations copropriétaires)
-- ════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copropriete_id UUID NOT NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT,
  date_debut TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_fin TIMESTAMPTZ NOT NULL,
  statut TEXT NOT NULL DEFAULT 'ouvert' CHECK (statut IN ('brouillon','ouvert','clos')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vote_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id UUID NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  ordre INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS vote_reponses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id UUID NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES vote_options(id) ON DELETE CASCADE,
  coproprietaire_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (vote_id, coproprietaire_id)
);

-- RLS
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_reponses ENABLE ROW LEVEL SECURITY;

-- Syndic : CRUD sur ses votes
CREATE POLICY "syndic_votes" ON votes FOR ALL USING (cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid() AND cabinet_id IS NOT NULL));

-- Copropriétaire : lecture des votes de sa copropriété
CREATE POLICY "owner_votes_select" ON votes FOR SELECT USING (copropriete_id IN (SELECT copropriete_id FROM lots WHERE id IN (SELECT lot_id FROM profiles WHERE id = auth.uid() AND lot_id IS NOT NULL)));

-- Options : lisibles par tous ceux qui voient le vote
CREATE POLICY "vote_options_select" ON vote_options FOR SELECT USING (vote_id IN (SELECT id FROM votes));
CREATE POLICY "syndic_vote_options" ON vote_options FOR ALL USING (vote_id IN (SELECT id FROM votes WHERE cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid() AND cabinet_id IS NOT NULL)));

-- Réponses : le copropriétaire voit/gère ses propres réponses
CREATE POLICY "owner_reponses" ON vote_reponses FOR ALL USING (coproprietaire_id = auth.uid());

-- Syndic voit toutes les réponses de ses votes
CREATE POLICY "syndic_reponses_select" ON vote_reponses FOR SELECT USING (vote_id IN (SELECT id FROM votes WHERE cabinet_id IN (SELECT cabinet_id FROM profiles WHERE id = auth.uid() AND cabinet_id IS NOT NULL)));
