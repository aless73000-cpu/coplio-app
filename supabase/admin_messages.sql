-- Tables pour le portail admin Coplio
-- À exécuter dans Supabase > SQL Editor

CREATE TABLE IF NOT EXISTS admin_support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabinet_id UUID REFERENCES cabinets(id) ON DELETE CASCADE,
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('client', 'admin')),
  sender_email VARCHAR(255) NOT NULL,
  contenu TEXT NOT NULL,
  lu BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_internal_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_email VARCHAR(255) NOT NULL,
  contenu TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_cabinet ON admin_support_messages(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created ON admin_support_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_internal_messages_created ON admin_internal_messages(created_at);
