-- ============================================================
-- CRM BBold — Migração 02
-- Adiciona: campo briefing em crm_entregas + tabela crm_comentarios
-- Cole no SQL Editor do Supabase e execute
-- ============================================================

ALTER TABLE crm_entregas
  ADD COLUMN IF NOT EXISTS briefing TEXT;

CREATE TABLE IF NOT EXISTS crm_comentarios (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entrega_id UUID REFERENCES crm_entregas(id) ON DELETE CASCADE,
  texto      TEXT NOT NULL,
  autor      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crm_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_comentarios_auth"
  ON crm_comentarios FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
