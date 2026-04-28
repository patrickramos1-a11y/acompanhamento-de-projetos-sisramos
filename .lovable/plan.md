
# Plataforma de Acompanhamento de Projetos

Painel de controle de status de projetos por cliente para uma consultoria. Sem autenticação, dark mode, estética densa e profissional (estilo Linear/Vercel). Persistência via Lovable Cloud (Supabase).

## Modelo de dados (Supabase)

- **clients**: `id`, `name`, `code` (sigla, uppercase), `responsible` (opcional), `created_at`
- **project_types**: `id`, `name`, `abbreviation`, `display_order`, `is_active`, `created_at`
- **project_records**: `id`, `client_id`, `project_type_id`, `year` (nullable), `requested` (boolean), `notes` (opcional), `updated_at` — único por (client_id, project_type_id)
- **settings** (linha única): `validity_years` (default 5), `warning_years` (default 1)

Sem RLS restritiva (acesso público de leitura/escrita já que não há auth). Trigger/lógica no app: ao inserir um `client`, criar automaticamente um `project_record` em branco para cada `project_type` ativo. Ao criar um novo `project_type` ativo, criar registros em branco para todos os clientes existentes.

## Lógica de status (centralizada)

Uma única função `computeStatus(record, settings, currentYear)` retorna um dos cinco estados:

- **FALTA** — sem ano e não solicitado (cinza)
- **SOLICITADO** — sem ano, mas marcado como solicitado (azul)
- **OK** — ano + validade > currentYear + warning_years (verde)
- **ATENÇÃO** — vence dentro da janela de alerta (amarelo)
- **DEFASADO** — ano + validade ≤ currentYear (vermelho)

Funções derivadas: `worstStatus(records[])` para status geral do cliente, `complianceScore(records[])` = (OK + ATENÇÃO) / total ativos. Ordem de criticidade: DEFASADO > ATENÇÃO > FALTA > SOLICITADO > OK.

Tudo em `src/lib/status.ts` — nunca duplicado em componentes.

## Estrutura de navegação

Sidebar fixa à esquerda (shadcn sidebar, collapsible icon) com 4 itens:

```text
┌──────────┬─────────────────────────────┐
│ Painel   │                             │
│ Demandas │   Conteúdo da página        │
│ Métricas │                             │
│ Configurar│                            │
└──────────┴─────────────────────────────┘
```

## Páginas

### Painel (`/`)
- Topo: 4 cards de métricas (total clientes, defasados, vencendo este ano, conformidade média %)
- Barra de controles: busca por nome/sigla, ordenação (críticos / alfabética / conformidade asc/desc), chips de filtro por status
- Grade responsiva de cards de cliente:
  - Borda lateral colorida com a criticidade
  - Nome + sigla
  - Barra de progresso de conformidade
  - Linha de chips: abreviação + ano (ou traço), coloridos por status, com tooltip (nome completo, status, ano, válido até)
- Card clicável → `/clientes/:id`

### Detalhe do cliente (`/clientes/:id`)
- Header com nome, sigla, responsável, score de conformidade
- Tabela ordenada por criticidade: Tipo | Status (badge) | Ano | Válido até | Situação (faltam X / expirado há X) | Observações | Ações
- Edição inline via Popover por linha: input de ano, toggle "solicitado", textarea de observações, botão salvar
- Mutations via TanStack Query, toast de feedback

### Demandas (`/demandas`)
- Lista consolidada de todos os registros pendentes (DEFASADO, ATENÇÃO, FALTA, SOLICITADO)
- Filtros: status (multi), tipo de projeto, busca por cliente
- Toggle de visualização: lista plana / agrupado por cliente / agrupado por tipo
- Edição rápida do ano direto na linha (input + save inline)

### Métricas (`/metricas`)
4 visualizações Recharts:
1. Donut — distribuição de status global
2. Barras horizontais — conformidade por cliente (asc)
3. Barras empilhadas — pendências por tipo de projeto, stacked por status
4. Timeline visual — anos de `current-5` a `current+5` coloridos pela faixa (OK / ATENÇÃO / DEFASADO) conforme settings

### Configurar (`/configurar`)
Três abas (shadcn Tabs):

**Clientes**
- Tabela com nome, sigla, responsável, ações
- Modal "Novo cliente": nome, sigla (uppercase automático on input), responsável opcional
- Editar inline via modal
- Excluir: modal de confirmação que exige digitar a sigla exata
- Ao criar cliente: insert + bulk insert de `project_records` em branco

**Tipos de Projeto**
- Lista com drag-and-drop para reordenar (`@dnd-kit`)
- Adicionar (modal: nome, abreviação)
- Editar inline, switch ativo/inativo
- Inativos: filtrados das views mas dados preservados
- Ao adicionar tipo ativo: bulk insert de registros em branco para todos os clientes

**Configurações Gerais**
- Inputs numéricos para validade (anos) e antecedência do alerta (anos)
- Preview ao vivo da timeline de status reagindo aos valores
- Botão salvar persiste em `settings`

## Comportamentos globais

- **Skeletons** com formato do conteúdo esperado (cards, linhas de tabela) — sem spinner centralizado
- **Toasts** (sonner) em toda criação/edição/exclusão; erros Supabase capturados e exibidos
- **TanStack Query**: queries com `queryKey` por entidade, invalidação automática após mutations
- **Estados vazios** contextuais com CTA direto (ex: "Nenhum cliente cadastrado — Cadastrar agora" abre modal)
- **Confirmação destrutiva** sempre via AlertDialog
- **Computação de status** sempre via `src/lib/status.ts`

## Design system

- Dark mode por default (forçado), tokens HSL em `index.css`
- Fundos: `#0a0a0f` base, `#111118` superfícies; texto claro
- Cores semânticas de status (tokens): `--status-ok` (verde), `--status-warning` (amarelo), `--status-overdue` (vermelho), `--status-missing` (cinza), `--status-requested` (azul)
- Tipografia: DM Sans via Google Fonts
- Sem gradientes chamativos, sombras sutis, bordas finas, densidade alta (estilo Linear)
- Componentes shadcn customizados via tokens — sem cores hardcoded em componentes

## Detalhes técnicos

- Lovable Cloud habilitado para Supabase
- Migrations criam as 4 tabelas + linha default em `settings`
- Triggers/funções são feitas no app (não em SQL) para simplicidade: helpers `createClientWithBlankRecords` e `createProjectTypeWithBlankRecords`
- Roteamento: rotas adicionadas em `App.tsx` (`/`, `/clientes/:id`, `/demandas`, `/metricas`, `/configurar`)
- Layout shell com `SidebarProvider` envolvendo todas as rotas exceto NotFound
- Recharts já disponível via shadcn `chart.tsx`
- Drag-and-drop: adicionar `@dnd-kit/core` + `@dnd-kit/sortable`

## Entregáveis principais

1. Migration Supabase com as 4 tabelas + seed de `settings`
2. `src/lib/status.ts` com toda a lógica de status
3. Hooks de dados em `src/hooks/` (useClients, useProjectTypes, useRecords, useSettings) usando TanStack Query
4. Layout com sidebar + 4 páginas funcionais
5. Componentes reutilizáveis: `StatusBadge`, `ProjectChip`, `ClientCard`, `ComplianceBar`, `StatusTimelinePreview`
6. Design tokens dark com paleta de status no `index.css` e `tailwind.config.ts`
