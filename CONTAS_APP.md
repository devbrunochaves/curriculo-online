# Documentação — App `/contas`

> Mini-SPA financeiro e familiar integrado ao portfólio Next.js.  
> Stack: **React + React Router v6 + Supabase (auth, database, storage)**  
> Rota base: `brunochavess.com.br/contas`

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Arquivos](#estrutura-de-arquivos)
3. [Autenticação](#autenticação)
4. [Layout e Navegação](#layout-e-navegação)
5. [Rotas e Páginas](#rotas-e-páginas)
6. [Banco de Dados — Tabelas Supabase](#banco-de-dados--tabelas-supabase)
7. [Storage Supabase](#storage-supabase)
8. [Módulos Detalhados](#módulos-detalhados)

---

## Visão Geral

O `/contas` é uma aplicação SPA completa rodando dentro do Next.js 15 (App Router). Toda a lógica de roteamento interno usa **React Router v6** (montado em `/contas/*`). O Supabase serve como backend completo: autenticação, banco relacional e armazenamento de arquivos.

---

## Estrutura de Arquivos

```
src/contas/
├── ContasApp.jsx          # Raiz do SPA — auth, rotas protegidas
├── lib/
│   └── supabase.js        # Cliente Supabase (singleton)
├── components/
│   └── Layout.jsx         # Sidebar + mobile header + flyout desktop
├── styles/
│   └── contas.css         # Todos os estilos do app (variáveis CSS, classes utilitárias)
└── pages/
    ├── Login.jsx
    ├── MeuDia.jsx
    ├── Dashboard.jsx
    ├── NovaCompra.jsx
    ├── Lancamentos.jsx
    ├── Acertos.jsx
    ├── Entradas.jsx
    ├── ContasFixas.jsx
    ├── Previsao.jsx
    ├── Pessoas.jsx
    ├── Metas.jsx
    ├── Agenda.jsx
    ├── Saude.jsx
    ├── Veiculos.jsx
    ├── Cardapio.jsx       # Cardápio semanal
    ├── ListaCompras.jsx   # Lista de compras de casa
    ├── Documentos.jsx
    ├── Apartamento.jsx
    └── Configuracoes.jsx
```

---

## Autenticação

- Provider: **Supabase Auth** (email + senha)
- `ContasApp.jsx` ouve `onAuthStateChange` e mantém sessão em estado React
- Todas as rotas exceto `/contas/login` são protegidas por `<ProtectedRoute>`
- Logout via `supabase.auth.signOut()` no Layout (botão "Sair" no rodapé da sidebar)
- Sessão disponível para o Layout via prop `session` (exibe e-mail do usuário)

---

## Layout e Navegação

### Sidebar (desktop)

Sidebar fixa à esquerda com logo, botão "Nova Compra", nav e rodapé com e-mail + logout.

**Itens superiores (links diretos):**

| Ícone | Label | Rota |
|-------|-------|------|
| ☀️ | Meu Dia | `/contas/meudia` |
| 🐷 | Cofrinhos | `/contas/metas` |
| 📅 | Agenda Familiar | `/contas/agenda` |
| ❤️ | Saúde | `/contas/saude` |
| 🚗 | Veículos | `/contas/veiculos` |
| 🛒 | Compras de Casa | `/contas/cardapio` |
| 📁 | Documentos | `/contas/documentos` |
| 🏠 | Apartamento | `/contas/apartamento` |

**Grupo Contas (💳 — 7 subitens):**

| Ícone | Label | Rota |
|-------|-------|------|
| 📊 | Dashboard | `/contas/dashboard` |
| 📋 | Lançamentos | `/contas/lancamentos` |
| 🤝 | Acertos | `/contas/acertos` |
| 📈 | Entradas | `/contas/entradas` |
| 🏠 | Contas Fixas | `/contas/fixas` |
| 📆 | Previsão | `/contas/previsao` |
| 👥 | Pessoas | `/contas/pessoas` |

**Comportamento desktop:** hover no grupo "Contas" abre **flyout lateral** (posição `fixed` calculada via `getBoundingClientRect` para não ser cortado).

**Itens inferiores:**

| Ícone | Label | Rota |
|-------|-------|------|
| ⚙️ | Configurações | `/contas/configuracoes` |

### Mobile

- Header fixo no topo com hambúrguer + título da página atual + botão ➕
- Drawer lateral com backdrop e scroll travado no body quando aberto
- Grupo "Contas" vira **accordion** (animação suave max-height + opacity)
- FAB "+" flutuante no canto inferior direito (oculto nas páginas que têm próprio controle de adição)

### FAB oculto nas páginas:
`agenda`, `apartamento`, `meudia`, `metas`, `veiculos`, `saude`, `acertos`

---

## Rotas e Páginas

| Rota | Componente | Descrição resumida |
|------|------------|--------------------|
| `/contas/login` | `Login` | Tela de autenticação |
| `/contas/` | → redireciona | Vai para `/contas/meudia` |
| `/contas/meudia` | `MeuDia` | Painel do dia: tarefas, frase motivacional, resumo financeiro |
| `/contas/dashboard` | `Dashboard` | Visão financeira mensal com gráficos e exportação PDF |
| `/contas/nova` | `NovaCompra` | Formulário de novo lançamento (com parcelamento e divisão) |
| `/contas/lancamentos` | `Lancamentos` | Lista filtrável de todos os lançamentos |
| `/contas/acertos` | `Acertos` | Controle de acertos financeiros entre pessoas |
| `/contas/entradas` | `Entradas` | Registro de entradas de dinheiro (salários, freelances etc.) |
| `/contas/fixas` | `ContasFixas` | Gerenciamento de contas recorrentes mensais |
| `/contas/previsao` | `Previsao` | Projeção financeira dos próximos 3/6/9 meses |
| `/contas/pessoas` | `Pessoas` | Cadastro de pessoas para divisão de despesas |
| `/contas/metas` | `Metas` | Cofrinhos (metas de economia com aportes) |
| `/contas/agenda` | `Agenda` | Agenda familiar com eventos, categorias e calendário |
| `/contas/saude` | `Saude` | Saúde familiar: consultas, exames, medicamentos, composição corporal etc. |
| `/contas/veiculos` | `Veiculos` | Gestão de veículos: abastecimentos, manutenções, documentos, seguros |
| `/contas/cardapio` | `Cardapio` + `ListaCompras` | Cardápio semanal + lista de compras de casa |
| `/contas/documentos` | `Documentos` | Documentos pessoais com upload de arquivos |
| `/contas/apartamento` | `Apartamento` | Gestão do apartamento: gastos, manutenções, inventário, projetos etc. |
| `/contas/configuracoes` | `Configuracoes` | Cartões, categorias e configurações gerais |
| `/contas/cartoes` | → redireciona | Vai para `/contas/configuracoes` |
| `/contas/lista` | → redireciona | Vai para `/contas/cardapio` |

---

## Banco de Dados — Tabelas Supabase

### Financeiro

| Tabela | Descrição |
|--------|-----------|
| `expenses` | Lançamentos de despesas (data, descrição, valor, cartão, categoria, mês de referência, parcelado/fixo) |
| `expense_splits` | Divisão de cada despesa entre pessoas (`expense_id`, `person_id`, `amount`) |
| `cards` | Cartões de crédito (nome, cor, dia de fechamento) |
| `categories` | Categorias de despesas (nome, cor, ícone) |
| `people` | Pessoas cadastradas para divisão de despesas (nome, cor) |
| `income` | Registro consolidado de entradas por mês (`month_ref`, `amount`) |
| `income_entries` | Entradas individuais (descrição, valor, data, pessoa) |
| `recurring_bills` | Templates de contas fixas recorrentes (nome, valor, dia de vencimento, pessoa responsável) |
| `bill_entries` | Ocorrências mensais das contas fixas geradas automaticamente (`month_ref`, `amount`) |
| `bill_entry_splits` | Divisão das contas fixas entre pessoas |
| `acertos` | Registro de acertos financeiros entre pessoas (quem deve para quem, valor, data) |

### Metas / Cofrinhos

| Tabela | Descrição |
|--------|-----------|
| `cofrinhos` | Cofrinhos (nome, valor meta, cor, ícone, prazo) |
| `cofrinhos_aportes` | Aportes realizados em cada cofrinho (data, valor) |
| `metas` | (tabela legada / alternativa de metas) |

### Compras de Casa

| Tabela | Descrição |
|--------|-----------|
| `shopping_items` | Itens da lista de compras (nome, quantidade, `is_done`) |
| `lista_compras` | (referência alternativa à lista de compras) |

### Agenda Familiar

| Tabela | Descrição |
|--------|-----------|
| `agenda_eventos` | Eventos familiares (título, data, hora, categoria, recorrência, participantes) |

### Saúde

| Tabela | Descrição |
|--------|-----------|
| `saude_pessoas` | Perfis de saúde (nome, nascimento, tipo sanguíneo, peso, altura, convênio, alergias) |
| `saude_consultas` | Consultas médicas agendadas ou realizadas (especialidade, médico, clínica, data) |
| `saude_exames` | Exames laboratoriais e de imagem (tipo, laboratório, data, resultado) |
| `saude_medicamentos` | Medicamentos em uso (nome, dosagem, frequência, ativo/inativo) |
| `saude_receitas` | Receitas médicas (descrição, médico, data, validade, arquivo) |
| `saude_vacinas` | Vacinas aplicadas e próximas doses (nome, data, próxima dose, lote) |
| `saude_documentos` | Documentos de saúde como cartão SUS, carteirinha de convênio (arquivo em storage) |
| `saude_medicoes` | **Composição corporal** — medições da balança BIO ULTRA (peso, IMC, gordura %, massa muscular, massa muscular esquelética, massa gorda, água, proteína, minerais, gordura visceral, idade corporal, TMB) |

### Veículos

| Tabela | Descrição |
|--------|-----------|
| `veiculos` | Veículos cadastrados (placa, modelo, ano, cor, quilometragem) |
| `veiculos_abastecimentos` | Histórico de abastecimentos (data, litros, valor, posto, km) |
| `veiculos_manutencoes` | Manutenções realizadas ou agendadas (tipo, data, valor, km, oficina) |
| `veiculos_documentos` | Documentos do veículo (CRLV, seguro, multa etc.) com arquivo em storage |
| `veiculos_gastos` | Gastos avulsos com veículos |
| `veiculos_fotos` | Fotos do veículo armazenadas em storage |
| `veiculos_seguros` | Apólices de seguro (seguradora, vigência, valor) |

### Apartamento

| Tabela | Descrição |
|--------|-----------|
| `apartamento_gastos` | Gastos do apartamento (condomínio, IPTU, reforma etc.) |
| `apartamento_manutencoes` | Manutenções do apartamento |
| `apartamento_boletos` | Boletos e contas a pagar do imóvel |
| `apartamento_inventario` | Inventário de bens do apartamento |
| `apartamento_projetos` | Projetos de reforma ou melhoria |
| `apartamento_prestadores` | Prestadores de serviço (encanador, elétrica etc.) |
| `apartamento_garantias` | Garantias de equipamentos e eletrodomésticos |
| `apartamento_documentos` | Documentos do imóvel com arquivo |
| `apartamento_fotos` | Fotos do apartamento em storage |

### Documentos Pessoais

| Tabela | Descrição |
|--------|-----------|
| `documentos` | Documentos pessoais (CPF, RG, passaporte, certidões etc.) |
| `documentos_arquivos` | Arquivos vinculados a cada documento (storage) |

### Outros

| Tabela | Descrição |
|--------|-----------|
| `frases_motivacionais` | Frases exibidas na tela "Meu Dia" |
| `receipts` | Comprovantes de despesas vinculados a `expenses` |

---

## Storage Supabase

Todos os buckets são **privados**. Os arquivos são acessados via **URL temporária assinada** (`createSignedUrl(path, 3600)`) — nunca `getPublicUrl()`.

| Bucket | Usado por |
|--------|-----------|
| `saude` | Receitas médicas, documentos de saúde |
| `veiculos` | Fotos e documentos de veículos |
| `apartamento` | Fotos e documentos do apartamento |
| `documentos` | Arquivos de documentos pessoais |
| (expenses) | Comprovantes de despesas (`receipts`) |

---

## Módulos Detalhados

### ☀️ Meu Dia (`/contas/meudia`)

Tela inicial após login. Exibe:
- Frase motivacional do dia (tabela `frases_motivacionais`)
- Resumo financeiro do mês atual
- Lista de tarefas do dia
- Atalhos rápidos para as seções mais usadas

---

### 📊 Dashboard (`/contas/dashboard`)

Painel financeiro mensal. Funcionalidades:
- Navegação por mês (anterior/próximo)
- **Gráficos** (Recharts): pizza por categoria, linha de evolução mensal, barras por pessoa
- Resumo: total de despesas, entradas, saldo
- Visão por pessoa: quanto cada um gastou no mês
- **Exportação PDF** por pessoa (jsPDF + jspdf-autotable) com cabeçalho colorido, tabela de despesas e rodapé

---

### ➕ Nova Compra (`/contas/nova`)

Formulário principal de registro de despesas:
- Campos: data, descrição, cartão, categoria, valor total, observações, comprovante
- **Máscara de moeda automática**: digitar apenas números, formata automaticamente como `1.234,56`
- **Teclado numérico no mobile** (`inputMode="numeric"`)
- **Parcelamento**: divide automaticamente em N meses com preview de parcelas
- **Divisão entre pessoas**: seleciona pessoas, digita valor individual ou usa "Dividir igualmente"
- Cálculo automático do `month_ref` baseado no dia de fechamento do cartão
- Modo edição: carrega dados de um lançamento existente via `?edit=<id>`

---

### 📋 Lançamentos (`/contas/lancamentos`)

Lista completa de despesas com filtros:
- Filtro por mês, cartão, categoria, pessoa
- Busca por descrição
- Edição inline (abre `NovaCompra` em modo edição)
- Exclusão com confirmação
- Exibe parcelamento (ex: "2/6") e divisão entre pessoas

---

### 🤝 Acertos (`/contas/acertos`)

Controle de acertos financeiros entre membros:
- Registra quem deve para quem e quanto
- Histórico de acertos realizados
- Balanço geral de débitos e créditos por pessoa

---

### 📈 Entradas (`/contas/entradas`)

Registro de receitas e entradas de dinheiro:
- Entradas por mês de referência
- Categorias: salário, freelance, rendimento, outros
- Vínculo com pessoa (de quem é a entrada)
- Histórico com evolução mensal

---

### 🏠 Contas Fixas (`/contas/fixas`)

Gerenciamento de despesas recorrentes mensais:
- Cadastro de templates de contas fixas (`recurring_bills`)
- Geração automática de ocorrências mensais (`bill_entries`)
- Suporte a divisão entre pessoas (`bill_entry_splits`)
- Marcar como pago por mês
- Valor pode variar mês a mês (editável por ocorrência)

---

### 📆 Previsão (`/contas/previsao`)

Projeção dos gastos nos próximos meses:
- Seletor de horizonte: 3, 6 ou 9 meses
- Para cada mês: total de despesas + entradas + saldo projetado
- **Accordion por pessoa**: mostra quanto cada pessoa vai gastar
  - Subtotal de contas fixas
  - Total por cartão (sem detalhe de compras individuais)
- Destaque visual para o mês atual
- Total comprometido no período

---

### 👥 Pessoas (`/contas/pessoas`)

Cadastro dos membros para divisão de despesas:
- Nome e cor (usada nos gráficos e avatares)
- CRUD completo
- Utilizada em `expense_splits`, `bill_entry_splits`, `acertos`, `income_entries`

---

### 🐷 Cofrinhos (`/contas/metas`)

Sistema de metas de economia (cofrinhos):
- Cada cofrinho tem: nome, ícone, cor, valor-meta, prazo
- Registro de aportes com data e valor
- Barra de progresso visual
- Histórico de aportes por cofrinho
- Cálculo de quanto falta e ritmo necessário para atingir a meta

---

### 📅 Agenda Familiar (`/contas/agenda`)

Agenda compartilhada da família:
- Visualização em calendário mensal
- Eventos com título, data, hora, categoria, cor, recorrência
- Participantes por evento
- Próximos eventos em destaque

---

### ❤️ Saúde (`/contas/saude`)

Módulo completo de saúde familiar. Organizado por pessoa:

**Dashboard de Saúde:**
- Cards resumo: membros, próximas consultas (7 dias), medicamentos ativos, exames, vacinas vencendo (30 dias)
- Lista de membros — clicar abre o perfil detalhado

**Perfil de cada pessoa — Abas:**

| Aba | Conteúdo |
|-----|----------|
| 📊 Resumo | Dados pessoais (nascimento, tipo sanguíneo, peso, altura, convênio, alergias) |
| ⚖️ Composição | Medições corporais: IMC, gordura %, músculo, água, TMB + gráficos SVG de evolução |
| 🏥 Consultas | Histórico de consultas médicas com especialidade, médico, clínica, data, retorno |
| 🧪 Exames | Exames realizados com resultados e arquivos |
| 💊 Medicamentos | Medicamentos em uso (ativo/inativo) com dosagem e frequência |
| 📋 Receitas | Receitas médicas digitalizadas com arquivo em storage |
| 💉 Vacinas | Carteira de vacinação com controle de próximas doses |
| 📁 Documentos | Cartão SUS, carteirinha de convênio e outros documentos |
| 📈 Histórico | Linha do tempo de eventos de saúde |

**Composição Corporal (⚖️):**
- Formulário com todos os campos do relatório BIO ULTRA: peso, IMC, gordura corporal %, massa muscular (total e esquelética), massa gorda, água, proteína, minerais, gordura visceral, idade corporal, TMB
- 8 cards com mini gráfico SVG de evolução por métrica
- Classificações automáticas: IMC (Abaixo/Normal/Sobrepeso/Obesidade), Gordura (Abaixo/Normal/Acima)
- Banner com última medição em destaque
- Histórico completo de medições

---

### 🚗 Veículos (`/contas/veiculos`)

Gestão completa de veículos:
- Cadastro de veículos (placa, modelo, ano, km atual)
- **Abastecimentos**: data, litros, valor total, km, posto — calcula custo/km e consumo médio
- **Manutenções**: tipo, data, valor, km, oficina — agendamento e histórico
- **Documentos**: CRLV, CNH, multas — com upload de arquivo (storage privado + URL assinada)
- **Seguros**: seguradora, vigência, valor, cobertura
- **Fotos**: galeria de fotos do veículo
- **Gastos avulsos**: multas, pedágios, estacionamentos etc.

---

### 🛒 Compras de Casa (`/contas/cardapio`)

Duas funcionalidades na mesma página:

**Cardápio Semanal:**
- Planejamento das refeições da semana (café, almoço, jantar, lanche)
- Edição por dia da semana

**Lista de Compras:**
- Adicionar itens com nome e quantidade/observação
- Marcar como comprado (checkbox estilo bancário)
- Ordenação automática alfabética (pendentes primeiro, depois comprados)
- Filtros: Pendentes / Comprados / Todos
- Limpar todos os itens comprados de uma vez

---

### 📁 Documentos (`/contas/documentos`)

Gestão de documentos pessoais:
- Tipos: CPF, RG, passaporte, certidões, outros
- Upload de arquivos em storage privado (URL assinada para visualização)
- Múltiplos arquivos por documento
- Data de validade e alertas de vencimento

---

### 🏠 Apartamento (`/contas/apartamento`)

Gestão completa do imóvel:
- **Gastos**: condomínio, IPTU, reforma, outros com histórico mensal
- **Manutenções**: registro de reparos realizados ou agendados
- **Boletos**: contas a pagar do imóvel com data de vencimento
- **Inventário**: lista de bens e eletrodomésticos com valor e data de compra
- **Projetos**: projetos de reforma com orçamento, status e progresso
- **Prestadores**: agenda de contatos de serviços (encanador, elétrica, pintor)
- **Garantias**: controle de garantias de equipamentos com data de expiração
- **Documentos**: escritura, IPTU, contrato de aluguel com arquivo
- **Fotos**: galeria de fotos do apartamento

---

### ⚙️ Configurações (`/contas/configuracoes`)

Painel de configuração do app:
- **Cartões**: cadastro de cartões de crédito com nome, cor e dia de fechamento — usados nos lançamentos para calcular o mês de referência correto
- **Categorias**: cadastro de categorias de despesa com nome, cor e ícone
- Configurações gerais do app

---

## Variáveis CSS Principais

```css
--c-bg           /* fundo principal */
--c-surface      /* fundo de cards e painéis */
--c-border       /* cor de bordas */
--c-text         /* texto principal */
--c-text-muted   /* texto secundário/cinza */
--c-accent       /* roxo (#6366f1) — cor de destaque */

/* Sidebar (fixo dark independente do tema) */
--c-sidebar-bg:        #0f172a
--c-sidebar-text:      #94a3b8
--c-sidebar-active:    #6366f1
--c-sidebar-active-bg: rgba(99,102,241,0.15)
```

---

## Dependências Externas Relevantes

| Pacote | Uso |
|--------|-----|
| `react-router-dom` v6 | Roteamento do SPA |
| `@supabase/supabase-js` | Auth + banco + storage |
| `recharts` | Gráficos no Dashboard |
| `jspdf` + `jspdf-autotable` | Exportação de relatórios PDF no Dashboard |
| `date-fns` + `date-fns/locale/pt-BR` | Formatação de datas em português |

---

*Documento gerado em 2026-07-23*
