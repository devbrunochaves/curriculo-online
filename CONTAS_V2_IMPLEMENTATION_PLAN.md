# CONTAS V2 - Plano tecnico de migracao visual

Branch de trabalho: `codex/contas-v2-implementation`

Este documento prepara a implementacao real da V2 visual do `/contas`. A etapa atual e exclusivamente planejamento tecnico, auditoria e protecao de comportamento. Nenhuma tela real foi redesenhada nesta fase.

## Regras de seguranca

- Nao executar migrations.
- Nao alterar schema, tabelas, colunas, relacionamentos, RLS, policies, buckets ou autenticacao.
- Nao apagar, recriar, resetar, limpar ou substituir dados reais.
- Nao trocar queries, filtros, regras de calculo ou regras de negocio junto com o visual.
- Nao usar dados mockados dentro de `src/contas`.
- Nao alterar `src/app/alimentares/layout.jsx` nem `src/app/alimentares/page.jsx`.
- Fazer commits pequenos por fase, sempre com build e diff revisado antes.
- Manter rollback simples por commit.

## Fontes lidas

- `CONTAS_APP.md`
- `Contas V2 - Discovery & Design Document.pdf`
- `prototype-contas-v2/README.md`
- `prototype-contas-v2/index.html`
- `prototype-contas-v2/dashboard.html`
- `prototype-contas-v2/lancamentos.html`
- `prototype-contas-v2/styles/variables.css`
- `prototype-contas-v2/styles/global.css`
- `prototype-contas-v2/styles/layout.css`
- `prototype-contas-v2/styles/components.css`
- `prototype-contas-v2/styles/pages.css`
- `prototype-contas-v2/js/app.js`
- `prototype-contas-v2/js/navigation.js`
- `prototype-contas-v2/js/theme.js`
- `prototype-contas-v2/js/interactions.js`
- `src/contas/ContasApp.jsx`
- `src/contas/components/Layout.jsx`
- `src/contas/styles/contas.css`
- Todas as paginas em `src/contas/pages/`

## Contratos de dados e comportamento

- A aplicacao atual continua sendo a fonte de verdade para dados, estado, queries, CRUD, autenticacao, rotas, calculos, validacoes, uploads e regras de negocio.
- O Dashboard deve continuar mostrando dados reais do `month_ref` selecionado.
- A navegacao de mes anterior/proximo deve continuar alterando somente o mes em tela.
- `Lançamentos` deve continuar filtrando por mes, cartao, pessoa, tipo fixo/variavel e busca textual.
- A edicao de lancamento deve continuar abrindo o lancamento correto, inclusive quando chamada pelo modal.
- A exclusao de lancamento deve continuar exigindo confirmacao.
- `NovaCompra` deve continuar calculando `month_ref` a partir da data da compra e do `closing_day` do cartao.
- Parcelamento deve continuar criando N registros em `expenses`, com descricao `X/N`, meses sequenciais e rateio proporcional dos splits.
- Divisao entre pessoas deve continuar exigindo que a soma dos splits seja igual ao total.
- `ContasFixas` deve continuar criando ocorrencias mensais faltantes em `bill_entries`.
- Ao criar ocorrencias mensais de contas fixas, a copia de splits do mes anterior deve permanecer intacta.
- Edicao mensal de conta fixa deve continuar alterando `bill_entries` e recriando `bill_entry_splits` daquele mes.
- Edicao do template de conta fixa deve continuar alterando `recurring_bills`.
- Uploads devem continuar usando os buckets existentes e a estrategia atual de URL da tela.
- Rotas protegidas, login, sessao persistente e logout devem continuar funcionando.

## Auditoria por pagina

### 1. Meu Dia

- Rota: `/contas/meudia` e index de `/contas`.
- Arquivo: `src/contas/pages/MeuDia.jsx`.
- Tabelas: `agenda_eventos`, `apartamento_boletos`, `apartamento_garantias`, `apartamento_gastos`, `apartamento_manutencoes`, `contas_fixas`, `documentos`, `frases_motivacionais`, `lista_compras`, `metas`, `saude_consultas`, `saude_vacinas`, `veiculos_documentos`.
- Operacoes: apenas `select`.
- Campos usados: datas de inicio/vencimento/validade, titulo, categoria, status, valores, nome, cor, icone, vacina, consulta, documento e indicadores de ativo/concluido.
- Estados React: `userName`, `loading`, objeto consolidado de dados do dia.
- Calculos: saudacao por horario, data atual, proximos 7/30/60 dias, itens em foco, totais de gastos do apartamento, pendencias e frase do dia.
- Filtros: `eq`, `neq`, `gte`, `lte`, `gt`, `in`, `order`, `limit`.
- Dependencias: usa dados de praticamente todos os modulos; e a home operacional do Life OS.
- Riscos: quebrar carregamento parcial com `Promise.allSettled`, ocultar pendencias reais, alterar nomes de tabelas sensiveis como `contas_fixas`.
- Pode trocar visualmente: cards, listas, atalhos, cabecalho, empty states, loading, badges e layout geral.
- Nao alterar: queries, datas, janelas de prazo, estrutura do objeto de dados e fallback de erros.
- Correspondencia no prototipo: `prototype-contas-v2/index.html` como direcao principal.

### 2. Dashboard

- Rota: `/contas/dashboard`.
- Arquivo: `src/contas/pages/Dashboard.jsx`.
- Tabelas: `expenses`, `expense_splits`, `cards`, `categories`, `people`, `recurring_bills`, `bill_entries`, `bill_entry_splits`.
- Operacoes: `select` e `insert`.
- Campos usados: `month_ref`, `date`, `description`, `total_amount`, `is_fixed`, `card_id`, `category_id`, `person_id`, `amount`, `default_amount`, `due_day`, `is_active`, `color`, `name`, splits relacionados.
- Estados React: `currentDate`, `data`, `loading`, `catModal`, `personModal`.
- Calculos: total de cartoes, fixos, variaveis, fixas recorrentes, total geral, total por cartao, percentual do limite, alertas, total por pessoa, categorias, historico de 6 meses e PDF por pessoa.
- Filtros: `eq('month_ref')`, `eq('is_active')`, `in('month_ref')`, filtros por ids de bills/entries.
- Dependencias: depende de `NovaCompra`, `ContasFixas`, `Pessoas`, `Configuracoes` e dados de cartoes/categorias/pessoas.
- Riscos: duplicar contas fixas, perder copia de splits, mudar totais por pessoa, quebrar modais de categoria/pessoa ou PDF.
- Pode trocar visualmente: metric cards, graficos, blocos de storytelling, modais, tabela de ultimos lancamentos e alertas.
- Nao alterar: `load()`, geracao de `bill_entries`, copia de splits, calculos de totais, filtros por `month_ref`, funcao de PDF.
- Correspondencia no prototipo: `prototype-contas-v2/dashboard.html`.

### 3. Lancamentos

- Rota: `/contas/lancamentos`.
- Arquivo: `src/contas/pages/Lancamentos.jsx`.
- Tabelas: `expenses`, `expense_splits`, `cards`, `categories`, `people`.
- Operacoes: `select`, `update`, `delete`.
- Campos usados: `id`, `date`, `description`, `total_amount`, `month_ref`, `card_id`, `category_id`, `is_fixed`, `notes`, `receipt_url`, `reconciled`, splits e relacoes de card/category/person.
- Estados React: `currentDate`, `expenses`, `cards`, `people`, `loading`, `filterCard`, `filterPerson`, `filterFixed`, `search`, `deleting`, `selected`, `showForm`, `editingId`.
- Calculos: total filtrado, total do mes, total por cartao, total por pessoa, quantidade de lancamentos, conciliados todos/parcial.
- Filtros: `eq('month_ref')`, `eq('is_active')`, `order('date')`, filtros locais por cartao, pessoa, fixo/variavel e descricao.
- Dependencias: abre `NovaCompra` como modal para criar/editar; modal de detalhes depende de dados carregados.
- Riscos: perder filtros, editar item errado, excluir sem confirmacao, quebrar reconciliacao em lote, perder exibicao de comprovante.
- Pode trocar visualmente: tabela, filtros, resumo, modal de detalhes, empty state, botoes e badges.
- Nao alterar: `load`, `toggleReconciled`, `toggleAll`, `handleDelete`, chamadas de `NovaCompra`, filtros locais.
- Correspondencia no prototipo: `prototype-contas-v2/lancamentos.html`.

### 4. Nova Compra

- Rota: `/contas/nova` e modal dentro de `/contas/lancamentos`.
- Arquivo: `src/contas/pages/NovaCompra.jsx`.
- Tabelas: `cards`, `people`, `categories`, `expenses`, `expense_splits`, `receipts`.
- Storage: bucket `receipts`.
- Operacoes: `select`, `insert`, `update`, `delete`, upload em storage.
- Campos usados: `date`, `description`, `card_id`, `category_id`, `total_amount`, `month_ref`, `is_fixed`, `notes`, `receipt_url`, `closing_day`, `person_id`, `amount`.
- Estados React: `cards`, `people`, `categories`, `date`, `description`, `cardId`, `catId`, `total`, `isFixed`, `notes`, `splits`, `isInstallment`, `installments`, `saving`, `error`, `success`, `receipt`, `receiptPreview`.
- Calculos: `parseBRL`, `getMonthRef`, fatura base, preview de parcelas, valor por parcela com ajuste da ultima, soma dos splits, diferenca e validade do formulario.
- Filtros: `eq('is_active')`, `order('name')`, `eq('id')`.
- Dependencias: alimenta `Dashboard`, `Lancamentos`, `Pessoas`, `Previsao`; usa config de cartoes, pessoas e categorias.
- Riscos: regressao grave em `month_ref`, parcelamento, split proporcional, comprovante, edicao e redirecionamento apos salvar.
- Pode trocar visualmente: formulario, indicador de fatura, preview de parcelas, seletor de pessoas, upload visual e feedback.
- Nao alterar: `getMonthRef`, `installmentPreview`, validacao `isValid`, payloads de insert/update, recriacao de splits na edicao, upload.
- Correspondencia no prototipo: nao ha tela completa; usar componentes de forms, modais e inputs do design system.

### 5. Layout

- Rota: envolve todas as rotas protegidas de `/contas`.
- Arquivo: `src/contas/components/Layout.jsx`.
- Tabelas: nenhuma.
- Operacoes: `supabase.auth.signOut()`.
- Campos usados: rota atual via `location.pathname`.
- Estados React: `hovered`, `open`, `contasOpen`, `flyoutVisible`, `flyoutTop`, `isMobile`.
- Calculos: item ativo por pathname, visibilidade do FAB, posicao do flyout e lock de scroll mobile.
- Filtros: nao aplicavel.
- Dependencias: todas as paginas; depende de `Outlet`, `useNavigate`, `useLocation`.
- Riscos: quebrar rotas protegidas, logout, navegacao mobile, FAB ou scroll lock.
- Pode trocar visualmente: sidebar, header mobile, bottom navigation, grupos, icones e app shell.
- Nao alterar: rotas dos itens, `Outlet`, logout, condicoes de FAB enquanto nao houver aprovacao por fase.
- Correspondencia no prototipo: app shell, sidebar e bottom navigation dos 3 HTMLs.

### 6. ContasApp

- Rota: `/contas/*`.
- Arquivo: `src/contas/ContasApp.jsx`.
- Tabelas: nenhuma diretamente.
- Operacoes: `getSession`, `onAuthStateChange`.
- Campos usados: sessao Supabase.
- Estados React: `session`, `loading`.
- Calculos: protecao de rota e redirects.
- Filtros: nao aplicavel.
- Dependencias: todas as paginas e `Layout`.
- Riscos: quebrar autenticacao ou redirects.
- Pode trocar visualmente: tela de loading se for isolada.
- Nao alterar: rotas, `ProtectedRoute`, `PublicRoute`, auth listener.
- Correspondencia no prototipo: nenhuma.

### 7. Acertos

- Rota: `/contas/acertos`.
- Arquivo: `src/contas/pages/Acertos.jsx`.
- Tabelas: `acertos`, `cards`, `expenses`, `people`, `recurring_bills`.
- Operacoes: `select`, `insert`, `delete`.
- Campos usados: mes, pessoa, valor, data, observacao, cartao, despesas e recorrencias.
- Estados React: `selectedKey`, `valor`, `data`, `obs`, `saving`, `currentDate`, `expenses`, `billEntries`, `cards`, `people`, `acertos`, `loading`, `modalPd`.
- Calculos: saldos entre pessoas, total devido, total acertado e pendencias.
- Filtros: `eq`, filtros por mes/pessoa/cartao.
- Dependencias: `Dashboard`, `Pessoas`, despesas e contas fixas.
- Riscos: alterar logica de compensacao e saldos.
- Pode trocar visualmente: cards, modal, historico e formulario.
- Nao alterar: calculos de acerto e inserts/deletes.
- Correspondencia no prototipo: componentes financeiros gerais.

### 8. Entradas

- Rota: `/contas/entradas`.
- Arquivo: `src/contas/pages/Entradas.jsx`.
- Tabelas: `income_entries`.
- Operacoes: `select`, `insert`, `delete`.
- Campos usados: descricao, valor, data, mes, origem/tipo.
- Estados React: `currentDate`, `entries`, `chartData`, `loading`, `desc`, `amount`, `saving`, `deleting`.
- Calculos: total do mes, agrupamentos para grafico e historico.
- Filtros: `eq`, `in`, `order`.
- Dependencias: `Previsao` e resumo financeiro.
- Riscos: total de entradas incorreto.
- Pode trocar visualmente: formulario, lista, grafico, empty state.
- Nao alterar: insert/delete e filtros por periodo.
- Correspondencia no prototipo: cards de resumo e tabelas.

### 9. Contas Fixas

- Rota: `/contas/fixas`.
- Arquivo: `src/contas/pages/ContasFixas.jsx`.
- Tabelas: `recurring_bills`, `bill_entries`, `bill_entry_splits`, `people`, `categories`.
- Operacoes: `select`, `insert`, `update`, `delete`.
- Campos usados: `name`, `default_amount`, `due_day`, `category_id`, `person_id`, `total_installments`, `start_month`, `notes`, `month_ref`, `amount`, `entry_id`.
- Estados React: `monthDate`, `entries`, `people`, `categories`, `loading`, `showAddModal`, `editModalBill`, `editingId`, `editAmount`, `editSplits`, `saving`, `confirmDelete`.
- Calculos: `currentMonth`, label de mes, numero da parcela, total mensal, total por pessoa, split igual, diferenca entre valor e splits.
- Filtros: `eq('month_ref')`, `eq('is_active')`, `in('entry_id')`, `order`.
- Dependencias: `Dashboard`, `Pessoas`, `Previsao`.
- Riscos: duplicar/remover contas reais, apagar historico de entradas, quebrar splits.
- Pode trocar visualmente: lista, resumo, modal, confirm dialog, inline edit.
- Nao alterar: `generateMissingEntries`, `handleAddBill`, `handleEditBill`, `deleteBill`, `saveEntry`.
- Correspondencia no prototipo: componentes de cards, modais e tabelas.

### 10. Pessoas

- Rota: `/contas/pessoas`.
- Arquivo: `src/contas/pages/Pessoas.jsx`.
- Tabelas: `expenses`, `expense_splits`, `people`, `recurring_bills`, `bill_entries`, `bill_entry_splits`.
- Operacoes: `select`, `insert`.
- Campos usados: pessoas, cores, splits, valores, mes, contas fixas e cartoes.
- Estados React: `currentDate`, `data`, `loading`, `selected`.
- Calculos: total por pessoa, detalhes por pessoa, agrupamentos de despesas e contas fixas.
- Filtros: `eq`, `in`, `order`.
- Dependencias: `Dashboard`, `Lançamentos`, `ContasFixas`.
- Riscos: divergencia nos valores por pessoa.
- Pode trocar visualmente: cards de pessoa, drilldown/modal e listagem.
- Nao alterar: regras de fallback quando nao ha split.
- Correspondencia no prototipo: dashboard/pessoas.

### 11. Previsao

- Rota: `/contas/previsao`.
- Arquivo: `src/contas/pages/Previsao.jsx`.
- Tabelas: `expenses`, `bill_entries`, `income`.
- Operacoes: `select`, `delete`.
- Campos usados: mes, valores de entradas, despesas e contas fixas.
- Estados React: `months`, `data`, `loading`, `openKeys`, `currentRef`.
- Calculos: meses futuros, saldo previsto, entradas, saidas e acumulados.
- Filtros: `in`, `order`.
- Dependencias: `NovaCompra`, `Entradas`, `ContasFixas`.
- Riscos: previsao financeira incorreta.
- Pode trocar visualmente: timeline, tabela, accordions e cards.
- Nao alterar: range de meses, calculos e consultas.
- Correspondencia no prototipo: storytelling financeiro do Dashboard.

### 12. Configuracoes

- Rota: `/contas/configuracoes` e redirect de `/contas/cartoes`.
- Arquivo: `src/contas/pages/Configuracoes.jsx`.
- Tabelas: `cards`, `categories`, `income`, `people`.
- Operacoes: `select`, `insert`, `update`, `delete`.
- Campos usados: nomes, cores, icones, limites, fechamento, ativo, perfis e configuracoes base.
- Estados React: diversos estados de formulario para perfil, cartoes, pessoas, categorias e entradas.
- Calculos: mascaras, validacoes simples e listas ordenadas.
- Filtros: `eq`, `order`.
- Dependencias: quase todos os modulos financeiros.
- Riscos: alterar configuracoes que afetam todos os calculos.
- Pode trocar visualmente: abas, formularios, listas e confirmacoes.
- Nao alterar: nomes de campos, defaults e operacoes CRUD.
- Correspondencia no prototipo: forms e settings em desenvolvimento.

### 13. Login

- Rota: `/contas/login`.
- Arquivo: `src/contas/pages/Login.jsx`.
- Tabelas: nenhuma.
- Operacoes: login Supabase Auth.
- Campos usados: email e senha.
- Estados React: `email`, `password`, `loading`, `error`.
- Calculos: nao aplicavel.
- Filtros: nao aplicavel.
- Dependencias: `ContasApp`.
- Riscos: impedir acesso ao sistema.
- Pode trocar visualmente: tela e campos.
- Nao alterar: chamada de autenticacao e tratamento de sessao.
- Correspondencia no prototipo: design system de forms.

### 14. Cartoes

- Rota: legado/configuracao, redirecionado em `ContasApp`.
- Arquivo: `src/contas/pages/Cartoes.jsx`.
- Tabelas: `cards`.
- Operacoes: `select`, `insert`, `update`, `delete`.
- Campos usados: nome, cor, limite, fechamento, ativo.
- Estados React: lista, loading, form, edicao e exclusao.
- Calculos: validacoes e ordenacao.
- Filtros: `eq`, `order`.
- Dependencias: `NovaCompra`, `Lancamentos`, `Dashboard`.
- Riscos: quebrar fatura por `closing_day`.
- Pode trocar visualmente: cards/lista/form.
- Nao alterar: `closing_day`, ativo e CRUD.
- Correspondencia no prototipo: configuracoes futuras.

### 15. Agenda

- Rota: `/contas/agenda`.
- Arquivo: `src/contas/pages/Agenda.jsx`.
- Tabelas: `agenda_eventos`.
- Operacoes: `select`, `insert`, `update`, `delete`.
- Campos usados: titulo, descricao, data/hora, categoria, local, dia inteiro, status.
- Estados React: `saving`, `error`, `view`, `currentDate`, `events`, `loading`, `selectedDay`, `showForm`, `editingEvent`, `selectedEvent`, `deleting`, `filterCat`.
- Calculos: calendario, agrupamento por dia, filtros por categoria.
- Filtros: `eq`, `order`.
- Dependencias: `MeuDia`.
- Riscos: perder eventos da home.
- Pode trocar visualmente: calendario, lista, modal e filtros.
- Nao alterar: CRUD e datas.
- Correspondencia no prototipo: bloco Agenda do Meu Dia.

### 16. Veiculos

- Rota: `/contas/veiculos`.
- Arquivo: `src/contas/pages/Veiculos.jsx`.
- Tabelas: `veiculos`, `veiculos_abastecimentos`, `veiculos_documentos`, `veiculos_fotos`, `veiculos_gastos`, `veiculos_manutencoes`, `veiculos_seguros`.
- Storage: bucket `veiculos`.
- Operacoes: `select`, `insert`, `update`, `delete`, upload.
- Campos usados: dados do veiculo, vencimentos, km, valores, fotos, documentos, manutencoes e seguros.
- Estados React: listas, filtros, modais, forms, uploads e loading.
- Calculos: vencimentos, custos, proximas manutencoes e indicadores.
- Filtros: `eq`, `gte`, `lte`, `order`, `limit`.
- Dependencias: `MeuDia`.
- Riscos: quebrar documentos privados e prazos de vencimento.
- Pode trocar visualmente: cards, tabs, tabelas, upload e modais.
- Nao alterar: storage, signed/private access, CRUD e datas.
- Correspondencia no prototipo: bloco Veiculo do Meu Dia.

### 17. Saude

- Rota: `/contas/saude`.
- Arquivo: `src/contas/pages/Saude.jsx`.
- Tabelas: `saude`, `saude_pessoas`, `saude_consultas`, `saude_documentos`, `saude_exames`, `saude_medicamentos`, `saude_medicoes`, `saude_receitas`, `saude_vacinas`, `agenda_eventos`.
- Storage: bucket `saude`.
- Operacoes: `select`, `insert`, `update`, `delete`, upload.
- Campos usados: pessoas, consultas, medicamentos, vacinas, exames, documentos, datas, horarios e arquivos.
- Estados React: listas, pessoa ativa, forms, modais, uploads, filtros e loading.
- Calculos: proximas consultas, vencimentos, status de vacinas e indicadores.
- Filtros: `eq`, `gte`, `lte`, `order`, `limit`.
- Dependencias: `MeuDia` e `Agenda`.
- Riscos: perder informacoes sensiveis de saude ou links privados.
- Pode trocar visualmente: prontuario, cards, tabs, modal e empty states.
- Nao alterar: storage, tabelas, CRUD e integracao com agenda.
- Correspondencia no prototipo: bloco Saude do Meu Dia.

### 18. Apartamento

- Rota: `/contas/apartamento`.
- Arquivo: `src/contas/pages/Apartamento.jsx`.
- Tabelas: `apartamento_boletos`, `apartamento_documentos`, `apartamento_fotos`, `apartamento_garantias`, `apartamento_gastos`, `apartamento_inventario`, `apartamento_manutencoes`, `apartamento_prestadores`, `apartamento_projetos`.
- Operacoes: `select`, `insert`, `update`, `delete`, upload.
- Campos usados: boletos, documentos, fotos, garantias, gastos, inventario, manutencoes, prestadores e projetos.
- Estados React: listas, tab ativa, forms, modais, uploads, filtros e loading.
- Calculos: gastos, vencimentos, garantias e pendencias.
- Filtros: `eq`, `order`, datas.
- Dependencias: `MeuDia`.
- Riscos: quebrar anexos, garantias e boletos pendentes.
- Pode trocar visualmente: tabs, cards, tabelas, modais e upload.
- Nao alterar: CRUD, storage e filtros de vencimento.
- Correspondencia no prototipo: bloco Apartamento do Meu Dia.

### 19. Documentos

- Rota: `/contas/documentos`.
- Arquivo: `src/contas/pages/Documentos.jsx`.
- Tabelas: `documentos`, `documentos_arquivos`, `people`.
- Storage: bucket `documentos`.
- Operacoes: `select`, `insert`, `update`, `delete`, upload.
- Campos usados: nome, tipo, validade, pessoa, arquivos e metadados.
- Estados React: documentos, pessoas, form, filtros, upload, loading e deleting.
- Calculos: vencimentos e estados visuais.
- Filtros: `eq`, `order`.
- Dependencias: `MeuDia`.
- Riscos: trocar URL privada por publica ou perder anexo.
- Pode trocar visualmente: lista, cards, upload, modal e empty state.
- Nao alterar: bucket, paths, signed URLs e CRUD.
- Correspondencia no prototipo: documentos em desenvolvimento.

### 20. Metas

- Rota: `/contas/metas`.
- Arquivo: `src/contas/pages/Metas.jsx`.
- Tabelas: `cofrinhos`, `cofrinhos_aportes`.
- Operacoes: `select`, `insert`, `update`, `delete`.
- Campos usados: nome, tipo, objetivo, valor atual, cor, icone, status, data limite e aportes.
- Estados React: `cofrinhos`, `loading`, `filterTipo`, `showForm`, `editingId`, `detailCofrinho`, `aportes`, `aLoading`, `showAporte`, `form`, `aForm`, `saving`.
- Calculos: progresso, totais e historico de aportes.
- Filtros: `eq`, `order`.
- Dependencias: `MeuDia`.
- Riscos: progresso incorreto.
- Pode trocar visualmente: cards de meta, detalhe, formulario e progress bars.
- Nao alterar: CRUD e calculos de aporte.
- Correspondencia no prototipo: familia/casa futuro.

### 21. Lista de Compras

- Rota: `/contas/lista` redireciona para `/contas/cardapio`.
- Arquivo: `src/contas/pages/ListaCompras.jsx`.
- Tabelas: `shopping_items`.
- Operacoes: `select`, `insert`, `update`, `delete`.
- Campos usados: item, quantidade, checked, categoria/filtro.
- Estados React: `items`, `loading`, `text`, `qty`, `filter`, `saving`, `error`.
- Calculos: itens pendentes e marcados.
- Filtros: `eq`, `in`, `order`.
- Dependencias: `MeuDia` e `Cardapio`.
- Riscos: perder lista domestica.
- Pode trocar visualmente: checklist, input e filtros.
- Nao alterar: CRUD e estado checked.
- Correspondencia no prototipo: pendencias do Meu Dia.

### 22. Cardapio

- Rota: `/contas/cardapio`.
- Arquivo: `src/contas/pages/Cardapio.jsx`.
- Tabelas: nenhuma direta no arquivo auditado.
- Operacoes: nao aplicavel diretamente.
- Campos usados: semana, abas e dados internos do modulo.
- Estados React: `tab`, `semana`.
- Calculos: navegacao semanal.
- Filtros: nao aplicavel diretamente.
- Dependencias: `ListaCompras`.
- Riscos: quebrar experiencia de compras/refeicoes.
- Pode trocar visualmente: tabs, cards e navegacao semanal.
- Nao alterar: composicao e estado atual.
- Correspondencia no prototipo: familia/casa futuro.

## Mapa de componentes visuais propostos

Os componentes abaixo devem ser puros de UI. Nenhum deles deve acessar Supabase diretamente. Eles recebem dados e callbacks das paginas atuais.

| Componente | Responsabilidade | Props esperadas | Uso inicial | Logica |
|---|---|---|---|---|
| `AppShell` | Estrutura principal, sidebar, header e area de conteudo | `children`, `navGroups`, `activePath`, `onLogout`, `fab` | `Layout` | Apenas UI e callbacks |
| `Sidebar` | Navegacao desktop agrupada | `groups`, `activePath`, `onNavigate` | `Layout` | Sem dados externos |
| `BottomNavigation` | Navegacao mobile principal | `items`, `activePath`, `onNavigate` | `Layout` | Sem Supabase |
| `PageHeader` | Titulo, subtitulo, acoes e contexto | `title`, `description`, `actions`, `meta` | Todas as paginas | Sem logica |
| `MetricCard` | Indicador numerico premium | `label`, `value`, `delta`, `tone`, `icon`, `description` | Meu Dia, Dashboard, Lancamentos | Apenas formatacao |
| `SectionCard` | Container elevado para secoes | `title`, `description`, `actions`, `children` | Todas | Apenas UI |
| `StatusBadge` | Status visual consistente | `tone`, `children`, `icon` | Lancamentos, Fixas, Agenda, Saude | Apenas UI |
| `Button` | Botao padronizado | `variant`, `size`, `icon`, `children`, `disabled`, `onClick` | Todas | Callback externo |
| `IconButton` | Acao compacta | `icon`, `label`, `variant`, `onClick` | Tabelas/modais | Callback externo |
| `FormField` | Label, help, erro e input slot | `label`, `error`, `help`, `children` | NovaCompra, Configuracoes | Sem logica |
| `SelectField` | Select visual padronizado | `label`, `value`, `options`, `onChange` | Filtros/forms | Callback externo |
| `FilterBar` | Busca/filtros/limpar filtros | `search`, `filters`, `onSearch`, `onClear` | Lancamentos | Estado fica na pagina |
| `DataTable` | Tabela responsiva premium | `columns`, `rows`, `loading`, `empty`, `onRowClick` | Lancamentos | Recebe rows prontas |
| `EmptyState` | Estado vazio consistente | `icon`, `title`, `description`, `action` | Todas | Sem logica |
| `Skeleton` | Loading visual | `variant`, `rows` | Todas | Sem logica |
| `ModalShell` | Overlay/modal padrao | `open`, `title`, `children`, `onClose`, `actions` | Lancamentos, Fixas, NovaCompra | Sem regra de negocio |
| `ConfirmDialog` | Confirmacao destrutiva | `open`, `title`, `description`, `confirmLabel`, `onConfirm`, `onCancel` | Deletes | Acao vem da pagina |
| `ToastProvider` | Feedback visual | `children`, API local de toast | AppShell | Nao substitui erros de negocio |
| `DropdownMenu` | Menu flutuante | `items`, `anchor`, `open`, `onClose` | Tabelas/actions | Callbacks externos |

## Estrategia de migracao por fases

### FASE 0 - Auditoria e contratos

- Arquivos alterados: somente `CONTAS_V2_IMPLEMENTATION_PLAN.md`.
- Arquivos nao alterados: `src/contas/**`, Supabase, migrations, schemas.
- Riscos: auditoria incompleta.
- Testes: `git diff -- src/contas` deve ficar vazio.
- Criterio de aprovacao: plano aprovado pelo Bruno.
- Rollback: remover o documento.

### FASE 1 - Tokens e tipografia

- Arquivos alterados: novo arquivo de tokens CSS em `src/contas/styles/` ou camada isolada aprovada.
- Arquivos nao alterados: paginas, queries, handlers.
- Riscos: conflito com variaveis CSS atuais.
- Testes: build, navegacao completa, comparacao visual basica.
- Criterio: app igual em comportamento e com tokens disponiveis.
- Rollback: reverter commit da fase.

### FASE 2 - Componentes visuais basicos

- Arquivos alterados: novos componentes em `src/contas/components/ui/`.
- Arquivos nao alterados: paginas existentes, queries.
- Riscos: abstrair cedo demais.
- Testes: build e render isolado quando importado.
- Criterio: componentes sem Supabase e sem side effects.
- Rollback: remover pasta de componentes.

### FASE 3 - Layout e sidebar

- Arquivos alterados: `Layout.jsx`, CSS visual, componentes de shell.
- Arquivos nao alterados: `ContasApp.jsx`, paginas e rotas.
- Riscos: quebrar navegacao, logout, mobile drawer, FAB.
- Testes: acessar todas as rotas, logout, mobile 390px/768px.
- Criterio: todas as rotas continuam acessiveis.
- Rollback: reverter commit do Layout.

### FASE 4 - Meu Dia

- Arquivos alterados: `MeuDia.jsx` apenas na camada JSX/classes, possivelmente componentes visuais.
- Arquivos nao alterados: queries e `load()`.
- Riscos: esconder pendencias reais.
- Testes: comparar todos os blocos atuais antes/depois.
- Criterio: mesmos dados, nova hierarquia visual.
- Rollback: reverter commit da pagina.

### FASE 5 - Dashboard

- Arquivos alterados: `Dashboard.jsx` apenas visual/render e componentes.
- Arquivos nao alterados: `load()`, calculos, PDF, inserts de contas fixas.
- Riscos: totais divergentes, graficos quebrados, modais sem dados.
- Testes: mes anterior/proximo, totais, pessoas, categorias, PDF.
- Criterio: numeros identicos antes/depois.
- Rollback: reverter commit da pagina.

### FASE 6 - Lancamentos

- Arquivos alterados: `Lancamentos.jsx` apenas visual/render.
- Arquivos nao alterados: `load`, filtros, delete, update, `NovaCompra`.
- Riscos: filtros, edicao, conciliacao e exclusao.
- Testes: filtros combinados, busca, abrir modal, editar, excluir com confirmacao.
- Criterio: mesma lista filtrada para os mesmos filtros.
- Rollback: reverter commit da pagina.

### FASE 7 - Nova Compra

- Arquivos alterados: `NovaCompra.jsx` apenas visual/render.
- Arquivos nao alterados: `getMonthRef`, preview, payloads, splits, upload.
- Riscos: parcelamento e `month_ref`.
- Testes: compra simples, parcelada, split igual/manual, edicao, comprovante.
- Criterio: registros criados identicos aos da versao anterior.
- Rollback: reverter commit da pagina.

### FASE 8 - Contas Fixas e demais financeiros

- Arquivos alterados: `ContasFixas.jsx`, `Entradas.jsx`, `Acertos.jsx`, `Pessoas.jsx`, `Previsao.jsx`.
- Arquivos nao alterados: queries, inserts/deletes, calculos.
- Riscos: recorrencia, splits, acertos, previsao.
- Testes: gerar mes, editar valor mensal, dividir, acerto, previsao.
- Criterio: valores batem com Dashboard.
- Rollback: reverter commits por pagina.

### FASE 9 - Saude, Veiculos e Apartamento

- Arquivos alterados: `Saude.jsx`, `Veiculos.jsx`, `Apartamento.jsx`.
- Arquivos nao alterados: storage, buckets, CRUD, datas.
- Riscos: anexos privados e vencimentos.
- Testes: upload, visualizacao, CRUD basico e Meu Dia.
- Criterio: anexos e proximos eventos continuam funcionando.
- Rollback: reverter commits por modulo.

### FASE 10 - Demais paginas

- Arquivos alterados: `Agenda.jsx`, `Documentos.jsx`, `Metas.jsx`, `ListaCompras.jsx`, `Cardapio.jsx`, `Configuracoes.jsx`, `Login.jsx`.
- Arquivos nao alterados: Supabase, auth, rotas.
- Riscos: configuracoes globais e login.
- Testes: CRUD, login/logout, cards do Meu Dia.
- Criterio: comportamento identico.
- Rollback: reverter commits por pagina.

### FASE 11 - Dark mode, mobile e polish

- Arquivos alterados: tema visual, `Layout`, componentes UI e CSS.
- Arquivos nao alterados: paginas de negocio, queries e Supabase.
- Riscos: contraste, overflow, mobile navigation.
- Testes: 390px, 768px, 1280px, 1440px; light/dark; modais; tabelas.
- Criterio: UX aprovada em desktop e mobile.
- Rollback: reverter commit de tema/polish.

## Checklist manual de nao regressao

### Autenticacao

- Login com credenciais validas.
- Sessao persistente apos refresh.
- Rotas protegidas redirecionam sem sessao.
- Logout encerra sessao e volta para login.

### Dashboard

- Navegar mes anterior/proximo.
- Conferir totais do mes.
- Conferir gastos por pessoa.
- Conferir categorias.
- Conferir graficos.
- Abrir modal de categoria.
- Abrir modal de pessoa.
- Baixar PDF.

### Lancamentos

- Listagem por mes.
- Filtro por cartao.
- Filtro por pessoa.
- Filtro por fixo/variavel.
- Busca textual.
- Abrir detalhes.
- Editar lancamento.
- Excluir com confirmacao.
- Ver parcelamento exibido.
- Ver divisao entre pessoas.
- Marcar/desmarcar conciliado individual e em lote.

### Nova Compra

- Criar compra simples.
- Criar compra parcelada.
- Dividir igualmente.
- Dividir manualmente.
- Validar erro quando split nao fecha.
- Editar compra.
- Anexar comprovante.
- Conferir `month_ref` pelo fechamento do cartao.

### Contas Fixas

- Gerar ocorrencias mensais.
- Editar valor do mes.
- Editar divisao do mes.
- Editar template da conta.
- Criar nova conta fixa.
- Excluir com confirmacao.
- Conferir numero da parcela recorrente.

### Storage

- Upload de comprovante.
- Upload de documentos/saude/veiculos/apartamento nas fases correspondentes.
- Visualizacao por URL assinada quando o modulo usa storage privado.
- Nenhuma troca para public URL sem aprovacao tecnica especifica.

### Responsividade

- Desktop 1440px.
- Desktop 1280px.
- Tablet 768px.
- Mobile 390px.
- Bottom navigation no mobile.
- Sem overflow horizontal.
- Modais usaveis no mobile.

## Riscos principais

- Alterar acidentalmente regra de `month_ref` em `NovaCompra`.
- Duplicar ou deixar de gerar `bill_entries` em `Dashboard`/`ContasFixas`.
- Quebrar splits de `expense_splits` ou `bill_entry_splits`.
- Trocar visual e logica no mesmo commit, dificultando rollback.
- Transformar componentes visuais em componentes com acesso direto ao Supabase.
- Perder URLs/anexos privados em modulos com storage.
- Quebrar filtros locais ao trocar tabela por novo componente.
- Ocultar informacoes importantes em mobile.
- Alterar arquivos fora do escopo, especialmente `src/app/alimentares/*`.

## Ordem recomendada de implementacao

1. Aprovar este plano.
2. Implementar tokens e componentes visuais puros.
3. Migrar `Layout` para app shell premium.
4. Migrar `MeuDia`, por ser home e definir linguagem.
5. Migrar `Dashboard`, validando numeros antes/depois.
6. Migrar `Lancamentos`, validando filtros e CRUD.
7. Migrar `NovaCompra`, com teste manual forte de parcelamento e splits.
8. Migrar `ContasFixas`.
9. Migrar demais paginas financeiras.
10. Migrar casa, saude, veiculos, agenda e documentos.
11. Fechar dark mode, mobile, polish e QA geral.

## Confirmacao desta etapa

- Nenhum arquivo funcional de `src/contas` foi alterado nesta etapa.
- Nenhuma migration foi criada.
- Nenhum comando destrutivo de banco foi executado.
- Nenhum dado real foi apagado, recriado, resetado ou substituido.
- Nenhuma query Supabase foi alterada.
- Nenhum schema, policy, RLS, bucket ou autenticacao foi alterado.
- Esta branch nao deve receber merge sem aprovacao.
