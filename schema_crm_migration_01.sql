-- ============================================================
-- CRM BBold — Migração 01
-- Adiciona: instagram, drive_link, contrato_url em crm_clientes
-- Cole no SQL Editor do Supabase e execute
-- ============================================================

ALTER TABLE crm_clientes
  ADD COLUMN IF NOT EXISTS instagram   TEXT,
  ADD COLUMN IF NOT EXISTS drive_link  TEXT,
  ADD COLUMN IF NOT EXISTS contrato_url TEXT;

-- ============================================================
-- STORAGE — Bucket para contratos e arquivos
-- Crie manualmente no Supabase: Storage → New bucket
--   Nome: crm-arquivos
--   Public: SIM (para gerar URLs públicas de visualização)
--
-- Depois execute esta policy para restringir upload a usuários autenticados:
-- ============================================================

-- Policy de upload (insert) apenas para autenticados
CREATE POLICY "crm_arquivos_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'crm-arquivos');

-- Policy de leitura pública (para abrir o PDF no browser)
CREATE POLICY "crm_arquivos_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'crm-arquivos');

-- Policy de delete apenas para autenticados
CREATE POLICY "crm_arquivos_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'crm-arquivos');
