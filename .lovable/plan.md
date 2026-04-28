
## Responsáveis — implementação

### 1. Banco de dados (1 migração)

Nova tabela `responsibles`:
- `id uuid pk default gen_random_uuid()`
- `name text not null`
- `created_at`, `updated_at timestamptz` com defaults
- RLS: `Public full access` (mesmo padrão das outras tabelas)
- Trigger `update_updated_at_column` em `BEFORE UPDATE`

Em `project_records`, adicionar:
- `responsible_id uuid null references public.responsibles(id) on delete set null`

`on delete set null` garante que excluir um responsável apenas remove o vínculo, sem apagar projetos.

### 2. Camada de dados (`src/hooks/useProjectData.ts`)

- Novo tipo `Responsible = Tables<"responsibles">`
- Hooks: `useResponsibles`, `useCreateResponsible`, `useUpdateResponsible`, `useDeleteResponsible`
- Incluir `responsibles` em `usePlatformData` e em `invalidateAll`
- `useUpdateProjectRecord` já aceita `TablesUpdate<"project_records">` — passa a aceitar `responsible_id` automaticamente

### 3. Configurar — nova aba "Responsáveis" (`src/pages/Configure.tsx`)

- Adicionar `<TabsTrigger value="responsibles">Responsáveis</TabsTrigger>` entre "Tipos" e "Gerais"
- `<TabsContent value="responsibles">` com:
  - Botão "Novo Responsável" → modal `CreateResponsibleDialog` (1 campo Nome)
  - Lista de cards `ResponsibleRow` mostrando nome editável + contagem `N projetos atribuídos` (calculada a partir de `records.data`)
  - Ícones de salvar (quando dirty) e excluir
  - `AlertDialog` de exclusão: se contagem > 0, exibe aviso "Este responsável está atribuído a X projetos. Removê-lo deixará esses projetos sem responsável." e mantém botão "Excluir" habilitado

### 4. Popover de edição (`src/components/project/RecordEditor.tsx`)

Dentro do bloco `Planejado` (visível somente quando `planned === true`), abaixo dos selects de mês/ano:
- Novo `<Select>` "Responsável" com opção `"none"` ("Sem responsável") + lista de responsáveis (ordenada alfabeticamente)
- Estado `responsibleId: string | null`, inicializado de `record.responsible_id`
- No submit, `responsible_id: planned ? responsibleId : null` (zera se Planejado for desligado, junto com os demais resets atuais)

### 5. Painel — filtro Responsável (`src/pages/Index.tsx`)

- Novo `Select` single-select à direita dos filtros existentes:
  - Trigger "Filtrar por responsável" / nome selecionado
  - Itens: "Todos" + lista de responsáveis
- Estado `responsibleFilter: string | "all"`
- No `useMemo` de `rows`: quando filtro ativo, manter apenas clientes onde algum record tem `planned === true` e `responsible_id === filtro`
- Passar `highlightResponsibleId` para `ClientCard`. Nos chips `planned`, quando `record.responsible_id === highlightResponsibleId`, adicionar um pequeno ponto colorido (`<span class="h-1.5 w-1.5 rounded-full bg-status-planned/80">`) antes da abreviação para identificar quais projetos pertencem a ele

### 6. Métricas — Carga por Responsável (`src/pages/Metrics.tsx`)

Nova `<section>` abaixo da timeline:
- Calcular agregação: para cada responsável, contar records onde `planned === true` e `responsible_id === r.id`, separando em `planned` (no prazo) vs `late` (atrasado), via `computeStatus`
- Filtrar fora responsáveis com total 0
- Se array vazio → estado vazio "Nenhum projeto planejado atribuído ainda"
- Senão → `BarChart` horizontal (`layout="vertical"`) com duas barras stackadas:
  - `dataKey="planned"` cor `hsl(var(--status-planned))`
  - `dataKey="late"` cor `hsl(var(--status-late))`
  - Tooltip customizado com nome, total, no prazo (com lista de abreviações), atrasados (com lista de abreviações)

### 7. Resumo de arquivos

- 1 migração SQL (`responsibles` + coluna FK em `project_records` + trigger + RLS)
- `src/hooks/useProjectData.ts` — tipos e hooks
- `src/pages/Configure.tsx` — nova aba e modal
- `src/components/project/RecordEditor.tsx` — campo no bloco Planejado
- `src/pages/Index.tsx` — filtro single-select e prop de destaque
- `src/components/project/ClientCard.tsx` — indicador no chip planejado destacado
- `src/pages/Metrics.tsx` — gráfico Carga por Responsável

`src/integrations/supabase/types.ts` é regenerado automaticamente após a migração.
