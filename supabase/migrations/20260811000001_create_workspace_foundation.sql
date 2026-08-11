-- ============================================================
-- FASE 1 — FOUNDATION MULTI-TENANT
-- Cria workspaces e workspace_members.
-- Não altera nenhuma tabela existente.
-- Não insere dados. Nenhum workspace criado aqui.
-- ============================================================


-- ============================================================
-- 1. WORKSPACES
--
-- owner_user_id: FK direta para auth.users — identifica o dono
--   do workspace mesmo que workspace_members esteja vazio.
--   Comportamento de delete: RESTRICT — impede exclusão de um
--   usuário de auth enquanto ele ainda possuir workspaces.
--   Razão: evitar workspaces órfãos silenciosamente.
--
-- updated_at: workspace pode ter nome alterado no futuro.
--   Sem trigger automático (projeto não usa triggers);
--   a aplicação define updated_at = now() nos UPDATEs.
-- ============================================================

CREATE TABLE IF NOT EXISTS workspaces (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT        NOT NULL,
  owner_user_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 2. WORKSPACE_MEMBERS
--
-- PK composta (workspace_id, user_id): semanticamente correto
--   (a identidade é o par workspace+usuário); sem UUID
--   extra — nenhuma outra tabela referencia workspace_members.id.
--   A PK já garante UNIQUE(workspace_id, user_id).
--
-- role: CHECK constraint em vez de ENUM PostgreSQL.
--   Razão: CHECK é mais fácil de alterar posteriormente
--   (apenas DROP + ADD CONSTRAINT); ENUM exige ALTER TYPE.
--   Valores: 'owner' | 'admin' | 'member'.
--
-- workspace_id ON DELETE CASCADE: se o workspace for
--   excluído, todos os membros são removidos automaticamente.
--
-- user_id ON DELETE CASCADE: se o usuário auth for excluído,
--   todos os seus vínculos de membership são removidos.
--   Razão: preferível a deixar rows órfãs sem dono.
-- ============================================================

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id  UUID  NOT NULL REFERENCES workspaces(id)  ON DELETE CASCADE,
  user_id       UUID  NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  role          TEXT  NOT NULL DEFAULT 'member'
                        CHECK (role IN ('owner', 'admin', 'member')),
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);


-- ============================================================
-- 3. ÍNDICES
--
-- O PK (workspace_id, user_id) já cria índice cobrindo
--   workspace_id-first queries.
-- Adicionamos índice separado em user_id para queries do tipo:
--   "quais workspaces o usuário X pertence?"
--   Usado pelas funções helper e pelas policies de RLS.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id
  ON workspace_members (user_id);


-- ============================================================
-- 4. FUNÇÕES HELPER (SECURITY DEFINER)
--
-- PROBLEMA DE RLS SEM HELPER:
--   workspace_select policy → subquery em workspace_members
--   members_insert policy → subquery em workspaces (via workspace_select)
--   = recursão entre as duas policies.
--
-- PROBLEMA DE BOOTSTRAP:
--   Ao criar workspace + primeiro membro (owner):
--   members_insert verifica se workspace é do usuário via workspaces,
--   mas workspace_select exige que usuário já esteja em workspace_members.
--   Owner ainda não foi inserido → INSERT falha.
--
-- SOLUÇÃO: duas funções SECURITY DEFINER que acessam as tabelas
--   diretamente sem aplicar RLS, mas restritas ao auth.uid() atual.
--   Colocadas no schema public (não auth).
--   SET search_path = '' com nomes totalmente qualificados:
--   garante imunidade a ataques de substituição de search_path.
-- ============================================================

-- Retorna UUIDs de todos os workspaces do usuário logado.
-- Usada na policy workspace_select.
CREATE OR REPLACE FUNCTION public.get_my_workspace_ids()
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT ARRAY(
    SELECT workspace_id
    FROM public.workspace_members
    WHERE user_id = auth.uid()
  )
$$;

-- Retorna true se o usuário logado é owner do workspace informado.
-- Usada nas policies de workspace_members (INSERT, UPDATE, DELETE).
CREATE OR REPLACE FUNCTION public.is_workspace_owner(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspaces
    WHERE id = p_workspace_id
      AND owner_user_id = auth.uid()
  )
$$;


-- ============================================================
-- 5. RLS — WORKSPACES
-- ============================================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- SELECT: membro vê apenas workspaces dos quais faz parte.
-- get_my_workspace_ids() bypassa RLS em workspace_members → sem recursão.
CREATE POLICY "workspace_select" ON workspaces
  FOR SELECT TO authenticated
  USING (id = ANY(public.get_my_workspace_ids()));

-- INSERT: qualquer autenticado cria workspace;
-- owner_user_id deve ser o próprio usuário que está inserindo.
CREATE POLICY "workspace_insert" ON workspaces
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

-- UPDATE: somente o owner pode alterar dados do workspace.
CREATE POLICY "workspace_update" ON workspaces
  FOR UPDATE TO authenticated
  USING  (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- DELETE: somente o owner pode excluir o workspace.
CREATE POLICY "workspace_delete" ON workspaces
  FOR DELETE TO authenticated
  USING (owner_user_id = auth.uid());


-- ============================================================
-- 6. RLS — WORKSPACE_MEMBERS
-- ============================================================

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- SELECT: cada usuário vê somente sua própria linha.
-- Razão: policy simples e terminal — não causa recursão.
-- Para listar membros de um workspace (função de admin/UI),
-- isso será expandido na Fase 6 com uma RPC ou policy adicional.
CREATE POLICY "members_select_own" ON workspace_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- INSERT: somente o owner do workspace pode adicionar membros.
-- is_workspace_owner() bypassa RLS em workspaces → sem bootstrap problem.
-- Isso permite que o owner adicione a si mesmo como primeiro membro.
CREATE POLICY "members_insert" ON workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_owner(workspace_id));

-- UPDATE: somente o owner pode alterar roles de membros.
-- Previne que um 'member' promova a si mesmo para 'owner'.
CREATE POLICY "members_update" ON workspace_members
  FOR UPDATE TO authenticated
  USING  (public.is_workspace_owner(workspace_id))
  WITH CHECK (public.is_workspace_owner(workspace_id));

-- DELETE: owner pode remover qualquer membro;
-- qualquer membro pode sair do próprio workspace.
CREATE POLICY "members_delete" ON workspace_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_workspace_owner(workspace_id)
  );
