## Objetivo

Adicionar dois novos estados aos projetos: **N/A (Não aplicável)** e **PLANEJADO** (com derivação automática para **ATRASADO**).

---

## 1. Banco de dados

Adicionar três colunas em `project_records`:

- `not_applicable` — `boolean NOT NULL DEFAULT false`
- `planned` — `boolean NOT NULL DEFAULT false`
- `planned_for` — `date NULL` (armazena o primeiro dia do mês escolhido — usaremos só mês/ano na UI)

Migração via tool de migração Supabase. RLS já é "Public full access" — sem mudanças.

---

## 2. Lógica de status (`src/lib/status.ts`)

Estender `StatusKey` para: `"na" | "missing" | "requested" | "planned" | "ok" | "warning" | "late" | "overdue"`.

`StatusRecord` ganha: `not_applicable`, `planned`, `planned_for` (Date | null).

`computeStatus` atualizado, em ordem de avaliação:
1. `not_applicable` → `na`
2. `year` preenchido → mantém lógica atual (`ok`/`warning`/`overdue`)
3. `planned` + `planned_for`:
   - data futura → `planned`
   - data passada e sem `year` → `late`
4. `requested` → `requested`
5. caso contrário → `missing`

**Hierarquia de severidade (rank — maior = mais crítico):**
```
overdue: 7
late:    6   ← novo (entre overdue e warning)
warning: 5
missing: 4
late já entra acima de missing conforme pedido
requested: 3
planned: 2   ← novo
ok:      1
na:      0   ← excluído de cálculos
```

Ajuste: o pedido diz "ATRASADO entre ATENÇÃO e FALTA, pior que FALTA mas menos crítico que DEFASADO". Então a ordem final será:
`overdue (7) > late (6) > warning (5) > missing (4) > requested (3) > planned (2) > ok (1) > na (0)`.

`statusMeta` ganha entradas:
- **na**: label "N/A", short "N/A", classes cinza neutro com borda tracejada apagada.
- **planned**: label "Planejado", azul-roxo (`indigo/violet`), ícone `Calendar`.
- **late**: label "Atrasado", laranja (`orange`), ícone `AlarmClockOff` ou `ClockAlert`.

**Tokens CSS novos** em `src/index.css`:
- `--status-planned: 250 70% 60%` (azul-roxo)
- `--status-late: 25 90% 55%` (laranja)
- `--status-na: 220 8% 35%` (cinza apagado)

E equivalentes em `tailwind.config.ts` dentro de `colors.status`.

`complianceScore` filtra `na` antes de calcular (denominador exclui N/A). `worstStatus` ignora `na`.

---

## 3. Popover de edição (`src/components/project/RecordEditor.tsx`)

Layout reorganizado:

1. **Toggle "Não aplicável"** (com descrição "Este projeto não é exigido para este cliente"). Quando ativo:
   - Desabilita: campo Ano, toggle Solicitado, toggle Planejado, campo Previsão, Observações permanece habilitado.
   - Força os outros toggles para `false` ao ativar.

2. **Campo Ano concluído** (já existe).

3. **Toggle "Solicitado"** — ao ativar, desativa "Planejado" automaticamente.

4. **Toggle "Planejado"** — ao ativar, desativa "Solicitado". Quando ativo, aparece:
   - **Campo "Previsão de entrega"**: dois selects (mês + ano) — sem dia. Salvo como `YYYY-MM-01`.
   - Validação: obrigatório quando `planned` está ativo. Bloqueia o submit com mensagem inline se vazio.

5. **Observações** (já existe).

Mutation `useUpdateProjectRecord` recebe os novos campos. Ao marcar `not_applicable`, zeramos `requested`, `planned`, `planned_for`, `year`.

---

## 4. ClientCard (`src/components/project/ClientCard.tsx`)

- `chipClass` ganha:
  - `na`: `bg-transparent border border-dashed border-[#2a2a3a]/60 text-muted-foreground/50` (mais apagado que `missing`).
  - `planned`: azul-roxo suave.
  - `late`: laranja, mesmo tratamento visual de alerta que `warning`.
- `chipIcon`: `planned` → `Calendar`, `late` → `AlarmClockOff`.
- Ordenação dos chips: usar rank atual + jogar `na` sempre por último (independente do rank).
- Conteúdo do chip:
  - `planned` → `{abbreviation} · {MMM/YY}`
  - `late` → `{abbreviation} · atrasado`
- `borderClass` considera `late` como crítico (mesmo nível visual de `warning` ou superior). Atualizar para: overdue → vermelho; senão se há `late` → laranja; senão warning → amarelo; etc.
- Subtexto/contadores incluem `late` (ex.: "2 atrasados") e ignoram `na`.
- Barra de progresso e score já refletem nova `complianceScore` (N/A excluído).

---

## 5. Painel (`src/pages/Index.tsx`)

- Adicionar opções de filtro de status: `planned`, `late`, `na` no array `filters`.
- Cards N/A continuam aparecendo normalmente — só os chips internos é que ficam apagados.

---

## 6. ClientDetail (`src/pages/ClientDetail.tsx`)

- A tabela já mostra StatusBadge com base em `computeStatus` — automaticamente ganha os novos estados.
- Linha "Válido até" e "Situação" para `planned` mostram a data de previsão; para `late` mostram "Atrasado desde {MMM/YY}"; para `na` mostram "—" / "Não aplicável".
- Ordenação por criticalidade já usa rank — funciona automaticamente.

---

## 7. Demandas (`src/pages/Demands.tsx`)

- `late` deve aparecer como pendência (filtro atual já exclui apenas `ok`; vamos também excluir `na` e `planned` da lista padrão de demandas — `planned` ainda não é pendência).
- Adicionar `late` ao select de status.
- Ordenação por rank já cuida da posição (atrasados aparecem entre defasados e em atenção).

---

## 8. Métricas (`src/pages/Metrics.tsx`)

- `chartColor` ganha `planned`, `late`, `na` usando os novos tokens.
- `statusOrder` atualizado para incluir os novos — donut de "Distribuição global" mostra `late` como fatia laranja própria. `na` aparece como fatia cinza apagada (ou pode ser excluído do donut por ser "não exige" — manter como fatia separada para visibilidade, conforme já é prática mostrar tudo).
- Conformidade por cliente já usa `complianceScore` corrigido (N/A excluído do denominador).
- Pendências por tipo: novos status entram como stack adicional.

---

## Detalhes técnicos resumidos

```
status.ts
─ StatusKey += "na" | "planned" | "late"
─ StatusRecord += not_applicable, planned, planned_for
─ computeStatus: na → year → planned/late → requested → missing
─ statusMeta: 3 novas entradas com classes Tailwind status-*
─ statusOrder: ["overdue","late","warning","missing","requested","planned","ok","na"]
─ complianceScore/worstStatus: ignoram "na"

RecordEditor.tsx
─ states: notApplicable, planned, plannedYear, plannedMonth (+ existentes)
─ mútua exclusão entre requested/planned
─ disabled chain quando notApplicable
─ validação: planned requer plannedYear+plannedMonth

ClientCard.tsx
─ chipClass/chipIcon: cases novos
─ ordenação: rank + na por último
─ borderClass: incluir late como crítico

Migração SQL
─ ALTER TABLE project_records ADD COLUMN not_applicable boolean NOT NULL DEFAULT false
─ ADD COLUMN planned boolean NOT NULL DEFAULT false
─ ADD COLUMN planned_for date
```

Arquivos editados: `src/lib/status.ts`, `src/lib/project-view.ts`, `src/components/project/RecordEditor.tsx`, `src/components/project/ClientCard.tsx`, `src/pages/Index.tsx`, `src/pages/ClientDetail.tsx`, `src/pages/Demands.tsx`, `src/pages/Metrics.tsx`, `src/index.css`, `tailwind.config.ts`. Mais 1 migração SQL.