# QA mobile e correções

Fiz uma varredura nas rotas `/`, `/metricas`, `/configurar` em 375px. A maior parte da refatoração mobile anterior está sólida (bottom-nav, FAB, sheet de filtros, cards no detalhe, RecordEditor em bottom-sheet, tabs com scroll horizontal). Restam problemas localizados:

## Problemas encontrados

1. **Métricas — "Conformidade por cliente"**: o gráfico vertical corta os rótulos `% à direita` (margin right insuficiente) e a `YAxis` consome espaço demais no mobile, deixando as barras com menos de 60px úteis.
2. **Métricas — "Pendências por tipo"**: as siglas no `XAxis` se sobrepõem em telas estreitas (vide `LRBQCAT` no screenshot) — o critério atual só rotaciona quando há >6 tipos.
3. **Bottom-nav vs safe-area**: o `<nav>` fixo tem altura `h-14` *e* aplica `safe-pb` no próprio elemento — em iPhones com home-indicator o conteúdo do nav é espremido para cima.
4. **Métricas — Distribuição global**: a legenda em 2 colunas no mobile fica com texto truncado ("Defasado 2 · 40%" fica próximo do limite). Pequeno ajuste de espaçamento.
5. **Pie chart**: em viewport muito estreito o container pode ficar com largura < 240px e o pie "engole" parte do innerRadius. Garantir aspect.

## Correções

### `src/components/project/AppShell.tsx`
- Trocar `safe-pb` no `<nav>` por um wrapper externo com `padding-bottom: env(safe-area-inset-bottom)`, mantendo o nav com altura fixa de 56px.
- Ajustar `pb-24` do `<main>` para `pb-[calc(56px+env(safe-area-inset-bottom)+1rem)]` em mobile (mantendo `lg:pb-8` no desktop).

### `src/pages/Metrics.tsx`
- **Distribuição global**: tornar o container do pie quadrado (`aspect-square max-h-[260px]`) para evitar deformação; legenda passa a usar `grid-cols-1 sm:grid-cols-2` no mobile para evitar truncamento.
- **Conformidade por cliente**: aumentar `margin.right` de 48 → 56; limitar `YAxis width` a `min(96, ...)` no mobile; barSize 18 no mobile.
- **Pendências por tipo**: sempre rotacionar `-30°` em viewport < 640px usando `useIsMobile()`; reduzir font para 10 quando rotacionado; altura mínima 320px.
- **Carga por Responsável**: garantir `min-height 220px` quando vazio.

### `src/index.css`
- Adicionar utility `.pb-safe-nav` para o padding combinado nav+safe-area, evitando repetir o `calc(...)`.

## Fora do escopo

- Não mexer em lógica de negócio, queries ou tokens de cor.
- Não refazer a navegação (bottom-nav permanece).
- Sem alterações em Configure/ClientDetail (já estão ok no QA).

## Validação

Reabrir `/`, `/metricas`, `/configurar` e `/cliente/:id` em 375×812 e 768×1024 via browser, conferir:
- Nenhum overflow horizontal.
- Gráficos com rótulos legíveis e sem corte.
- Bottom-nav não cobre conteúdo nem fica espremido pelo safe-area.
