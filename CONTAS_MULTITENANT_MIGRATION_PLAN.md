# CONTAS — Plano de Migração Multi-Tenant

**Branch:** `claude/contas-multitenant-discovery`  
**Data:** 2026-08-11  
**Status:** Discovery — nenhuma alteração de código ou banco nesta etapa  
**Objetivo:** transformar o módulo `/contas` de ambiente pessoal único em plataforma multi-tenant isolada por workspace.

---

## SUMÁRIO EXECUTIVO

O módulo `/contas` é hoje um ambiente pessoal de Bruno Chaves. Possui **45 tabelas de banco** e **5 buckets de Storage**. Praticamente nenhuma tabela tem isolamento por usuário — apenas 3 possuem `user_id`. Não há RLS visível. O bucket `receipts` é público. Um novo usuário (Rafael, Diego etc.) teria acesso irrestrito a todos os dados do Bruno caso recebesse as chaves do Supabase.

**Risco atual: CRÍTICO.** A migração é necessária e viável, mas exige cuidado cirúrgico.

---

## PARTE 1 — INVENTÁRIO COMPLETO DO BANCO

### Tabela de Inventário Geral

| # | Tabela | Módulo | user_id? | Isolamento atual | Risco MT |
|---|--------|--------|----------|------------------|----------|
| 1 | `expenses` | Finanças | ❌ | Nenhum | CRÍTICO |
| 2 | `expense_splits` | Finanças | ❌ | FK → expenses | CRÍTICO |
| 3 | `cards` | Finanças | ❌ | Nenhum | CRÍTICO |
| 4 | `categories` | Finanças | ❌ | Nenhum | CRÍTICO |
| 5 | `people` | Global | ❌ | Nenhum | CRÍTICO |
| 6 | `recurring_bills` | Finanças | ❌ | Nenhum | CRÍTICO |
| 7 | `bill_entries` | Finanças | ❌ | FK → recurring_bills | CRÍTICO |
| 8 | `bill_entry_splits` | Finanças | ❌ | FK → bill_entries | CRÍTICO |
| 9 | `income` | Finanças | ❌ | Nenhum | CRÍTICO |
| 10 | `income_entries` | Finanças | ❌ | Nenhum | CRÍTICO |
| 11 | `acertos` | Finanças | ✅ user_id | auth.users | ALTO |
| 12 | `apartamento_boletos` | Apartamento | ❌ | Nenhum | CRÍTICO |
| 13 | `apartamento_documentos` | Apartamento | ❌ | Nenhum | CRÍTICO |
| 14 | `apartamento_fotos` | Apartamento | ❌ | Nenhum | CRÍTICO |
| 15 | `apartamento_garantias` | Apartamento | ❌ | Nenhum | CRÍTICO |
| 16 | `apartamento_gastos` | Apartamento | ❌ | Nenhum | CRÍTICO |
| 17 | `apartamento_inventario` | Apartamento | ❌ | Nenhum | CRÍTICO |
| 18 | `apartamento_manutencoes` | Apartamento | ❌ | Nenhum | CRÍTICO |
| 19 | `apartamento_prestadores` | Apartamento | ❌ | Nenhum | CRÍTICO |
| 20 | `apartamento_projetos` | Apartamento | ❌ | Nenhum | CRÍTICO |
| 21 | `veiculos` | Veículos | ❌ | Nenhum | CRÍTICO |
| 22 | `veiculos_abastecimentos` | Veículos | ❌ | FK → veiculos | CRÍTICO |
| 23 | `veiculos_documentos` | Veículos | ❌ | FK → veiculos | CRÍTICO |
| 24 | `veiculos_fotos` | Veículos | ❌ | FK → veiculos | CRÍTICO |
| 25 | `veiculos_gastos` | Veículos | ❌ | FK → veiculos | CRÍTICO |
| 26 | `veiculos_manutencoes` | Veículos | ❌ | FK → veiculos | CRÍTICO |
| 27 | `veiculos_seguros` | Veículos | ❌ | FK → veiculos | CRÍTICO |
| 28 | `documentos` | Documentos | ✅ user_id | auth.users + pessoa_id | ALTO |
| 29 | `documentos_arquivos` | Documentos | ✅ user_id | auth.users | ALTO |
| 30 | `saude_pessoas` | Saúde | ❌ | Nenhum | CRÍTICO |
| 31 | `saude_consultas` | Saúde | ❌ | FK → saude_pessoas | CRÍTICO |
| 32 | `saude_exames` | Saúde | ❌ | FK → saude_pessoas | CRÍTICO |
| 33 | `saude_medicamentos` | Saúde | ❌ | FK → saude_pessoas | CRÍTICO |
| 34 | `saude_medicoes` | Saúde | ❌ | FK → saude_pessoas | CRÍTICO |
| 35 | `saude_receitas` | Saúde | ❌ | FK → saude_pessoas | CRÍTICO |
| 36 | `saude_vacinas` | Saúde | ❌ | FK → saude_pessoas | CRÍTICO |
| 37 | `saude_documentos` | Saúde | ❌ | FK → saude_pessoas | CRÍTICO |
| 38 | `agenda_eventos` | Agenda | ❌ | Nenhum | CRÍTICO |
| 39 | `shopping_items` | Lista Compras | ❌ | Nenhum | CRÍTICO |
| 40 | `cofrinhos` | Metas | ❌ | Nenhum | CRÍTICO |
| 41 | `cofrinhos_aportes` | Metas | ❌ | FK → cofrinhos | CRÍTICO |
| 42 | `metas` | Metas | ❌ | Nenhum | CRÍTICO |
| 43 | `frases_motivacionais` | Sistema | ❌ | Global intencional | NENHUM |
| 44 | `contas_fixas`* | Finanças | ❌ | Provável view | A verificar |
| 45 | `lista_compras`* | Compras | ❌ | Provável view | A verificar |

> \* `contas_fixas` e `lista_compras` são referenciadas apenas em `MeuDia.jsx` com colunas diferentes das tabelas `recurring_bills` e `shopping_items`. Provavelmente são views do Supabase a confirmar no DB.

**Resumo de isolamento:**
- Tabelas com `user_id` (auth.users): 3 (`acertos`, `documentos`, `documentos_arquivos`)
- Tabelas com apenas `pessoa_id` (tabela `people`, não auth): 10+
- Tabelas sem NENHUM isolamento: 39+
- RLS habilitada (schema.sql): 6 tabelas — mas com `USING (true)` (OPEN: qualquer autenticado lê/escreve tudo)
- RLS habilitada com isolamento real: 0 tabelas

> **Descoberta crítica (schema.sql):** As 6 tabelas com RLS ativa (`cards`, `people`, `categories`, `expenses`, `expense_splits`, `income`) possuem a política `"Authenticated full access" FOR ALL TO authenticated USING (true) WITH CHECK (true)`. Isso **não é isolamento** — é apenas autenticação mínima. Qualquer usuário logado acessa 100% dos dados de todos os outros usuários. As 39 tabelas restantes não têm nem isso.

### Detalhamento das Tabelas Principais

#### `expenses` (despesas)
- **Objetivo:** registro de gastos e compras
- **Colunas inferidas:** `id, description, total_amount, month_ref, date, card_id, category_id, reconciled, receipt_url, installments, installment_number, splits`
- **FK:** `card_id → cards.id`, `category_id → categories.id`
- **Isolamento:** nenhum
- **`user_id`:** ❌
- **Tipo:** Pessoal
- **Risco MT:** Qualquer usuário lê/escreve todas as despesas de todos

#### `people` (pessoas)
- **Objetivo:** pessoas do doméstico (Bruno, Gabriela, etc.) para rateio de contas e documentos
- **Colunas inferidas:** `id, name, color, is_active`
- **FK:** nenhuma (é referenciada por muitas)
- **Isolamento:** nenhum
- **`user_id`:** ❌
- **Tipo:** Familiar/Pessoal
- **Risco MT:** Rafael veria todas as pessoas do Bruno; inserções conflitam no mesmo namespace

#### `cards` (cartões)
- **Objetivo:** cartões de crédito/débito usados nas despesas
- **Colunas inferidas:** `id, name, color, is_active`
- **Isolamento:** nenhum
- **`user_id`:** ❌
- **Tipo:** Pessoal
- **Risco MT:** CRÍTICO — cartões do Bruno visíveis a qualquer usuário

#### `categories`
- **Objetivo:** categorias de despesas
- **Colunas inferidas:** `id, name, icon, color`
- **Isolamento:** nenhum
- **`user_id`:** ❌
- **Tipo:** Ambíguo — pode ser global ou pessoal
- **Risco MT:** Se forem pessoais, conflito grave. Se forem globais, compartilhar é OK.

#### `recurring_bills` (contas fixas)
- **Objetivo:** contas com vencimento recorrente (aluguel, luz, etc.)
- **Colunas inferidas:** `id, name, default_amount, due_day, category_id, person_id, is_active, total_installments, start_month, notes`
- **FK:** `person_id → people.id`, `category_id → categories.id`
- **Isolamento:** nenhum
- **`user_id`:** ❌
- **Tipo:** Pessoal
- **Risco MT:** CRÍTICO

#### `acertos`
- **Objetivo:** registro de acertos financeiros entre pessoas
- **Colunas inferidas:** `id, user_id, pessoa_id, card_id, bill_entry_id, valor, data, mes_ref, observacao`
- **FK:** `user_id → auth.users.id`, `pessoa_id → people.id`, `card_id → cards.id`
- **Isolamento:** ✅ `user_id` presente e usado no insert
- **`user_id`:** ✅
- **Tipo:** Pessoal
- **Risco MT:** ALTO — tem user_id mas provavelmente sem RLS aplicada. Migração: mapear user_id para workspace_id.

#### `documentos`
- **Objetivo:** documentos pessoais e familiares
- **Colunas inferidas:** `id, nome, categoria, tipo, numero, orgao_emissor, data_emissao, data_validade, pessoa_id, observacoes, tags, favorito, user_id, updated_at`
- **FK:** `user_id → auth.users.id`, `pessoa_id → people.id`
- **Isolamento:** ✅ `user_id` inserido no payload
- **`user_id`:** ✅
- **Tipo:** Pessoal
- **Risco MT:** ALTO — tem user_id mas sem confirmação de RLS

#### `veiculos`
- **Objetivo:** registro de veículos
- **Colunas inferidas:** `id, marca, modelo, ano, placa, cor, apelido, foto_path, km_atual, created_at`
- **Isolamento:** nenhum
- **`user_id`:** ❌
- **Tipo:** Pessoal
- **Risco MT:** CRÍTICO — veículos de todos visíveis a qualquer usuário

#### `saude_pessoas`
- **Objetivo:** perfis de saúde (Bruno, Gabriela, etc.)
- **Colunas inferidas:** `id, nome, data_nasc, sexo, tipo_sanguineo, altura, peso, foto_path`
- **Isolamento:** nenhum
- **`user_id`:** ❌
- **Tipo:** Familiar/Pessoal
- **Risco MT:** CRÍTICO — dados de saúde são altamente sensíveis

#### `agenda_eventos`
- **Objetivo:** eventos pessoais e familiares
- **Colunas inferidas:** `id, titulo, data_inicio, hora_inicio, data_fim, hora_fim, categoria, local, notas, cor, updated_at`
- **Isolamento:** nenhum
- **`user_id`:** ❌
- **Tipo:** Pessoal
- **Risco MT:** CRÍTICO

#### `frases_motivacionais`
- **Objetivo:** frases exibidas no Meu Dia (conteúdo do produto, não pessoal)
- **Colunas inferidas:** `id, texto, ativo`
- **Isolamento:** não necessário
- **Tipo:** Global do sistema
- **Risco MT:** NENHUM — pode ser compartilhada entre workspaces

---

## PARTE 2 — MAPA DE RELACIONAMENTOS

```
auth.users
    │
    ├─→ acertos (user_id) ──────────────────────→ people (pessoa_id)
    │                                              │
    ├─→ documentos (user_id) ──────────────────→ people (pessoa_id)
    │   └─→ documentos_arquivos (user_id, documento_id)
    │
    └─→ [Todos os outros módulos SEM user_id]

people
    ├─→ recurring_bills (person_id)
    │   └─→ bill_entries
    │       └─→ bill_entry_splits (person_id)
    ├─→ expense_splits (person_id)
    │   └─→ expenses ──→ cards, categories
    ├─→ documentos (pessoa_id)
    ├─→ saude_consultas (pessoa_id)
    ├─→ saude_exames (pessoa_id)
    ├─→ saude_medicamentos (pessoa_id)
    ├─→ saude_medicoes (pessoa_id)
    ├─→ saude_receitas (pessoa_id)
    ├─→ saude_vacinas (pessoa_id)
    └─→ saude_documentos (pessoa_id)

veiculos
    ├─→ veiculos_abastecimentos (veiculo_id)
    ├─→ veiculos_documentos (veiculo_id)
    ├─→ veiculos_fotos (veiculo_id)
    ├─→ veiculos_gastos (veiculo_id)
    ├─→ veiculos_manutencoes (veiculo_id)
    └─→ veiculos_seguros (veiculo_id)

saude_pessoas
    ├─→ saude_consultas (pessoa_id)
    ├─→ saude_exames (pessoa_id)
    ├─→ saude_medicamentos (pessoa_id)
    ├─→ saude_medicoes (pessoa_id)
    ├─→ saude_receitas (pessoa_id)
    ├─→ saude_vacinas (pessoa_id)
    └─→ saude_documentos (pessoa_id)

cofrinhos
    └─→ cofrinhos_aportes (cofrinho_id)

[Tabelas sem relacionamentos para FK de dados do usuário]
    agenda_eventos           (standalone, nenhuma FK de dono)
    apartamento_*            (standalone, nenhuma FK de dono)
    shopping_items           (standalone)
    metas                    (standalone)
    income / income_entries  (standalone)
    frases_motivacionais     (standalone, global)
```

**Cascades identificados (inferidos):**
- `veiculos` delete → cascata para todos `veiculos_*` (prático, não confirmado no DB)
- `documentos` delete → frontend remove `documentos_arquivos` manualmente antes de deletar
- `cofrinhos` delete → frontend não faz cascade explícito — risco de orfãos em `cofrinhos_aportes`
- `recurring_bills` delete → frontend deleta `bill_entry_splits` e `bill_entries` antes

**Registros órfãos possíveis:**
- `cofrinhos_aportes` sem `cofrinhos` correspondente (se delete não tiver cascade no DB)
- `expense_splits` se `expenses` for deletado sem cascade
- `bill_entry_splits` sem `bill_entries`

---

## PARTE 3 — STORAGE

### Buckets encontrados

| Bucket | Módulo | Tipo | Signed URL? | Path inclui user_id? | Risco |
|--------|--------|------|-------------|----------------------|-------|
| `apartamento` | Apartamento | Privado | ✅ | ✅ `{user.id}/{folder}/{ts}.{ext}` | MÉDIO |
| `documentos` | Documentos | Privado | ✅ | ✅ `{user.id}/{docId}/{ts}_{nome}` | MÉDIO |
| `saude` | Saúde | Privado | ✅ | ❌ `{folder}/{ts}_{random}.{ext}` | ALTO |
| `veiculos` | Veículos | Privado | ✅ | ❌ `{folder}/{ts}_{random}.{ext}` | ALTO |
| `receipts` | Nova Compra | **PÚBLICO** | ❌ (getPublicUrl) | ❌ `{expenseId}/comprovante.{ext}` | **CRÍTICO** |

### Análise de Cada Bucket

#### `apartamento`
- Constante `BKT = 'apartamento'` em `Apartamento.jsx`
- Path: `${user.id}/${folder}/${Date.now()}.${ext}` — tem isolamento por user_id ✅
- Download: `createSignedUrl(path, 3600)` ✅
- Upload/Delete: autenticado ✅
- Risco MT: o path já inclui user_id, mas sem RLS no bucket, usuário autenticado consegue assinar URL para path de outro usuário conhecendo o path

#### `documentos`
- Usado em `Documentos.jsx`
- Path: `${user.id}/${docId}/${timestamp}_{sanitize(filename)}` — tem user_id ✅
- Download: `createSignedUrl(path, 3600)` ✅
- Upload adicional (add-arq): `${user.id}/${doc.id}/${ts}_{nome}` ✅
- Risco MT: similar ao `apartamento` — path tem user_id mas sem RLS de bucket não há barreira de servidor

#### `saude`
- Usado em `Saude.jsx`
- Path: `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}` — **SEM user_id no path** ❌
- Download: `createSignedUrl(path, 3600)` ✅
- Risco MT: ALTO — qualquer usuário autenticado pode fazer upload para o mesmo namespace flat; path colide entre usuários; dados de saúde são sensíveis

#### `veiculos`
- Usado em `Veiculos.jsx`
- Path: `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}` — **SEM user_id** ❌
- Download: `createSignedUrl(path, 3600)` ✅
- Risco MT: ALTO — mesmo problema de namespace flat

#### `receipts` — CRÍTICO
- Usado em `NovaCompra.jsx`
- Path: `${expenseId}/comprovante.${ext}` — sem user_id, sem isolamento
- **Usa `getPublicUrl()` — bucket PÚBLICO** ❌❌
- Qualquer pessoa com a URL consegue ver o comprovante sem autenticação
- Violação direta da regra: *"não deixar os arquivos públicos no Supabase Storage"*
- Risco MT: CRÍTICO — comprovantes de despesas pessoais expostos publicamente

### Padrão de Path Futuro

Para isolamento correto em ambiente multi-tenant, o padrão deve ser:

```
workspaces/{workspace_id}/{módulo}/{subpath}

Exemplos:
workspaces/{wid}/apartamento/fotos/{ts}.jpg
workspaces/{wid}/saude/{pessoa_id}/exames/{ts}.pdf
workspaces/{wid}/veiculos/{veiculo_id}/fotos/{ts}.jpg
workspaces/{wid}/documentos/{doc_id}/{ts}_{nome}
workspaces/{wid}/receipts/{expense_id}/comprovante.pdf
```

Políticas de bucket devem validar que `workspace_id` no path pertence ao usuário autenticado via `workspace_members`.

---

## PARTE 4 — AUTH

### Fluxo Atual

```
Usuário → /contas/login
    ↓
Login.jsx: supabase.auth.signInWithPassword({ email, password })
    ↓
ContasApp.jsx: supabase.auth.getSession() → setSession(session)
    ↓
supabase.auth.onAuthStateChange → atualiza session em tempo real
    ↓
ProtectedRoute: se !session → redirect /contas/login
    ↓
session.user disponível para todos os componentes via prop drilling
```

### Mapeamento Auth

| Pergunta | Resposta |
|----------|----------|
| Como sabe quem está logado? | `supabase.auth.getSession()` → `session.user` |
| Quais páginas usam `user.id`? | `Acertos.jsx`, `Documentos.jsx`, `Apartamento.jsx`, `MeuDia.jsx`, `Configuracoes.jsx` |
| Onde existe `auth.uid()` no DB? | Não confirmado — não há migrations com RLS visíveis |
| Onde existe `user.email`? | `Layout.jsx` (exibe email), `Configuracoes.jsx` (lê e exibe) |
| Onde existe metadata? | `MeuDia.jsx` (lê `full_name`), `Configuracoes.jsx` (edita `full_name`) |
| Como é criado novo usuário? | Supabase Dashboard (manual) — não há self-signup |
| O que acontece no primeiro login? | Dashboard carrega — não há onboarding |
| Existe profile automático? | ❌ — profile é apenas `user_metadata.full_name` no auth |
| Existe trigger de profile? | ❌ — nenhum trigger visível no código |
| Assumption de usuário único? | ✅ SIM — fortemente assumido |

### RLS Atual — Descoberta Crítica

Arquivo `schema.sql` (raiz do projeto) define RLS apenas para 6 tabelas financeiras:

```sql
-- RLS habilitada:
ALTER TABLE cards          ENABLE ROW LEVEL SECURITY;
ALTER TABLE people         ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE income         ENABLE ROW LEVEL SECURITY;

-- Política aplicada: OPEN — qualquer autenticado acessa tudo
CREATE POLICY "Authenticated full access" ON cards
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- (mesma política para todas as 6 tabelas)
```

**Interpretação:** RLS está habilitada mas as políticas são abertas (`USING (true)`). O objetivo foi apenas exigir autenticação — não isolar dados por usuário. Para 39 outras tabelas, não há RLS nem no `schema.sql` (podem ter sido criadas diretamente no Supabase Dashboard sem políticas).

**Nenhuma política de Storage** existe para os buckets do módulo contas (`apartamento`, `documentos`, `saude`, `veiculos`, `receipts`).

**Nenhum trigger** existe no projeto.

**Nenhum índice adicional** além de primary keys existe no projeto.

### Evidências de Single-Tenant Assumption

1. **Layout.jsx hardcoda "Bruno Chaves"** em 5 lugares (linhas 186, 208, 231, 262, 293) em vez de usar `session.user.user_metadata?.full_name`
2. **Nenhuma tabela de workspaces ou tenants** existe
3. **Queries sem filtro de owner** — todos os selects pegam todos os dados sem `.eq('user_id', user.id)`
4. **Storage paths** em saúde e veículos sem isolamento por usuário
5. **Cardapio.jsx** é completamente hardcoded para Bruno e Gabriela

---

## PARTE 5 — FRONTEND /CONTAS

### Estrutura de Arquivos

```
src/app/contas/[[...slug]]/page.jsx   ← Next.js entry point (BrowserRouter wrapper)
src/contas/
    ContasApp.jsx                      ← React Router, auth guard, routes
    lib/
        supabase.js                    ← createClient (URL + anon key)
    components/
        Layout.jsx                     ← sidebar, nav, user display
        ui/
            Button.jsx
            ConfirmDialog.jsx
            DropdownMenu.jsx
            EmptyState.jsx
            FormField.jsx
            IconButton.jsx
            MetricCard.jsx
            ModalShell.jsx
            PageHeader.jsx
            SectionCard.jsx
            SelectField.jsx
            Skeleton.jsx
            StatusBadge.jsx
            index.js
    pages/
        Login.jsx          ← signInWithPassword
        MeuDia.jsx         ← dashboard principal (15 queries paralelas)
        Dashboard.jsx      ← financeiro mensal
        NovaCompra.jsx     ← insert expenses + splits + receipt upload
        Lancamentos.jsx    ← list/edit/delete expenses
        Acertos.jsx        ← acertos entre pessoas (tem user_id)
        Entradas.jsx       ← income_entries
        ContasFixas.jsx    ← recurring_bills + bill_entries + splits
        Pessoas.jsx        ← people + expenses por pessoa
        Previsao.jsx       ← income histórico
        Configuracoes.jsx  ← cards, people, categories, income, perfil
        Agenda.jsx         ← agenda_eventos
        Cardapio.jsx       ← HARDCODED (sem Supabase)
        Documentos.jsx     ← documentos + arquivos + storage
        Apartamento.jsx    ← 9 sub-módulos + storage
        Metas.jsx          ← cofrinhos + cofrinhos_aportes + metas
        Veiculos.jsx       ← veiculos + 6 sub-módulos + storage
        Saude.jsx          ← saude_pessoas + 7 sub-módulos + storage
        ListaCompras.jsx   ← shopping_items
    styles/
        contas.css + *-v2.css (tokens, componentes, módulos)
```

### Mapeamento de Páginas

| Página | Tabelas acessadas | user_id usado? | Storage | Risco MT |
|--------|-------------------|----------------|---------|----------|
| `MeuDia` | 15+ tabelas de múltiplos módulos | user_metadata (display) | ❌ | CRÍTICO |
| `Dashboard` | expenses, cards, people, recurring_bills, bill_entries, bill_entry_splits | ❌ | ❌ | CRÍTICO |
| `NovaCompra` | expenses, expense_splits, cards, people, categories | ❌ | receipts (público) | CRÍTICO |
| `Lancamentos` | expenses, cards, people | ❌ | ❌ | CRÍTICO |
| `Acertos` | acertos, expenses, recurring_bills, cards, people | ✅ (insert) | ❌ | ALTO |
| `Entradas` | income_entries | ❌ | ❌ | CRÍTICO |
| `ContasFixas` | recurring_bills, bill_entries, bill_entry_splits, people, categories | ❌ | ❌ | CRÍTICO |
| `Pessoas` | people, expenses, bill_entries, bill_entry_splits | ❌ | ❌ | CRÍTICO |
| `Previsao` | income | ❌ | ❌ | CRÍTICO |
| `Configuracoes` | cards, people, categories, income | ❌ (getUser para display) | ❌ | CRÍTICO |
| `Agenda` | agenda_eventos | ❌ | ❌ | CRÍTICO |
| `Cardapio` | nenhuma | ❌ | ❌ | MÉDIO (hardcoded) |
| `Documentos` | documentos, documentos_arquivos, people | ✅ (insert) | documentos (privado) | ALTO |
| `Apartamento` | 9 tabelas apartamento_* | ✅ (storage path) | apartamento (privado) | ALTO |
| `Metas` | cofrinhos, cofrinhos_aportes, metas | ❌ | ❌ | CRÍTICO |
| `Veiculos` | veiculos + 6 sub-tabelas | ❌ | veiculos (privado, sem user) | CRÍTICO |
| `Saude` | saude_pessoas + 7 sub-tabelas | ❌ | saude (privado, sem user) | CRÍTICO |
| `ListaCompras` | shopping_items | ❌ | ❌ | CRÍTICO |
| `Login` | — | — | — | — |

---

## PARTE 6 — HARDCODES

### Nomes de Pessoas no Código

| Arquivo | Linha | Valor | Tipo | Problema | Ação Futura |
|---------|-------|-------|------|----------|-------------|
| `Layout.jsx` | 186 | `"Bruno Chaves"` | Brand name hardcoded | ✅ SIM — não reflete usuário logado | Substituir por `session.user.user_metadata?.full_name \|\| session.user.email` |
| `Layout.jsx` | 208 | `"Bruno Chaves"` | User name no drawer | ✅ SIM | Idem |
| `Layout.jsx` | 231 | `"Bruno Chaves"` | Mobile kicker | ✅ SIM | Idem |
| `Layout.jsx` | 262 | `"Bruno Chaves"` | Brand name (tablet) | ✅ SIM | Idem |
| `Layout.jsx` | 293 | `"Bruno Chaves"` | User name (tablet) | ✅ SIM | Idem |
| `Cardapio.jsx` | 186 | `"Gabriela e Bruno"` | Descrição da página | ✅ SIM | Página inteira deve ser refeita com dados reais do workspace |
| `Cardapio.jsx` | 203 | `"Gabriela · 1.400 kcal · 62,35 kg"` | Dados de saúde pessoais | ✅ SIM — dado sensível | Usar dados de `saude_pessoas` |
| `Cardapio.jsx` | 204 | `"Bruno · 2.900 kcal · 110 kg"` | Dados de saúde pessoais | ✅ SIM — dado sensível | Usar dados de `saude_pessoas` |
| `Cardapio.jsx` | 289 | `{/* Gabriela */}` | Comentário hardcoded | ✅ SIM | Recriar componente dinâmico |
| `Cardapio.jsx` | 297-300 | labels "Bruno" | Pill hardcoded | ✅ SIM | Idem |
| `Cardapio.jsx` | 321-322 | regras Bruno/Gabriela | Regras nutricionais pessoais | ✅ SIM | Idem |
| `Documentos.jsx` | 217 | `placeholder="Ex: CNH Bruno"` | Placeholder UI | ⚠️ BAIXO — é apenas hint | Mudar para "Ex: CNH" |
| `Cartoes.jsx` | 29 | `placeholder="Ex: Nubank Bruno"` | Placeholder UI | ⚠️ BAIXO | Mudar para "Ex: Nubank" |
| `Configuracoes.jsx` | 121, 153 | `placeholder="Ex: Bruno"`, `"Ex: Nubank Bruno"` | Placeholders | ⚠️ BAIXO | Remover nome pessoal |
| `Saude.jsx` | 286 | `placeholder="Ex: Maria Silva"` | Placeholder genérico | ✅ OK | Sem ação necessária |

### IDs e UUIDs Fixos

Nenhum UUID ou ID fixo encontrado no código frontend.

### Emails Fixos

Nenhum email fixo encontrado. O email é sempre lido de `session.user.email`.

### Dados Mockados

- `Cardapio.jsx` — **toda a página é mock**. Não usa Supabase. Dados de alimentação de Bruno e Gabriela hardcoded diretamente no JSX. Esta é a maior concentração de dados pessoais no código.

---

## PARTE 7 — DADOS PADRÃO VS DADOS PESSOAIS

| Tabela | Classificação | Pode compartilhar? | Ação Multi-Tenant |
|--------|---------------|-------------------|-------------------|
| `frases_motivacionais` | A — Global | ✅ Sim | Sem workspace_id necessário |
| `categories` | B — Padrão opcional | ⚠️ Depende | Separar categorias padrão (sistema) de categorias do usuário; criar workspace_id |
| `people` | C — Dado do usuário | ❌ Nunca | workspace_id obrigatório |
| `cards` | C — Dado do usuário | ❌ Nunca | workspace_id obrigatório |
| `expenses` | C — Dado do usuário | ❌ Nunca | workspace_id obrigatório |
| `expense_splits` | C — Dado do usuário | ❌ Nunca | workspace_id via expenses |
| `recurring_bills` | C — Dado do usuário | ❌ Nunca | workspace_id obrigatório |
| `bill_entries` | C — Dado do usuário | ❌ Nunca | workspace_id via recurring_bills |
| `bill_entry_splits` | C — Dado do usuário | ❌ Nunca | workspace_id via bill_entries |
| `income` | C — Dado do usuário | ❌ Nunca | workspace_id obrigatório |
| `income_entries` | C — Dado do usuário | ❌ Nunca | workspace_id obrigatório |
| `acertos` | C — Dado do usuário | ❌ Nunca | workspace_id (migrar de user_id) |
| `apartamento_*` (9 tabelas) | C — Dado do usuário | ❌ Nunca | workspace_id obrigatório em cada |
| `veiculos` + sub-tabelas (7) | C — Dado do usuário | ❌ Nunca | workspace_id em veiculos (cascata) |
| `documentos` + arquivos | C — Dado do usuário | ❌ Nunca | workspace_id (migrar de user_id) |
| `saude_pessoas` + sub (8) | C — Dado do usuário | ❌ Nunca | workspace_id em saude_pessoas (cascata) |
| `agenda_eventos` | C — Dado do usuário | ❌ Nunca | workspace_id obrigatório |
| `shopping_items` | C — Dado do usuário | ❌ Nunca | workspace_id obrigatório |
| `cofrinhos` + aportes | C — Dado do usuário | ❌ Nunca | workspace_id obrigatório |
| `metas` | C — Dado do usuário | ❌ Nunca | workspace_id obrigatório |
| `lista_compras`* (view) | C — Dado do usuário | ❌ Nunca | workspace_id via tabela base |
| `contas_fixas`* (view) | C — Dado do usuário | ❌ Nunca | workspace_id via tabela base |

**Nota sobre `categories`:** Hoje são todas pessoais (Bruno as criou). No modelo multi-tenant, há duas opções:
- **Opção A:** Categories globais do sistema (todos veem) + Categories do workspace (só o workspace vê). Adicionar coluna `is_system BOOLEAN DEFAULT false`.
- **Opção B:** Workspace_id em categories, novo workspace começa com lista padrão pré-populada. Rafael pode editar/excluir as suas.

Recomendação: **Opção B** — mais flexível, evita conflito de namespace.

---

## PARTE 8 — FLUXO DO NOVO USUÁRIO

### Criação de Rafael (fluxo conceitual)

```
PASSO 1 — Admin cria usuário
    Supabase Dashboard → Authentication → Users → Invite user
    Email: rafael@exemplo.com
    Rafael recebe email com link de acesso

PASSO 2 — Workspace criado automaticamente
    Trigger on auth.users INSERT:
        → INSERT INTO workspaces (name, owner_user_id)
          VALUES ('Workspace Rafael', NEW.id)
        → INSERT INTO workspace_members (workspace_id, user_id, role)
          VALUES (workspace.id, NEW.id, 'owner')

PASSO 3 — Primeiro login de Rafael
    Rafael acessa /contas/login
    Autentica com email + senha temporária
    Sistema detecta primeiro acesso (flag ou workspace vazio)
    Redireciona para /contas/onboarding (futuro)
    OU Dashboard com estado vazio

PASSO 4 — Dashboard de Rafael
    Todas as queries filtram por workspace_id (via RLS ou explícito)
    Rafael vê: 0 despesas, 0 pessoas, 0 cartões, 0 veículos...
    Estado vazio com CTA para configurar

PASSO 5 — Rafael começa cadastros
    Cria suas pessoas (ex: Rafael, cônjuge)
    Cria seus cartões
    Começa a registrar despesas
    Todos os dados salvam com workspace_id de Rafael
```

### Criação de Diego (após Rafael já existir)

Idêntico ao fluxo de Rafael. Cada usuário recebe seu próprio workspace isolado. Os workspaces de Rafael e Diego nunca se cruzam, mesmo que acessem o sistema simultaneamente.

### Estado Vazio vs Bruno

| Módulo | Bruno | Rafael (novo) |
|--------|-------|---------------|
| Pessoas | Bruno, Gabriela | Vazio |
| Cartões | 3+ cartões | Vazio |
| Categorias | Categorias criadas por Bruno | Categorias padrão do sistema (Opção B) |
| Veículos | Carro, moto... | Vazio |
| Saúde | Bruno, Gabriela com histórico | Vazio |
| Apartamento | Endereço, documentos... | Vazio |
| Agenda | Eventos pessoais | Vazio |

---

## PARTE 9 — ONBOARDING

### Fluxo Proposto (sem copiar dados de Bruno)

```
Bem-vindo, Rafael.
Vamos configurar seu espaço.

[Pular tudo e começar]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 1/8 — Seu perfil
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome para exibição: [Rafael Souza]
[Salvar e continuar] [Pular]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 2/8 — Pessoas do seu doméstico
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quem vive com você? (para rateio de contas)
[+ Adicionar pessoa]
[Continuar] [Pular]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 3/8 — Cartões e contas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Adicione seus cartões de crédito/débito
[+ Adicionar cartão]
[Continuar] [Pular]

... e assim por diante para:
PASSO 4 — Contas fixas (aluguel, luz...)
PASSO 5 — Veículos
PASSO 6 — Apartamento/moradia
PASSO 7 — Saúde (perfis de saúde)
PASSO 8 — Pronto! Seu espaço está configurado.
```

**Regras do onboarding:**
- Qualquer etapa pode ser pulada
- Usuário pode voltar ao onboarding em Configurações
- Nenhum dado de outros workspaces é sugerido ou copiado
- Categorias padrão do sistema são pré-carregadas automaticamente (sem necessidade de configurar)

---

## PARTE 10 — MODELOS MULTI-TENANT

### Modelo A — `user_id` em todas as tabelas

```sql
ALTER TABLE expenses ADD COLUMN user_id uuid REFERENCES auth.users(id);
ALTER TABLE cards    ADD COLUMN user_id uuid REFERENCES auth.users(id);
-- etc.
```

**Vantagens:**
- Simples de implementar
- RLS direta: `auth.uid() = user_id`
- Sem tabela nova para criar
- Migração limpa: backfill com `id` do Bruno

**Desvantagens:**
- ❌ Não suporta família compartilhada (Família Bruno → Bruno + Gabriela como usuários separados)
- ❌ Para compartilhar um registro, precisa de lógica adicional (`user_id[] array` ou tabela de permissões)
- ❌ Quando Bruno e Gabriela virarem usuários separados, qual `user_id` vai em cada despesa?
- ❌ Não escala para SaaS (times, organizações)

---

### Modelo B — `workspace_id` em todas as tabelas

```sql
CREATE TABLE workspaces (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE workspace_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id),
  role         text NOT NULL DEFAULT 'member', -- owner | admin | member
  created_at   timestamptz DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

ALTER TABLE expenses ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
ALTER TABLE cards    ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
-- etc.
```

**Vantagens:**
- ✅ Suporta família compartilhada: Gabriela vira usuária com acesso ao workspace de Bruno
- ✅ RLS elegante: `EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = table.workspace_id AND user_id = auth.uid())`
- ✅ Suporta roles (owner, admin, member) para controle de acesso granular
- ✅ Escala para SaaS, times, organizações
- ✅ Compatível com o modelo mental do produto ("espaço de vida familiar")
- ✅ Permite `switchWorkspace` futuramente (Bruno acessa workspace de um projeto separado)

**Desvantagens:**
- ⚠️ Requer 2 tabelas novas
- ⚠️ RLS levemente mais complexa (1 JOIN vs comparação direta)
- ⚠️ Migração requer criar workspace para Bruno primeiro, depois backfill

---

### Modelo C — `household_id` em todas as tabelas

Similar ao Modelo B, mas a entidade central é "domicílio" em vez de "workspace".

**Vantagens:** nomenclatura mais próxima do domínio familiar.

**Desvantagens:**
- Menos flexível que workspace (limita o produto a contexto doméstico)
- `household` sugere moradia compartilhada — e se Rafael e Diego usarem o sistema de forma individual?
- Nomenclatura less standard, mais difícil de manter

---

### Modelo D — Híbrido (Recomendado)

Usar `workspace_id` como entidade técnica, mas com o conceito de produto "Espaço" ou "Ambiente":

```
Para o usuário: "Seu espaço — Bruno Chaves"
Para o DB:      workspace_id = uuid

Para o futuro:  "Família Chaves" = workspace com 2 membros (Bruno + Gabriela)
```

Cada usuário começa com 1 workspace pessoal. Futuramente pode ter múltiplos workspaces ou compartilhar.

---

### Recomendação Final: **MODELO B — workspace_id**

**Justificativa:**

1. **O produto é explicitamente familiar.** Pessoas, Saúde, Agenda, Alimentação e Veículos têm a Gabriela como participante direta. O modelo `user_id` não permite isso sem hacks.

2. **Flexibilidade de crescimento.** Se o produto virar SaaS, `workspace_id` é o padrão da indústria (Notion, Linear, Vercel, etc.). `user_id` não escala.

3. **RLS mais segura.** Com workspace_members como tabela intermediária, o controle de acesso é explícito e auditável. Adicionar ou remover um membro do workspace é uma linha em `workspace_members`, sem necessidade de backfill em outras tabelas.

4. **Roles granulares.** Bruno como `owner`, Gabriela como `member` — ela vê tudo mas não pode deletar o workspace. Diego tem seu próprio workspace independente.

5. **Simplicidade aparente vs real.** `user_id` parece mais simples hoje, mas cria débito técnico alto quando a Gabriela virar usuária.

---

## PARTE 11 — RLS (ESTRATÉGIA FUTURA)

### Política Base (conceitual)

```sql
-- Função helper para obter workspaces do usuário atual
CREATE OR REPLACE FUNCTION auth.workspace_ids()
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT ARRAY(
    SELECT workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
  );
$$;

-- Política padrão para tabelas de dados
-- Exemplo para `expenses`:
CREATE POLICY "workspace isolation" ON expenses
  FOR ALL
  USING (workspace_id = ANY(auth.workspace_ids()))
  WITH CHECK (workspace_id = ANY(auth.workspace_ids()));
```

### Políticas por Tabela (conceitual)

```sql
-- workspaces: owner e membros podem ver. Só owner pode deletar.
CREATE POLICY "select own workspaces" ON workspaces
  FOR SELECT USING (id = ANY(auth.workspace_ids()));

CREATE POLICY "owner only delete" ON workspaces
  FOR DELETE USING (owner_user_id = auth.uid());

-- workspace_members: membros do workspace veem os outros membros
CREATE POLICY "members see members" ON workspace_members
  FOR SELECT USING (workspace_id = ANY(auth.workspace_ids()));

-- owner pode gerenciar membros
CREATE POLICY "owner manages members" ON workspace_members
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = auth.uid()
    )
  );

-- Tabelas de dados (expenses, cards, etc.):
-- RLS simples e uniforme para todas
CREATE POLICY "workspace data isolation" ON expenses
  FOR ALL
  USING (workspace_id = ANY(auth.workspace_ids()))
  WITH CHECK (workspace_id = ANY(auth.workspace_ids()));
```

### Proteção por Role

```sql
-- Apenas owner e admin podem deletar dados permanentemente
CREATE POLICY "admin can delete" ON expenses
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

### RLS para Storage

```sql
-- Política de Storage para bucket 'veiculos'
CREATE POLICY "workspace storage isolation" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'veiculos' AND
    (storage.foldername(name))[1] = 'workspaces' AND
    (storage.foldername(name))[2] = ANY(
      SELECT workspace_id::text FROM workspace_members WHERE user_id = auth.uid()
    )
  );
```

---

## PARTE 12 — MIGRAÇÃO DOS DADOS DO BRUNO

### Princípios

1. **Nunca perder dados.** Toda etapa é aditiva antes de ser restritiva.
2. **Nullable antes de NOT NULL.** `workspace_id` entra como nullable, o backfill preenche, só então vira NOT NULL.
3. **Backfill com validação.** Confirmar contagens antes e depois de cada etapa.
4. **RLS entra por último.** Só ativar RLS quando todos os dados estiverem associados.
5. **Rollback por etapa.** Cada migration é reversível.

### Sequência Segura

```
ETAPA 1 — Criar workspace de Bruno
    INSERT INTO workspaces (name, owner_user_id)
    VALUES ('Espaço Bruno Chaves', '<uuid do Bruno no auth.users>');
    -- Salvar workspace_id gerado

ETAPA 2 — Associar Bruno como owner
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES ('<wid>', '<uid Bruno>', 'owner');

ETAPA 3 — Adicionar workspace_id nullable nas tabelas (em grupos)
    ALTER TABLE expenses        ADD COLUMN workspace_id uuid;
    ALTER TABLE cards           ADD COLUMN workspace_id uuid;
    ALTER TABLE people          ADD COLUMN workspace_id uuid;
    -- ... todas as tabelas sem foreign key obrigatória ainda

ETAPA 4 — Backfill de todos os registros para workspace de Bruno
    UPDATE expenses        SET workspace_id = '<wid>' WHERE workspace_id IS NULL;
    UPDATE cards           SET workspace_id = '<wid>' WHERE workspace_id IS NULL;
    UPDATE people          SET workspace_id = '<wid>' WHERE workspace_id IS NULL;
    -- ... todas as tabelas

ETAPA 5 — Validar contagens
    SELECT COUNT(*) FROM expenses WHERE workspace_id IS NULL; -- deve ser 0
    SELECT COUNT(*) FROM cards    WHERE workspace_id IS NULL; -- deve ser 0
    -- etc.

ETAPA 6 — Adicionar FK e NOT NULL constraint
    ALTER TABLE expenses
      ALTER COLUMN workspace_id SET NOT NULL,
      ADD CONSTRAINT fk_expenses_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id);

ETAPA 7 — Habilitar RLS e criar políticas
    ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "workspace isolation" ON expenses ...;

ETAPA 8 — Testar com usuário Bruno (nada deve quebrar)

ETAPA 9 — Criar Rafael
    INSERT INTO auth.users ... (via Supabase Admin)
    Trigger cria workspace_rafael e workspace_members automaticamente

ETAPA 10 — Rafael loga → vê ambiente vazio
```

### Rollback por Etapa

| Etapa | Rollback |
|-------|---------|
| 1 — Criar workspace | DELETE FROM workspaces WHERE id = '<wid>' |
| 2 — workspace_members | DELETE FROM workspace_members WHERE workspace_id = '<wid>' |
| 3 — ADD COLUMN nullable | ALTER TABLE expenses DROP COLUMN workspace_id |
| 4 — Backfill | UPDATE expenses SET workspace_id = NULL (antes de NOT NULL) |
| 6 — NOT NULL + FK | ALTER TABLE expenses ALTER COLUMN workspace_id DROP NOT NULL; DROP CONSTRAINT |
| 7 — RLS | ALTER TABLE expenses DISABLE ROW LEVEL SECURITY; DROP POLICY |

---

## PARTE 13 — MIGRATIONS PLANEJADAS

**Nota:** nenhuma migration é criada nesta etapa. Apenas planejamento.

```
001_create_workspaces.sql
    CREATE TABLE workspaces
    CREATE TABLE workspace_members
    CREATE FUNCTION auth.workspace_ids()
    CREATE TRIGGER on auth.users INSERT → auto-create workspace

002_add_workspace_id_financeiro.sql
    ALTER TABLE expenses, expense_splits, cards, categories
    ALTER TABLE recurring_bills, bill_entries, bill_entry_splits
    ALTER TABLE income, income_entries, acertos
    -- Todas como nullable inicialmente

003_add_workspace_id_apartamento.sql
    ALTER TABLE apartamento_boletos, apartamento_documentos, apartamento_fotos
    ALTER TABLE apartamento_garantias, apartamento_gastos, apartamento_inventario
    ALTER TABLE apartamento_manutencoes, apartamento_prestadores, apartamento_projetos

004_add_workspace_id_veiculos.sql
    ALTER TABLE veiculos
    -- Sub-tabelas herdam via FK cascade ou necessitam de workspace_id próprio

005_add_workspace_id_documentos.sql
    ALTER TABLE documentos, documentos_arquivos

006_add_workspace_id_saude.sql
    ALTER TABLE saude_pessoas
    -- Sub-tabelas herdam via pessoa_id ou necessitam de workspace_id

007_add_workspace_id_agenda.sql
    ALTER TABLE agenda_eventos

008_add_workspace_id_compras_metas.sql
    ALTER TABLE shopping_items, cofrinhos, cofrinhos_aportes, metas

009_backfill_bruno.sql
    UPDATE todas as tabelas SET workspace_id = '<workspace Bruno>'
    WHERE workspace_id IS NULL;
    Validar contagens.

010_not_null_constraints.sql
    ALTER TABLE expenses ALTER COLUMN workspace_id SET NOT NULL;
    ADD FOREIGN KEY em todas as tabelas
    -- Só rodar após confirmar backfill 100% completo

011_rls_policies.sql
    ENABLE ROW LEVEL SECURITY em todas as tabelas de dados
    CREATE POLICY "workspace isolation" em cada tabela
    ROLES: owner, admin, member

012_storage_policies.sql
    CREATE POLICY para buckets: apartamento, documentos, saude, veiculos
    Migrar receipts para bucket privado com signed URLs

013_fix_receipts_bucket.sql
    Migrar arquivos do bucket público receipts para bucket privado
    UPDATE expenses SET receipt_url = novo_path
    Deletar bucket público receipts
```

---

## PARTE 14 — QUERIES DO FRONTEND (ANTES/DEPOIS)

### Cenário

Se RLS estiver correta, as queries NÃO precisam de `.eq('workspace_id', workspaceId)` explícito — a RLS filtra automaticamente via `auth.uid()`. Porém, recomenda-se incluir o filtro explícito no frontend para:
- Clareza e legibilidade do código
- Redundância de segurança
- Facilidade de debug

**Recomendação:** incluir `workspace_id` explicitamente nas queries, usando `WorkspaceContext`.

### Exemplos Antes/Depois

```js
// ANTES — sem isolamento
const { data } = await supabase
  .from('expenses')
  .select('*')
  .eq('month_ref', monthRef)

// DEPOIS — com workspace_id explícito
const { data } = await supabase
  .from('expenses')
  .select('*')
  .eq('workspace_id', currentWorkspace.id)
  .eq('month_ref', monthRef)
```

```js
// ANTES — insert sem isolamento
await supabase.from('cards').insert({ name, color })

// DEPOIS — insert com workspace_id
await supabase.from('cards').insert({
  name,
  color,
  workspace_id: currentWorkspace.id,
})
```

```js
// ANTES — Storage sem isolamento de workspace
const path = `${folder}/${Date.now()}_${random}.${ext}`
await supabase.storage.from('veiculos').upload(path, file)

// DEPOIS — Storage com path de workspace
const path = `workspaces/${currentWorkspace.id}/veiculos/${folder}/${Date.now()}.${ext}`
await supabase.storage.from('veiculos').upload(path, file)
```

### Impacto de Mudanças

- **45 tabelas** → todas as queries de SELECT precisam de workspace_id ou RLS garante
- **Inserts** em ~40 tabelas precisam incluir `workspace_id`
- **Storage paths** em 4 buckets precisam ser atualizados
- **Queries em MeuDia.jsx** — 15 chamadas paralelas, todas precisam de workspace_id

---

## PARTE 15 — WORKSPACE CONTEXT (FRONTEND)

### Proposta de Provider

```jsx
// src/contas/contexts/WorkspaceContext.jsx

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const WorkspaceContext = createContext(null)

export function WorkspaceProvider({ session, children }) {
  const [workspace, setWorkspace]   = useState(null)
  const [role, setRole]             = useState(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return
    supabase
      .from('workspace_members')
      .select('role, workspace:workspaces(*)')
      .eq('user_id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setWorkspace(data.workspace)
          setRole(data.role)
        }
        setLoading(false)
      })
  }, [session?.user?.id])

  return (
    <WorkspaceContext.Provider value={{ workspace, workspaceId: workspace?.id, role, loading }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspace = () => useContext(WorkspaceContext)
```

### Uso nos Componentes

```jsx
function Dashboard() {
  const { workspaceId } = useWorkspace()
  // ...
  const { data } = await supabase
    .from('expenses')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('month_ref', monthRef)
}
```

### Integração em ContasApp.jsx

```jsx
export default function ContasApp() {
  // ...
  return (
    <WorkspaceProvider session={session}>
      <div className="contas-root">
        <Routes>...</Routes>
      </div>
    </WorkspaceProvider>
  )
}
```

---

## PARTE 16 — CHECKLIST DE SEGURANÇA

### Testes Obrigatórios de Isolamento

```
[ ] Bruno acessa /contas → vê apenas dados do workspace Bruno
[ ] Rafael acessa /contas → vê dashboard completamente vazio
[ ] Diego acessa /contas → vê dashboard completamente vazio

[ ] Rafael POST para expenses com workspace_id de Bruno → bloqueado por RLS
[ ] Rafael GET para expenses de Bruno → retorna 0 resultados (RLS filtra)
[ ] Rafael GET direto na API Supabase com JWT de Rafael → filtrado por RLS
[ ] Rafael descobre UUID de expense de Bruno → acesso negado (RLS)

[ ] URL manipulation: Rafael troca workspace_id na URL → sistema ignora, usa workspace do JWT
[ ] Diego tenta assinar URL de arquivo do workspace Rafael → Storage policy bloqueia

[ ] Signed URL de documento de Bruno compartilhada com Rafael → acesso negado (policy de Storage)
[ ] Signed URL expira em 3600s → após expirar, acesso negado

[ ] INSERT com workspace_id de terceiro (força bruta) → RLS WITH CHECK bloqueia
[ ] UPDATE de expense de outro workspace → RLS USING bloqueia
[ ] DELETE de expense de outro workspace → RLS USING bloqueia

[ ] bucket receipts migrado para privado → getPublicUrl() não funciona mais
[ ] Nova despesa com comprovante → salva em path de workspace → signed URL necessário
```

---

## PARTE 17 — RISCOS

### CRÍTICO

| Risco | Descrição | Tabelas Afetadas |
|-------|-----------|-----------------|
| Sem RLS em nenhuma tabela de dados | Qualquer usuário autenticado lê/escreve todos os dados | 42+ tabelas |
| Bucket `receipts` é público | Comprovantes de despesas pessoais acessíveis sem autenticação | receipts |
| Dados de saúde sem isolamento | saude_pessoas e todas sub-tabelas sem user_id | 8 tabelas |
| Storage de saúde e veículos sem user_id no path | Arquivos no mesmo namespace, sem barreira | 2 buckets |
| `Cardapio.jsx` hardcoded com dados pessoais sensíveis | Dados de peso, calorias, preferências expostos no código | — |

### ALTO

| Risco | Descrição |
|-------|-----------|
| `acertos` tem user_id mas provavelmente sem RLS | Partial isolation — falso senso de segurança |
| `documentos` tem user_id mas sem RLS confirmada | Idem |
| Storage: RLS de bucket não confirmada | Mesmo com signed URL, sem policy de storage é possível assinar URL para outro usuário |
| Layout hardcoda "Bruno Chaves" | Em ambiente multi-tenant, todos os usuários veriam "Bruno Chaves" |
| `people` é global | Rafael veria as pessoas do Bruno no dropdown de Nova Compra |
| `categories` é global | Rafael veria categorias pessoais do Bruno |

### MÉDIO

| Risco | Descrição |
|-------|-----------|
| Cardapio.jsx sem Supabase | Dados de Rafael nunca apareceriam — página ficaria com dados de Bruno para sempre |
| `frases_motivacionais` — global | Não é risco de segurança, mas precisa de curadoria para múltiplos usuários |
| `contas_fixas` e `lista_compras` — possíveis views | Se forem views sem workspace_id, podem expor dados incorretamente |
| Orphan records | Sem cascades confirmadas no DB, deletes podem deixar registros filhos |

### BAIXO

| Risco | Descrição |
|-------|-----------|
| Placeholders com "Bruno" | "Ex: CNH Bruno", "Ex: Nubank Bruno" — apenas UI, sem impacto de dados |
| Storage path com random() sem seed | Math.random() pode colidir em volume muito alto (improvável) |

---

## PARTE 18 — ROADMAP

### FASE 0 — Discovery (Atual)
- **Objetivo:** mapear 100% do estado atual
- **Arquivos:** CONTAS_MULTITENANT_MIGRATION_PLAN.md
- **Migrations:** nenhuma
- **Risco:** nenhum
- **Critério de aprovação:** documento aprovado
- **Rollback:** não aplicável

### FASE 1 — Foundation Multi-Tenant
- **Objetivo:** criar tabelas `workspaces` e `workspace_members`, trigger de auto-criação
- **Migrations:** 001_create_workspaces.sql
- **Risco:** BAIXO — apenas novas tabelas, nada existente é alterado
- **Testes:** criar workspace manualmente, confirmar trigger
- **Critério:** Bruno loga, workspace criado automaticamente, aparece em workspace_members
- **Rollback:** DROP TABLE workspace_members, workspaces; DROP TRIGGER; DROP FUNCTION

### FASE 2 — Adicionar workspace_id (nullable)
- **Objetivo:** adicionar coluna em todas as tabelas, sem constraint ainda
- **Migrations:** 002 a 008 (por módulo)
- **Risco:** BAIXO — colunas nullable, queries existentes não quebram
- **Testes:** INSERT com workspace_id NULL ainda funciona; SELECT ainda retorna tudo
- **Critério:** todas as colunas criadas, 0 erros em produção
- **Rollback:** DROP COLUMN workspace_id em cada tabela

### FASE 3 — Backfill dos Dados do Bruno
- **Objetivo:** associar todos os registros existentes ao workspace de Bruno
- **Migrations:** 009_backfill_bruno.sql
- **Risco:** MÉDIO — operação em dados existentes; pode ser lenta
- **Testes:** COUNT(*) WHERE workspace_id IS NULL = 0 em todas as tabelas
- **Critério:** validação de contagens 100% OK
- **Rollback:** UPDATE ... SET workspace_id = NULL

### FASE 4 — NOT NULL + FK Constraints
- **Objetivo:** tornar workspace_id obrigatório com foreign key
- **Migrations:** 010_not_null_constraints.sql
- **Risco:** MÉDIO — se backfill tiver perdido algum registro, constraint falha; bom sinal
- **Testes:** tentar INSERT sem workspace_id → deve falhar; INSERT com workspace_id válido → OK
- **Critério:** constraints criadas sem erros
- **Rollback:** DROP CONSTRAINT; ALTER COLUMN DROP NOT NULL

### FASE 5 — RLS
- **Objetivo:** habilitar Row Level Security em todas as tabelas
- **Migrations:** 011_rls_policies.sql
- **Risco:** ALTO — pode quebrar queries existentes que não filtravam por workspace
- **Testes:** Bruno loga → vê seus dados; testar cada módulo individualmente
- **Critério:** todos os módulos funcionando para Bruno sem erros
- **Rollback:** DISABLE ROW LEVEL SECURITY; DROP POLICY em cada tabela

### FASE 6 — Frontend Workspace-Aware
- **Objetivo:** WorkspaceContext, workspace_id em todos os inserts e selects, fix do Layout
- **Arquivos:** ContasApp.jsx, Layout.jsx, todas as páginas
- **Risco:** ALTO — mudanças em todas as páginas; risk of regression
- **Testes:** cada página carrega; Nova Compra salva; dados filtram por workspace
- **Critério:** todas as páginas funcionando; nomes hardcoded removidos
- **Rollback:** revert via git

### FASE 7 — Storage Seguro
- **Objetivo:** migrar receipts para privado; atualizar paths de saude e veiculos
- **Migrations:** 012_storage_policies.sql, 013_fix_receipts_bucket.sql
- **Risco:** ALTO — URLs existentes podem quebrar; signed URLs necessárias em mais lugares
- **Testes:** download de documentos existentes funciona; comprovantes acessíveis via signed URL
- **Critério:** 0 URLs públicas para dados de usuário
- **Rollback:** restaurar paths antigos (manter bucket original, adicionar novo)

### FASE 8 — Onboarding e Criação de Rafael
- **Objetivo:** tela de onboarding, criar Rafael via admin, confirmar isolamento
- **Arquivos:** novo OnboardingPage.jsx, integração com WorkspaceProvider
- **Risco:** MÉDIO — nova funcionalidade, não altera código existente
- **Testes de isolamento (obrigatórios):**
  - Rafael loga → dashboard vazio ✅
  - Rafael cria despesa → Bruno não vê ✅
  - Bruno cria veículo → Rafael não vê ✅
  - Rafael tenta API direto com JWT Rafael → filtrado por RLS ✅
- **Critério:** todos os testes de isolamento passam

### FASE 9 — Diego e Multi-Workspace
- **Objetivo:** confirmar que o padrão escala; criar Diego; considerar workspace familiar (Bruno + Gabriela)
- **Risco:** BAIXO — sistema já multi-tenant, Diego é mais um workspace
- **Testes:** Diego → ambiente isolado e vazio
- **Critério:** 3 usuários em ambiente multi-tenant sem vazamento de dados

---

## PARTE 19 — CONCLUSÃO E CHECKLIST DE DISCOVERY

### O que foi mapeado

- ✅ 45 tabelas do banco (43 confirmadas + 2 prováveis views)
- ✅ 5 buckets de Storage
- ✅ Fluxo completo de Auth
- ✅ 19 páginas + 1 completamente hardcoded (Cardapio)
- ✅ 14 componentes UI
- ✅ Todos os hardcodes encontrados
- ✅ Isolamento (ou ausência) de cada tabela

### Recomendação Final

**Adotar workspace_id** como identificador de tenant. Cada usuário inicia com 1 workspace. Futuramente, workspaces podem ter múltiplos membros (família). RLS garante isolamento no banco. WorkspaceContext garante isolamento no frontend. Storage paths incluem workspace_id para isolamento de arquivos.

**Prioridade máxima antes de criar Rafael:** corrigir o bucket `receipts` de público para privado (violação de segurança existente, independente do multi-tenant).

---

*Este documento é exclusivamente de Discovery. Nenhuma migration foi criada. Nenhum código foi alterado. Nenhum banco foi modificado. Branch: `claude/contas-multitenant-discovery`.*
