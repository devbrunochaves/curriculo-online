-- ============================================================
-- FASE 2B — PREPARAÇÃO MULTI-TENANT: CASA, VEÍCULOS E DOCUMENTOS
--
-- Adiciona workspace_id (NULLABLE) às tabelas ROOT dos domínios:
--   Apartamento (9 tabelas), Veículos (1 tabela), Documentos (1 tabela)
--
-- REGRAS DESTA MIGRATION:
--   ✅ ADD COLUMN workspace_id UUID NULL
--   ✅ FOREIGN KEY para public.workspaces(id) ON DELETE RESTRICT
--   ✅ Índices simples em workspace_id para cada ROOT
--   ❌ Sem backfill (workspace_id fica NULL nos registros existentes)
--   ❌ Sem NOT NULL
--   ❌ Sem alteração de RLS
--   ❌ Sem criação de dados ou workspaces
--   ❌ Sem alteração de frontend, storage ou auth
--
-- ──────────────────────────────────────────────────────────────
-- CLASSIFICAÇÃO
-- ──────────────────────────────────────────────────────────────
--
-- TENANT ROOT (workspace_id explícito):
--   apartamento_boletos, apartamento_documentos, apartamento_fotos,
--   apartamento_garantias, apartamento_gastos, apartamento_inventario,
--   apartamento_manutencoes, apartamento_prestadores, apartamento_projetos,
--   veiculos, documentos
--
-- TENANT CHILD (workspace derivado via FK do pai — sem workspace_id):
--   veiculos_abastecimentos  → veiculo_id → veiculos.workspace_id
--   veiculos_documentos      → veiculo_id → veiculos.workspace_id
--   veiculos_fotos           → veiculo_id → veiculos.workspace_id
--   veiculos_gastos          → veiculo_id → veiculos.workspace_id
--   veiculos_manutencoes     → veiculo_id → veiculos.workspace_id
--   veiculos_seguros         → veiculo_id → veiculos.workspace_id
--   documentos_arquivos      → documento_id → documentos.workspace_id
--
-- ON DELETE RESTRICT em todos: dados patrimoniais e pessoais não
--   devem ser removidos em cascata ao excluir workspace acidentalmente.
-- ============================================================


-- ============================================================
-- PARTE 1 — DOMÍNIO APARTAMENTO
--
-- Não existe tabela `apartamentos` no banco.
-- Cada tabela apartamento_* é uma entidade raiz independente —
-- o módulo assume implicitamente "um imóvel por usuário".
-- Todas as 9 tabelas recebem workspace_id diretamente.
-- ============================================================

-- 1.1 APARTAMENTO_BOLETOS
-- Boletos e contas do imóvel. Sem FK para entidade pai.
ALTER TABLE apartamento_boletos
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_apartamento_boletos_workspace_id
  ON apartamento_boletos (workspace_id);


-- 1.2 APARTAMENTO_DOCUMENTOS
-- Documentos físicos/digitais do imóvel (escritura, IPTU etc.).
-- Sem FK para entidade pai.
ALTER TABLE apartamento_documentos
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_apartamento_documentos_workspace_id
  ON apartamento_documentos (workspace_id);


-- 1.3 APARTAMENTO_FOTOS
-- Galeria de fotos do imóvel. Sem FK para entidade pai.
ALTER TABLE apartamento_fotos
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_apartamento_fotos_workspace_id
  ON apartamento_fotos (workspace_id);


-- 1.4 APARTAMENTO_GARANTIAS
-- Garantias de produtos e obras do imóvel. Sem FK para entidade pai.
ALTER TABLE apartamento_garantias
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_apartamento_garantias_workspace_id
  ON apartamento_garantias (workspace_id);


-- 1.5 APARTAMENTO_GASTOS
-- Gastos do imóvel (reforma, móveis etc.). Sem FK para entidade pai.
ALTER TABLE apartamento_gastos
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_apartamento_gastos_workspace_id
  ON apartamento_gastos (workspace_id);


-- 1.6 APARTAMENTO_INVENTARIO
-- Inventário de bens do imóvel. Sem FK para entidade pai.
ALTER TABLE apartamento_inventario
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_apartamento_inventario_workspace_id
  ON apartamento_inventario (workspace_id);


-- 1.7 APARTAMENTO_MANUTENCOES
-- Histórico e agenda de manutenções. Sem FK para entidade pai.
ALTER TABLE apartamento_manutencoes
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_apartamento_manutencoes_workspace_id
  ON apartamento_manutencoes (workspace_id);


-- 1.8 APARTAMENTO_PRESTADORES
-- Agenda de prestadores de serviço. Sem FK para entidade pai.
ALTER TABLE apartamento_prestadores
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_apartamento_prestadores_workspace_id
  ON apartamento_prestadores (workspace_id);


-- 1.9 APARTAMENTO_PROJETOS
-- Projetos e reformas do imóvel. Sem FK para entidade pai.
ALTER TABLE apartamento_projetos
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_apartamento_projetos_workspace_id
  ON apartamento_projetos (workspace_id);


-- ============================================================
-- PARTE 2 — DOMÍNIO VEÍCULOS
--
-- `veiculos` é a única ROOT do domínio.
-- Todas as 6 tabelas filhas possuem FK `veiculo_id → veiculos.id`
-- confirmada nos INSERTs do frontend — workspace derivado via JOIN.
--
-- Tabelas CHILD (não alteradas):
--   veiculos_abastecimentos → veiculo_id → veiculos
--   veiculos_documentos     → veiculo_id → veiculos
--   veiculos_fotos          → veiculo_id → veiculos
--   veiculos_gastos         → veiculo_id → veiculos
--   veiculos_manutencoes    → veiculo_id → veiculos
--   veiculos_seguros        → veiculo_id → veiculos
--
-- RLS futura nas CHILDs usará:
--   EXISTS (
--     SELECT 1 FROM veiculos
--     WHERE veiculos.id = child.veiculo_id
--     AND veiculos.workspace_id = ANY(public.get_my_workspace_ids())
--   )
-- ============================================================

-- 2.1 VEICULOS (ROOT)
ALTER TABLE veiculos
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_veiculos_workspace_id
  ON veiculos (workspace_id);


-- ============================================================
-- PARTE 3 — DOMÍNIO DOCUMENTOS
--
-- `documentos` é ROOT — já possui `user_id` (auth.users).
--   user_id: representa o usuário autenticado que criou o registro.
--   Usado no payload do INSERT e presente na query de seleção.
--   Mantido intacto. workspace_id é adicionado separadamente.
--
-- `documentos_arquivos` é CHILD — possui:
--   documento_id → documentos.id  (confirmado no INSERT do frontend)
--   user_id (mesmo usuário que criou o documento pai)
--   workspace derivado via documento_id → documentos.workspace_id
--
-- RLS futura em documentos_arquivos usará:
--   EXISTS (
--     SELECT 1 FROM documentos
--     WHERE documentos.id = documentos_arquivos.documento_id
--     AND documentos.workspace_id = ANY(public.get_my_workspace_ids())
--   )
--
-- user_id em documentos_arquivos:
--   Representa o uploader do arquivo (pode ser diferente do dono
--   do documento em cenários futuros multi-usuário).
--   Mantido intacto — não removido nem substituído.
-- ============================================================

-- 3.1 DOCUMENTOS (ROOT)
-- Já possui user_id (auth.users) — workspace_id é adicionado separadamente.
ALTER TABLE documentos
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_documentos_workspace_id
  ON documentos (workspace_id);
