-- ─── Ajout notes internes sur les copropriétaires ───────────
ALTER TABLE coproprietaires
  ADD COLUMN IF NOT EXISTS notes_internes TEXT;
