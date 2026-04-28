## Refino visual dos chips e rodapé no ClientCard

Todas as mudanças ficam em `src/components/project/ClientCard.tsx`. Sem migrações, sem novos componentes.

### 1. Ícones únicos por status

Substituir o helper `chipIcon` para mapear cada status a um ícone distinto do `lucide-react`:

- `ok` → `CheckCircle2`
- `warning` → `Clock`
- `overdue` → `AlertTriangle`
- `late` → `AlarmClock`
- `planned` → `CalendarClock`
- `requested` → `RefreshCw`
- `missing` → `Minus`
- `na` → `Ban`

Todos renderizados em `h-3 w-3` (a cor vem do `chipClass`, herdando `currentColor`). Imports atualizados para incluir `CheckCircle2`, `CalendarClock`, `RefreshCw`, `Minus`, `Ban` e remover `Calendar`/`RotateCw`.

### 2. Conteúdo do chip (sem texto verbal de status)

Hoje há um `· atrasado` literal e nenhum dado de mês para late, e nada para warning. Ajustar a renderização interna do chip para:

- `ok`: mostrar `· {record.year}` quando houver
- `warning`: mostrar `· {record.year}` quando houver (novo)
- `overdue`: somente abreviação
- `late`: mostrar `· {formatPlannedFor(planned_for)}` (substituindo o `· atrasado` atual)
- `planned`: mostrar `· {formatPlannedFor(planned_for)}` (já existe)
- `requested`, `missing`, `na`: somente abreviação

O dado contextual continua com `opacity-80`. A abreviação fica em `<span class="truncate">` para nunca quebrar linha.

### 3. Estilo unificado dos chips + peso por criticidade

Reescrever `chipClass` para que todos os estilos usem **borda sólida** e cores explícitas, removendo o `border-dashed` de `missing` e `na`. As classes base do chip passam a ser fixas (height, padding, min-width, truncamento) e a borda crítica vira modificador:

Classe base aplicada a todos os chips (substitui o atual `inline-flex h-7 ... px-2`):

```
inline-flex items-center gap-1.5 rounded-md text-[11px] font-medium
h-7 min-w-[48px] px-1.5 py-1 max-w-full
```

(`h-7` = 28px; `px-1.5` = 6px; `py-1` = 4px; `min-w-[48px]` = 48px.)

`chipClass` por status (todas com `border` simples = 1px):

- `overdue`: `bg-[#2b0d0d] border-[#4a1a1a] text-[#f5a3a3] border-2` (2px)
- `late`: `bg-status-late/10 border-status-late/35 text-status-late border-2` (2px)
- `warning`: `bg-[#2b1f0d] border-[#4a3515] text-[#f5d27a] border`
- `ok`: `bg-[#0d2b1f] border-[#1a4a35] text-[#86e2b8] border`
- `requested`: `bg-[#0d1a2b] border-[#1a3050] text-[#8cc4f5] border`
- `planned`: `bg-status-planned/10 border-status-planned/35 text-status-planned border`
- `missing`: `bg-[#1e1e2a] border-[#3a3a4a] text-muted-foreground border` (sólido, sem dashed)
- `na`: `bg-transparent border-[#1f1f2a] text-muted-foreground/40 opacity-70 border` (sólido)

Como `border-2` sobrescreve o `border` base apenas onde aplicado, mantemos 1px nos demais.

A abreviação ganha `truncate`; o dado contextual fica `whitespace-nowrap` para não quebrar.

### 4. Rodapé mais sutil

No bloco de rodapé condicional:

- Container: trocar `border-border/40` por `border-border/20` (linha mais discreta) e manter `pt-2.5`.
- Cada `<p>` passa de `text-xs text-status-*` para `text-[11px] font-normal` com cores dessaturadas inline:
  - urgente (overdue): `text-[#c45c5c]`
  - atrasado (late): `text-[#c47a4a]` (laranja dessaturado, equivalente)
  - vencendo (warning): `text-[#c4a85c]`

Conteúdo dos textos permanece igual.

### Arquivos tocados

- `src/components/project/ClientCard.tsx` (único arquivo modificado)
