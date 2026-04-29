# Refatoração Mobile-First da Plataforma

Hoje a plataforma é desktop-first e tem vários pontos quebrados ou desconfortáveis no mobile (≤ 768px): sidebar consumindo altura no topo, tabela com scroll horizontal sem affordance, barra de filtros com 5 controles empilhados verticalmente, popovers/dialogs estourando viewport, alvos de toque pequenos. O objetivo é deixar toda a plataforma confortável em telas a partir de 360px sem regredir o desktop.

## Princípios

- Mobile-first: revisar cada tela começando por 375px e depois escalar.
- Alvos de toque mínimos 40×40px; espaçamentos em múltiplos de 4px.
- Substituir `Table` em mobile por **lista de cards** (mantém Table em ≥ md).
- Filtros e formulários longos viram **Sheet** (bottom sheet em mobile, lateral em desktop).
- Tipografia escalonada: `text-xl` no mobile / `text-2xl` no desktop para títulos; respeitar 16px mínimo em inputs (evita zoom no iOS).
- Safe-area: usar `env(safe-area-inset-*)` no rodapé fixo.

## Mudanças por área

### 1. AppShell — Navegação

Hoje o sidebar vira uma faixa horizontal no topo do mobile, ocupando espaço e com labels escondidas em telas estreitas.

- Mobile (< lg): **bottom navigation bar fixa** (3 itens: Painel, Métricas, Configurar), 56px de altura, ícone + label, com safe-area-inset-bottom. Header superior compacto (48px) só com logo e título da rota corrente.
- Desktop (≥ lg): mantém sidebar lateral 240px como hoje.
- Padding-bottom no `<main>` para não ficar atrás da bottom-nav.

### 2. Painel (`Index.tsx`)

Problemas atuais: barra de filtros com 5 controles empilhados ocupa ~400px verticais; cards de KPI em 1 coluna ficam enormes; busca + ordenação + 3 popovers atrapalham o fluxo.

- KPIs: grid `grid-cols-2` em mobile (4 cards principais), com "Conformidade média" em destaque ocupando linha inteira no topo. Tipografia menor (text-xl).
- Barra de ações: busca sempre visível em linha própria. Logo abaixo, **um único botão "Filtros"** que abre um **Sheet bottom** consolidando: ordenação (chips), tipos de projeto, status, responsáveis. Badge no botão indica quantidade de filtros ativos. Botão "Limpar todos" no rodapé do sheet.
- Cards de cliente: continuam em `grid-cols-1` no mobile, mas com padding interno reduzido (p-4) e chips em fonte 11px (já estão).
- FAB "Novo cliente" no canto inferior direito em mobile (acima da bottom-nav), substituindo o botão do header que fica oculto.

### 3. Detalhe do Cliente (`ClientDetail.tsx`)

Problema atual: a `Table` força scroll horizontal e fica ilegível.

- Mobile (< md): renderizar cada linha como **card** com layout vertical:
  - Linha 1: nome do tipo + StatusBadge à direita.
  - Linha 2: chips de "Ano · Válido até · Situação".
  - Linha 3 (opcional): avatar + nome do responsável.
  - Linha 4 (opcional): observações truncadas em 2 linhas.
  - Botão "Editar" full-width no rodapé do card.
- Desktop (≥ md): mantém `Table` como hoje.
- Header: stack vertical em mobile, score em destaque com barra full-width.

### 4. RecordEditor

Problema: `Popover` de 384px de largura estoura em telas < 400px.

- Mobile: trocar `Popover` por **Sheet** ascendente (bottom sheet) com altura adaptativa e scroll interno. Botão "Salvar" sticky no rodapé.
- Desktop: mantém `Popover` atual.
- Inputs com `text-base` (16px) para evitar zoom iOS.

### 5. Configurar

Problemas: `TabsList` com 4 abas estoura; `ResponsibleRow` em grid 5-col fica apertada; `ClientRow` perde o botão de salvar.

- `TabsList`: scroll horizontal em mobile (snap), com sombra de fade nas bordas.
- Linhas (`TypeRow`, `ClientRow`, `ResponsibleRow`): em mobile, layout em 2 linhas — primeira com avatar/nome editável, segunda com ações (switch + salvar + excluir) alinhadas à direita. Botões de ação 40×40px.
- Color picker: aumentar área clicável para 36×36px.
- Aba "Gerais": preview de validade rola horizontalmente em mobile; explicação em accordion para reduzir altura inicial.

### 6. Métricas

Problemas: gráficos de barras horizontais com nomes longos ficam ilegíveis; pizza + legenda lado-a-lado quebra mal em mobile.

- Distribuição global: pizza com legenda **abaixo** (não ao lado) em mobile.
- Conformidade por cliente / Carga por responsável: aumentar `barCategoryGap` e altura mínima por linha (44px → 48px no mobile); truncar nomes no `YAxis` com `width` adaptativo (clamp 80–120 em mobile).
- Pendências por tipo: altura aumentada para 320px em mobile, rotacionar labels do eixo X em -30° se houver mais de 6 tipos.
- Timeline: já é responsiva, mas reduzir para `grid-cols-3` em mobile pequeno.

### 7. Diálogos e tooltips

- Todos os `Dialog`/`AlertDialog`: aplicar `max-w-[calc(100vw-2rem)]` e `max-h-[90vh] overflow-y-auto` consistentemente.
- Tooltips dos chips: em touch devices, garantir que aparecem no `:active`/`:focus` (radix já cobre, mas validar). Adicionar long-press visual feedback.

### 8. Microajustes globais

- `index.css`: adicionar `html { -webkit-text-size-adjust: 100%; }` e safe-area em `body`.
- `tailwind.config.ts`: adicionar breakpoint `xs: 360px` se necessário para casos extremos.
- Criar utilitário `useIsMobile` já existente — usar consistentemente em vez de duplicar lógica.

## Arquivos afetados

- `src/components/project/AppShell.tsx` (reescrita para bottom-nav mobile)
- `src/pages/Index.tsx` (sheet de filtros + FAB + KPIs reorganizados)
- `src/pages/ClientDetail.tsx` (cards em mobile, Table em desktop)
- `src/pages/Configure.tsx` (linhas responsivas, tabs com scroll)
- `src/pages/Metrics.tsx` (gráficos com legenda abaixo / alturas adaptativas)
- `src/components/project/RecordEditor.tsx` (Sheet em mobile, Popover em desktop)
- `src/components/project/ClientCard.tsx` (ajustes finos de padding mobile)
- `src/index.css` (safe-area, text-size-adjust)
- Possivelmente novo: `src/components/project/MobileFiltersSheet.tsx` para extrair o sheet de filtros do Painel.

## Fora do escopo

- Mudanças de comportamento/regra de negócio.
- Redesign visual (cores, tipografia, identidade) — apenas ajustes de densidade.
- PWA / instalação como app nativo (pode ser feito num próximo passo se desejado).

## Como validar

Após implementar, testar com `browser--set_viewport_size` em 375×812 (iPhone SE/13), 390×844 (iPhone 14) e 768×1024 (iPad), tirar screenshots de cada rota e validar: nenhum scroll horizontal indesejado, todos os controles a 40px+, nenhum overlay estourando viewport, bottom-nav sem cobrir conteúdo.
