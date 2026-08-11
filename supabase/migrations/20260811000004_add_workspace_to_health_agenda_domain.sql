-- ============================================================
-- FASE 2C — PREPARAÇÃO MULTI-TENANT: SAÚDE, AGENDA E ALIMENTAÇÃO
--
-- Adiciona workspace_id (NULLABLE) às tabelas ROOT dos domínios:
--   Saúde (1 tabela ROOT), Agenda (1 tabela ROOT)
--
-- ALIMENTAÇÃO:
--   shopping_items — já preparado na Fase 2A (migration 000002).
--   Cardápio — 100% hardcoded em Cardapio.jsx, sem tabelas no banco.
--   Nenhuma migration necessária neste domínio.
--
-- REGRAS DESTA MIGRATION:
--   ✅ ADD COLUMN workspace_id UUID NULL
--   ✅ FOREIGN KEY para public.workspaces(id) ON DELETE RESTRICT
--   ✅ Índices simples em workspace_id para cada ROOT
--   ❌ Sem backfill
--   ❌ Sem NOT NULL
--   ❌ Sem alteração de RLS
--   ❌ Sem criação de dados ou workspaces
--   ❌ Sem alteração de frontend, storage ou auth
--
-- ──────────────────────────────────────────────────────────────
-- CLASSIFICAÇÃO COMPLETA DOS DOMÍNIOS
-- ──────────────────────────────────────────────────────────────
--
-- DOMÍNIO SAÚDE
--
--   TENANT ROOT (workspace_id explícito):
--     saude_pessoas — entidade raiz, sem user_id, sem FK de pai
--
--   TENANT CHILD (workspace derivado via pessoa_id → saude_pessoas.workspace_id):
--     saude_consultas    — pessoa_id → saude_pessoas.id (confirmado no INSERT)
--     saude_exames       — pessoa_id → saude_pessoas.id (confirmado no INSERT)
--     saude_medicamentos — pessoa_id → saude_pessoas.id (confirmado no INSERT)
--     saude_medicoes     — pessoa_id → saude_pessoas.id (confirmado no INSERT)
--     saude_receitas     — pessoa_id → saude_pessoas.id (confirmado no INSERT)
--     saude_vacinas      — pessoa_id → saude_pessoas.id (confirmado no INSERT)
--     saude_documentos   — pessoa_id → saude_pessoas.id (confirmado no INSERT)
--
--   RLS futura nas CHILDs:
--     EXISTS (
--       SELECT 1 FROM public.saude_pessoas sp
--       WHERE sp.id = child.pessoa_id
--       AND sp.workspace_id = ANY(public.get_my_workspace_ids())
--     )
--
-- DOMÍNIO AGENDA
--
--   TENANT ROOT (workspace_id explícito):
--     agenda_eventos — entidade independente, sem user_id, sem pessoa_id
--
--   Integração Saúde ↔ Agenda:
--     saude_consultas.handleSave() insere um evento em agenda_eventos
--     como efeito colateral (INSERT independente, sem FK entre as tabelas).
--     Não existe agenda_evento_id em saude_consultas.
--     Risco cross-tenant: numa futura fase com workspace filtrado nas
--     queries, o evento criado pela consulta já herdará o workspace do
--     contexto auth.uid() ativo — comportamento correto sem código extra.
--
-- DOMÍNIO ALIMENTAÇÃO
--
--   shopping_items — preparado na Fase 2A (migration 000002).
--     workspace_id UUID NULL já existe.
--     Índice idx_shopping_items_workspace_id já existe.
--     NÃO repetir ADD COLUMN aqui.
--
--   Cardápio — sem tabelas no banco.
--     Cardapio.jsx é totalmente hardcoded:
--       - 4 semanas de refeições (café, almoço, lanche, jantar, ceia)
--       - Dados de "g" (Gabriela) e "b" (Bruno) embutidos em SEMANAS[]
--       - Pesos, porções, plano alimentar do nutricionista — tudo JSX
--       - ListaCompras importado inline como componente
--     Risco para Rafael: quando frontend for migrado, toda a tela atual
--     do Cardápio exibirá o plano alimentar de Bruno e Gabriela para
--     qualquer workspace. Requer uma fase dedicada de migração de UI
--     (pós-backfill) para substituir hardcodes por dados do workspace.
-- ============================================================


-- ============================================================
-- PARTE 1 — DOMÍNIO SAÚDE
--
-- saude_pessoas é a ROOT do domínio.
-- Representa uma pessoa do grupo familiar (Bruno, Gabriela, filho,
-- familiar) — NÃO é auth.users. Pode existir sem login.
-- É independente da tabela `people` (domínio financeiro).
-- Não possui user_id nem FK para entidade pai.
-- Todas as 7 tabelas filhas possuem pessoa_id → saude_pessoas.id
-- confirmado nos INSERTs do frontend.
-- ============================================================

ALTER TABLE saude_pessoas
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_saude_pessoas_workspace_id
  ON saude_pessoas (workspace_id);


-- ============================================================
-- PARTE 2 — DOMÍNIO AGENDA
--
-- agenda_eventos é uma ROOT independente.
-- Não possui user_id nem pessoa_id no payload do INSERT.
-- Pode ser criado diretamente pelo usuário (formulário da Agenda)
-- ou como efeito colateral de uma consulta de Saúde.
-- Nos dois casos, o workspace correto será derivado do contexto
-- do usuário autenticado no momento do INSERT — sem FK adicional.
-- ============================================================

ALTER TABLE agenda_eventos
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_agenda_eventos_workspace_id
  ON agenda_eventos (workspace_id);
