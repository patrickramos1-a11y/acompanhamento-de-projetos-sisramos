# Preview reativo das regras de validade

Refatorar a aba **Gerais** em `src/pages/Configure.tsx` para substituir os três badges atuais (linhas 174-178) por um bloco de preview vivo, que reage em tempo real aos valores de `validity` e `warning` digitados.

## Estrutura do novo bloco

Logo abaixo dos dois `Input` numéricos e antes do botão Salvar:

### Parte 1 — Timeline horizontal por ano

- Range: do ano `current - (validity + 2)` até `current`, inclusive.
- Cada ano = uma célula em uma grade horizontal (`flex flex-wrap gap-2` ou `grid` com `grid-cols-*` responsivo, scroll-x se necessário em telas pequenas).
- Cor da célula calculada via `computeStatus({ year, requested: false }, { validity_years: validity, warning_years: warning }, current)` — recalculado a cada render.
- Tokens de cor já existentes em `src/index.css` / `tailwind.config.ts`:
  - `ok` → `bg-status-ok/15 border-status-ok/40 text-status-ok` + ícone `Check`
  - `warning` → `bg-status-warning/15 border-status-warning/40 text-status-warning` + ícone `Clock`
  - `overdue` → `bg-status-overdue/15 border-status-overdue/40 text-status-overdue` + ícone `AlertTriangle`
- Conteúdo da célula: ícone no topo, ano abaixo (`text-xs font-medium`).
- Célula do `current`: anel/sublinhado de destaque (`ring-1 ring-primary` + chip "hoje" abaixo do ano).
- Defensivo: se `validity < 1` ou `warning < 0` ou `NaN`, renderizar um aviso curto ("Informe valores válidos") em vez da timeline.

### Parte 2 — Resumo em linguagem natural

Três linhas (uma `<p>` por status) abaixo da timeline, com ícone à esquerda e texto. Anos derivados:

- `anoOk = current - (validity - warning - 1)` → "Projetos realizados em **{anoOk}** ou depois estão OK"
- `anoAtencao = current - (validity - warning)` → "Projetos realizados em **{anoAtencao}** vencem este ano e precisam ser renovados"
- `anoDefasado = current - validity` → "Projetos realizados em **{anoDefasado}** ou antes estão expirados"

Se `warning >= validity`, omitir a linha de atenção e mostrar nota: "Antecedência maior ou igual à validade — nenhum ano fica em atenção."

## Observações técnicas

- Tudo client-side, derivado dos `useState` `validity` e `warning` já existentes (sem novos states, sem efeitos extras). `useMemo` opcional para a lista de anos.
- Reaproveitar `computeStatus` e `statusMeta` de `src/lib/status.ts` para manter consistência com Métricas e ClientCard.
- Ícones de `lucide-react` (`Check`, `Clock`, `AlertTriangle`) — já usado no projeto.
- Botão **Salvar** permanece exatamente como está, no fim do bloco.
- Sem mudanças em DB, hooks, rotas ou outras abas.

## Arquivos afetados

- `src/pages/Configure.tsx` — única alteração: trocar o `<div className="grid grid-cols-3 ...">` (linhas 174-178) pelo novo preview com timeline + resumo.
