## Redesign dos cards de cliente — Painel

Refatorar `src/components/project/ClientCard.tsx` mantendo a lógica de dados intacta (`computeStatus`, `complianceScore`, `worstStatus`, `validUntil`) e apenas reconstruindo a apresentação.

### Estrutura

Três zonas verticais com gap de 10px, padding 16px, `rounded-lg` (8px), borda 1px dinâmica conforme pior status, sem sombra.

**Cabeçalho**
- Linha 1: nome do cliente (`text-lg font-bold`, truncado) à esquerda; porcentagem à direita com cor dinâmica:
  - `≥ 70%` → verde (`text-status-ok`)
  - `40–69%` → amarelo (`text-status-warning`)
  - `< 40%` → vermelho (`text-status-overdue`)
- Linha 2 (subtexto): contagem por status crítico, cada trecho com sua cor. Ex: `2 defasados · 1 vencendo · 2 faltando`. Se nada pendente → `Todos os projetos em dia` em verde. Sem mostrar `OK` ou `Solicitado` na contagem (apenas `overdue/warning/missing`).

**Corpo**
- Barra de progresso 6px, `rounded-full`, fundo `bg-muted/40`, preenchimento na cor dinâmica da porcentagem (mesma regra acima).
- Chips dos projetos abaixo, ordenados por criticidade (overdue → warning → missing → requested → ok), todos com altura fixa (`h-7`), padding compacto, fonte `text-[11px] font-medium`:
  - **FALTA**: fundo transparente, borda tracejada cinza, texto cinza claro, só abreviação.
  - **DEFASADO**: fundo `#2b0d0d`, borda `#4a1a1a`, texto vermelho claro, ícone `AlertTriangle` antes da abreviação.
  - **ATENÇÃO**: fundo `#2b1f0d`, borda `#4a3515`, texto amarelo, ícone `Clock` antes da abreviação.
  - **OK**: fundo `#0d2b1f`, borda `#1a4a35`, texto verde, abreviação `· ano`.
  - **SOLICITADO**: fundo `#0d1a2b`, borda `#1a3050`, texto azul, ícone `RotateCw` antes da abreviação.
- Tooltip preservado (nome completo do tipo, status, validade, distância).

**Rodapé (condicional)**
- Renderiza apenas se houver ≥1 projeto `overdue` ou `warning`.
- Separador sutil (`border-t border-border/40`) seguido de texto `text-xs`:
  - Se houver `overdue`: vermelho — `Renovação urgente: <abrevs separadas por vírgula>`
  - Senão se houver `warning`: amarelo — `Vence este ano: <abrevs>`
- Se houver ambos, mostra duas linhas (urgente em cima, atenção embaixo).

**Borda dinâmica do card**
- `overdue` presente → borda vermelho muito escuro (ex.: `border-status-overdue/25`)
- senão `warning` → amarelo escuro (`border-status-warning/25`)
- senão se tudo `ok` (sem missing) → verde escuro (`border-status-ok/20`)
- caso contrário (apenas missing) → `border-border` padrão

Hover: leve aumento da opacidade da borda (`hover:border-*/40`), sem translate nem sombra.

### Detalhes técnicos

- Apenas `src/components/project/ClientCard.tsx` é alterado. Nenhum hook, query, tipo ou rota muda.
- Cores específicas dos chips (#2b0d0d etc.) aplicadas como classes arbitrárias do Tailwind: `bg-[#2b0d0d] border-[#4a1a1a] text-[#f5a3a3]` e equivalentes — preserva o tema escuro existente sem precisar criar tokens novos.
- Contagem por status: derivada de `statuses.filter(s => s === 'overdue').length` etc.
- Ordenação dos chips: array de tipos mapeado para `{type, record, status}` e ordenado pelo `rank` em `statusMeta` (decrescente).
- Lista de abreviações no rodapé: filtrada pelos itens com status `overdue` / `warning` correspondente.
- Ícones: `AlertTriangle`, `Clock`, `RotateCw` de `lucide-react` (já em uso no projeto). `ArrowUpRight` removido para simplificar o cabeçalho conforme o novo design (sem ícone de link).
- Acessibilidade: o card permanece um `<Link>` clicável; tooltips mantidos.

### Itens fora de escopo

- Lógica de status, queries Supabase, página `Index.tsx` e demais cards/listas.
- Criação de novos tokens de cor no `index.css` (usaremos hex inline conforme especificação).