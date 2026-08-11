-- ============================================================
-- FASE 2 — PREPARAÇÃO MULTI-TENANT DO NÚCLEO FINANCEIRO
--
-- Adiciona workspace_id (NULLABLE) às tabelas ROOT do domínio
-- financeiro do módulo /contas.
--
-- REGRAS DESTA MIGRATION:
--   ✅ ADD COLUMN workspace_id UUID NULL
--   ✅ FOREIGN KEY para public.workspaces(id) ON DELETE RESTRICT
--   ✅ Índices em workspace_id para cada tabela ROOT
--   ❌ Sem backfill (dados existentes mantêm workspace_id = NULL)
--   ❌ Sem NOT NULL (nullable intencional nesta fase)
--   ❌ Sem alteração de RLS nas tabelas existentes
--   ❌ Sem criação de workspaces ou dados
--   ❌ Sem alteração de frontend, storage ou auth
--
-- TABELAS ROOT (workspace_id aqui):
--   cards, people, categories, expenses, recurring_bills,
--   income, income_entries, cofrinhos, metas, shopping_items,
--   acertos
--
-- TABELAS CHILD (workspace derivado via FK — sem workspace_id):
--   expense_splits      → expense_id → expenses
--   bill_entries        → bill_id    → recurring_bills
--   bill_entry_splits   → entry_id   → bill_entries → recurring_bills
--   cofrinhos_aportes   → cofrinho_id → cofrinhos
-- ============================================================


-- ============================================================
-- 1. CARDS
-- Cartões de crédito/débito. Entidade raiz independente.
-- Referenciado por: expenses, acertos.
-- ============================================================

ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_cards_workspace_id
  ON cards (workspace_id);


-- ============================================================
-- 2. PEOPLE
-- Pessoas do grupo familiar. Entidade raiz independente.
-- Referenciado por: expense_splits, bill_entry_splits, acertos.
-- ============================================================

ALTER TABLE people
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_people_workspace_id
  ON people (workspace_id);


-- ============================================================
-- 3. CATEGORIES
-- Categorias de despesas. Entidade raiz independente.
-- Referenciado por: expenses, recurring_bills.
-- ============================================================

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_categories_workspace_id
  ON categories (workspace_id);


-- ============================================================
-- 4. EXPENSES
-- Lançamentos de despesas. Entidade raiz financeira principal.
-- Filho workspace deriva de expenses.workspace_id:
--   expense_splits → expense_id → expenses
-- ============================================================

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_expenses_workspace_id
  ON expenses (workspace_id);


-- ============================================================
-- 5. RECURRING_BILLS
-- Templates de contas fixas/recorrentes. Entidade raiz.
-- Filhos derivam de recurring_bills.workspace_id:
--   bill_entries      → bill_id → recurring_bills
--   bill_entry_splits → entry_id → bill_entries → recurring_bills
-- ============================================================

ALTER TABLE recurring_bills
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_recurring_bills_workspace_id
  ON recurring_bills (workspace_id);


-- ============================================================
-- 6. INCOME
-- Receitas mensais (tabela legada do schema.sql).
-- Entidade raiz independente sem filhos.
-- ============================================================

ALTER TABLE income
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_income_workspace_id
  ON income (workspace_id);


-- ============================================================
-- 7. INCOME_ENTRIES
-- Entradas de receita (tabela atual usada em Entradas.jsx).
-- Entidade raiz independente sem filhos.
-- ============================================================

ALTER TABLE income_entries
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_income_entries_workspace_id
  ON income_entries (workspace_id);


-- ============================================================
-- 8. COFRINHOS
-- Metas de poupança. Entidade raiz independente.
-- Filho deriva de cofrinhos.workspace_id:
--   cofrinhos_aportes → cofrinho_id → cofrinhos
-- ============================================================

ALTER TABLE cofrinhos
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_cofrinhos_workspace_id
  ON cofrinhos (workspace_id);


-- ============================================================
-- 9. METAS
-- Metas financeiras gerais. Entidade raiz independente.
-- ============================================================

ALTER TABLE metas
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_metas_workspace_id
  ON metas (workspace_id);


-- ============================================================
-- 10. SHOPPING_ITEMS
-- Itens de lista de compras. Entidade raiz independente.
-- ============================================================

ALTER TABLE shopping_items
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_shopping_items_workspace_id
  ON shopping_items (workspace_id);


-- ============================================================
-- 11. ACERTOS
-- Acertos financeiros entre pessoas. Entidade raiz independente.
-- Já possui user_id (coluna existente, mantida).
-- workspace_id é adicionado para multi-tenancy.
-- ============================================================

ALTER TABLE acertos
  ADD COLUMN IF NOT EXISTS workspace_id UUID NULL
    REFERENCES public.workspaces(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_acertos_workspace_id
  ON acertos (workspace_id);
