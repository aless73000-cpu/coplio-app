-- Rename accented tables to ASCII names for PostgREST compatibility
ALTER TABLE IF EXISTS "copropriétaires" RENAME TO coproprietaires;
ALTER TABLE IF EXISTS "copropriétaire_lots" RENAME TO coproprietaire_lots;
