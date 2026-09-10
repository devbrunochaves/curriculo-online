-- ============================================================
-- MEI MODULE — Schema completo
-- Tabelas: mei_profiles, mei_limites, mei_notas, mei_das,
--          mei_declaracoes, mei_documentos
--
-- Regras:
--   · workspace_id NOT NULL em todas as tabelas de dados
--   · RLS via get_my_workspace_ids() (sem USING (true))
--   · Proteção cross-tenant: INSERT em filhas valida mei_id
--   · mei_limites é global (defaults por ano, sem workspace)
--   · Sem backfill — tabelas nascem vazias
-- ============================================================


-- ============================================================
-- 1. MEI_PROFILES
-- Um registro por workspace (UNIQUE workspace_id).
-- Root de toda a hierarquia MEI.
-- ============================================================

CREATE TABLE IF NOT EXISTS mei_profiles (
  id                  UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id        UUID        NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  cnpj                TEXT,
  razao_social        TEXT        NOT NULL,
  nome_fantasia       TEXT,
  data_abertura       DATE,
  tipo_atividade      TEXT        NOT NULL DEFAULT 'servicos'
                        CHECK (tipo_atividade IN ('servicos','comercio','industria','misto')),
  inscricao_municipal TEXT,
  observacoes         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mei_profiles_workspace_unique UNIQUE (workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_mei_profiles_workspace ON mei_profiles(workspace_id);


-- ============================================================
-- 2. MEI_LIMITES
-- Limites anuais oficiais do MEI.
-- Tabela global (sem workspace_id) — valores padrão por ano.
-- ============================================================

CREATE TABLE IF NOT EXISTS mei_limites (
  id         UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ano        INTEGER       NOT NULL UNIQUE,
  limite     NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

INSERT INTO mei_limites (ano, limite) VALUES
  (2023, 81000.00),
  (2024, 81000.00),
  (2025, 81000.00),
  (2026, 81000.00),
  (2027, 81000.00),
  (2028, 81000.00)
ON CONFLICT (ano) DO NOTHING;


-- ============================================================
-- 3. MEI_NOTAS
-- Notas fiscais emitidas pelo MEI.
-- ============================================================

CREATE TABLE IF NOT EXISTS mei_notas (
  id                UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id      UUID          NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  mei_id            UUID          NOT NULL REFERENCES mei_profiles(id) ON DELETE CASCADE,
  numero            TEXT,
  data_emissao      DATE          NOT NULL,
  competencia       TEXT          NOT NULL,
  cliente_nome      TEXT,
  cliente_documento TEXT,
  descricao         TEXT,
  valor             NUMERIC(14,2) NOT NULL DEFAULT 0,
  tipo_receita      TEXT          NOT NULL DEFAULT 'servicos'
                      CHECK (tipo_receita IN ('servicos','comercio')),
  status            TEXT          NOT NULL DEFAULT 'emitida'
                      CHECK (status IN ('emitida','cancelada')),
  recebida          BOOLEAN       NOT NULL DEFAULT FALSE,
  data_recebimento  DATE,
  arquivo_path      TEXT,
  xml_path          TEXT,
  observacoes       TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mei_notas_workspace    ON mei_notas(workspace_id);
CREATE INDEX IF NOT EXISTS idx_mei_notas_mei_id       ON mei_notas(mei_id);
CREATE INDEX IF NOT EXISTS idx_mei_notas_competencia  ON mei_notas(competencia);
CREATE INDEX IF NOT EXISTS idx_mei_notas_data_emissao ON mei_notas(data_emissao);


-- ============================================================
-- 4. MEI_DAS
-- Guias de pagamento mensais do MEI.
-- ============================================================

CREATE TABLE IF NOT EXISTS mei_das (
  id               UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id     UUID          NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  mei_id           UUID          NOT NULL REFERENCES mei_profiles(id) ON DELETE CASCADE,
  competencia      TEXT          NOT NULL,
  valor            NUMERIC(14,2) NOT NULL DEFAULT 0,
  vencimento       DATE,
  status           TEXT          NOT NULL DEFAULT 'pendente'
                     CHECK (status IN ('pendente','pago','atrasado')),
  data_pagamento   DATE,
  guia_path        TEXT,
  comprovante_path TEXT,
  observacoes      TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mei_das_workspace  ON mei_das(workspace_id);
CREATE INDEX IF NOT EXISTS idx_mei_das_mei_id     ON mei_das(mei_id);
CREATE INDEX IF NOT EXISTS idx_mei_das_vencimento ON mei_das(vencimento);
CREATE INDEX IF NOT EXISTS idx_mei_das_status     ON mei_das(status);


-- ============================================================
-- 5. MEI_DECLARACOES
-- Declaração Anual do MEI (DASN-SIMEI), uma por ano.
-- ============================================================

CREATE TABLE IF NOT EXISTS mei_declaracoes (
  id               UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id     UUID          NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  mei_id           UUID          NOT NULL REFERENCES mei_profiles(id) ON DELETE CASCADE,
  ano              INTEGER       NOT NULL,
  receita_servicos NUMERIC(14,2) NOT NULL DEFAULT 0,
  receita_comercio NUMERIC(14,2) NOT NULL DEFAULT 0,
  receita_total    NUMERIC(14,2) NOT NULL DEFAULT 0,
  teve_funcionario BOOLEAN       NOT NULL DEFAULT FALSE,
  status           TEXT          NOT NULL DEFAULT 'nao_enviada'
                     CHECK (status IN ('nao_enviada','enviada')),
  data_entrega     DATE,
  declaracao_path  TEXT,
  recibo_path      TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT mei_declaracoes_unique UNIQUE (mei_id, ano)
);

CREATE INDEX IF NOT EXISTS idx_mei_declaracoes_workspace ON mei_declaracoes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_mei_declaracoes_mei_id    ON mei_declaracoes(mei_id);


-- ============================================================
-- 6. MEI_DOCUMENTOS
-- Documentos gerais do MEI (CCMEI, CNPJ, DAS, recibos, etc.)
-- ============================================================

CREATE TABLE IF NOT EXISTS mei_documentos (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id   UUID        NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  mei_id         UUID        NOT NULL REFERENCES mei_profiles(id) ON DELETE CASCADE,
  nome           TEXT        NOT NULL,
  categoria      TEXT        NOT NULL DEFAULT 'outros'
                   CHECK (categoria IN ('empresa','impostos','declaracoes','outros')),
  descricao      TEXT,
  data_documento DATE,
  arquivo_path   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mei_documentos_workspace ON mei_documentos(workspace_id);
CREATE INDEX IF NOT EXISTS idx_mei_documentos_mei_id    ON mei_documentos(mei_id);
CREATE INDEX IF NOT EXISTS idx_mei_documentos_categoria ON mei_documentos(categoria);


-- ============================================================
-- HELPER: is_my_mei(p_mei_id)
-- Criado APÓS as tabelas para que o PostgreSQL consiga validar
-- a referência a public.mei_profiles na função STABLE.
-- Retorna true se o mei_id pertence a um workspace do usuário.
-- Usado nas policies INSERT das tabelas filhas para bloquear
-- cenário: workspace_id = meu workspace + mei_id = outro workspace.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_my_mei(p_mei_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mei_profiles
    WHERE id = p_mei_id
      AND workspace_id = ANY(public.get_my_workspace_ids())
  )
$$;


-- ============================================================
-- RLS + POLICIES
-- Habilitado em todas as tabelas.
-- ============================================================

ALTER TABLE mei_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE mei_limites     ENABLE ROW LEVEL SECURITY;
ALTER TABLE mei_notas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mei_das         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mei_declaracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mei_documentos  ENABLE ROW LEVEL SECURITY;


-- mei_profiles
CREATE POLICY "mei_profiles_select" ON mei_profiles
  FOR SELECT TO authenticated
  USING (workspace_id = ANY(public.get_my_workspace_ids()));

CREATE POLICY "mei_profiles_insert" ON mei_profiles
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id = ANY(public.get_my_workspace_ids()));

CREATE POLICY "mei_profiles_update" ON mei_profiles
  FOR UPDATE TO authenticated
  USING  (workspace_id = ANY(public.get_my_workspace_ids()))
  WITH CHECK (workspace_id = ANY(public.get_my_workspace_ids()));

CREATE POLICY "mei_profiles_delete" ON mei_profiles
  FOR DELETE TO authenticated
  USING (workspace_id = ANY(public.get_my_workspace_ids()));


-- mei_limites (leitura livre para autenticados — valores oficiais públicos)
CREATE POLICY "mei_limites_select" ON mei_limites
  FOR SELECT TO authenticated
  USING (true);


-- mei_notas
CREATE POLICY "mei_notas_select" ON mei_notas
  FOR SELECT TO authenticated
  USING (workspace_id = ANY(public.get_my_workspace_ids()));

CREATE POLICY "mei_notas_insert" ON mei_notas
  FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id = ANY(public.get_my_workspace_ids())
    AND public.is_my_mei(mei_id)
  );

CREATE POLICY "mei_notas_update" ON mei_notas
  FOR UPDATE TO authenticated
  USING  (workspace_id = ANY(public.get_my_workspace_ids()))
  WITH CHECK (
    workspace_id = ANY(public.get_my_workspace_ids())
    AND public.is_my_mei(mei_id)
  );

CREATE POLICY "mei_notas_delete" ON mei_notas
  FOR DELETE TO authenticated
  USING (workspace_id = ANY(public.get_my_workspace_ids()));


-- mei_das
CREATE POLICY "mei_das_select" ON mei_das
  FOR SELECT TO authenticated
  USING (workspace_id = ANY(public.get_my_workspace_ids()));

CREATE POLICY "mei_das_insert" ON mei_das
  FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id = ANY(public.get_my_workspace_ids())
    AND public.is_my_mei(mei_id)
  );

CREATE POLICY "mei_das_update" ON mei_das
  FOR UPDATE TO authenticated
  USING  (workspace_id = ANY(public.get_my_workspace_ids()))
  WITH CHECK (
    workspace_id = ANY(public.get_my_workspace_ids())
    AND public.is_my_mei(mei_id)
  );

CREATE POLICY "mei_das_delete" ON mei_das
  FOR DELETE TO authenticated
  USING (workspace_id = ANY(public.get_my_workspace_ids()));


-- mei_declaracoes
CREATE POLICY "mei_declaracoes_select" ON mei_declaracoes
  FOR SELECT TO authenticated
  USING (workspace_id = ANY(public.get_my_workspace_ids()));

CREATE POLICY "mei_declaracoes_insert" ON mei_declaracoes
  FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id = ANY(public.get_my_workspace_ids())
    AND public.is_my_mei(mei_id)
  );

CREATE POLICY "mei_declaracoes_update" ON mei_declaracoes
  FOR UPDATE TO authenticated
  USING  (workspace_id = ANY(public.get_my_workspace_ids()))
  WITH CHECK (
    workspace_id = ANY(public.get_my_workspace_ids())
    AND public.is_my_mei(mei_id)
  );

CREATE POLICY "mei_declaracoes_delete" ON mei_declaracoes
  FOR DELETE TO authenticated
  USING (workspace_id = ANY(public.get_my_workspace_ids()));


-- mei_documentos
CREATE POLICY "mei_documentos_select" ON mei_documentos
  FOR SELECT TO authenticated
  USING (workspace_id = ANY(public.get_my_workspace_ids()));

CREATE POLICY "mei_documentos_insert" ON mei_documentos
  FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id = ANY(public.get_my_workspace_ids())
    AND public.is_my_mei(mei_id)
  );

CREATE POLICY "mei_documentos_update" ON mei_documentos
  FOR UPDATE TO authenticated
  USING  (workspace_id = ANY(public.get_my_workspace_ids()))
  WITH CHECK (
    workspace_id = ANY(public.get_my_workspace_ids())
    AND public.is_my_mei(mei_id)
  );

CREATE POLICY "mei_documentos_delete" ON mei_documentos
  FOR DELETE TO authenticated
  USING (workspace_id = ANY(public.get_my_workspace_ids()));
