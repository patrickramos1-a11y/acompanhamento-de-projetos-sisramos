## Avatar colorido por responsável

### 1. Banco de dados

Migração adicionando coluna `color` em `responsibles`:
- `color text not null default '#3b82f6'`
- Sem CHECK constraint (validação visual no front).

### 2. Paleta padrão

Novo arquivo `src/lib/responsible-colors.ts` exportando:
- `RESPONSIBLE_PALETTE`: array de 10 cores hex distintas
  - azul `#3b82f6`, verde `#22c55e`, roxo `#8b5cf6`, laranja `#f97316`, rosa `#ec4899`, ciano `#06b6d4`, amarelo-escuro `#ca8a04`, vermelho-escuro `#b91c1c`, verde-água `#14b8a6`, lilás `#a78bfa`
- `nextDefaultColor(existingColors: string[])`: retorna a primeira cor da paleta que ainda não foi usada; se todas foram usadas, retorna `RESPONSIBLE_PALETTE[existing.length % 10]`
- `getInitial(name: string)`: primeira letra maiúscula do nome (com fallback `?`)

### 3. Componente reutilizável `ResponsibleAvatar`

Novo `src/components/project/ResponsibleAvatar.tsx`:
- Props: `name: string`, `color: string`, `size?: number` (default 18), `withTooltip?: boolean` (default true)
- Render: `<span>` circular com `backgroundColor: color`, texto branco em negrito, tamanho do texto proporcional (`size * 0.55`)
- Quando `withTooltip`, envolve em `Tooltip` mostrando o nome completo

### 4. Configurar — aba Responsáveis (`src/pages/Configure.tsx`)

`CreateResponsibleDialog`:
- Ao submeter, calcular `color = nextDefaultColor(responsibles.data.map(r => r.color))` e enviar junto com `name`
- Necessita receber a lista de responsáveis existentes via prop ou ler via `useResponsibles()` dentro do componente

`ResponsibleRow`:
- Adicionar coluna de cor entre o nome e a contagem
- Layout do grid: `[avatar_color_picker | input_nome | contagem | save | delete]`
- Mostrar `ResponsibleAvatar` (24px) + `<input type="color" value={color} onChange={...}>` estilizado pequeno (≈28x28px, sem borda visual nativa)
- Estado local `color`, marcar `dirty` se nome OU cor mudaram
- Botão Salvar envia `{ name, color }` num único `update.mutate`

### 5. Painel — chips com avatar (`src/components/project/ClientCard.tsx`)

- Adicionar prop `responsibles: Responsible[]`
- Construir `responsibleMap: Map<string, Responsible>` no início
- No render dos chips: para status `planned` ou `late` que tenham `record.responsible_id`, buscar o responsável e renderizar `<ResponsibleAvatar size={18} name={r.name} color={r.color} />` ao final do chip (margem-esquerda 4px)
- Atualizar `Index.tsx` para passar `responsibles={responsibles.data ?? []}` ao `ClientCard`

### 6. Detalhe do cliente — coluna Responsável (`src/pages/ClientDetail.tsx`)

- Adicionar `responsibles` ao destructuring de `usePlatformData()`
- Calcular `hasAnyResponsible = rows.some(r => r.record?.responsible_id)`
- Se true, renderizar `<TableHead>Responsável</TableHead>` entre "Situação" e "Observações" e a célula correspondente em cada linha:
  - Com responsável: `<ResponsibleAvatar size={24} name={r.name} color={r.color} withTooltip={false} />` + `<span class="text-sm">{r.name}</span>`
  - Sem: `—`
- Atualizar o `colSpan={5}` da linha "Registro ainda não criado" para `colSpan={6}` quando a coluna estiver visível

### 7. Tipos Supabase

`src/integrations/supabase/types.ts` é regenerado automaticamente após a migração — `Responsible.color` ficará disponível.

### Arquivos tocados

- 1 migração SQL
- `src/lib/responsible-colors.ts` (novo)
- `src/components/project/ResponsibleAvatar.tsx` (novo)
- `src/pages/Configure.tsx`
- `src/components/project/ClientCard.tsx`
- `src/pages/Index.tsx` (passar prop `responsibles`)
- `src/pages/ClientDetail.tsx`
