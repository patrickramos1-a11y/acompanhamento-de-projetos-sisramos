## Objetivo

Adicionar a opção **"Não vence"** nos registros de projeto, para casos em que o projeto não possui data de validade (uma vez concluído, permanece válido indefinidamente).

## Comportamento

- Novo toggle no editor de registro (`RecordEditor`), abaixo de "Não aplicável".
- Quando ativado:
  - O campo **Ano concluído** continua disponível (precisa registrar quando foi feito).
  - "Solicitado" e "Planejado" ficam desativados (não fazem sentido para algo já entregue sem validade).
  - O status calculado é sempre **OK** (verde), ignorando `validity_years` e `warning_years`.
  - "Válido até" exibe **"Não vence"** em vez de um ano.
  - `statusDistance` retorna "Válido por tempo indeterminado".
- Mutuamente exclusivo com "Não aplicável".

## Mudanças técnicas

### Banco (`supabase--migration`)
- Adicionar coluna `no_expiration boolean NOT NULL DEFAULT false` em `project_records`.

### `src/lib/status.ts`
- Adicionar `no_expiration?: boolean | null` em `StatusRecord`.
- Em `computeStatus`: se `no_expiration && year` → retorna `"ok"` direto.
- `validUntil`: aceitar flag e retornar `null` (caller exibe "Não vence").
- `statusDistance`: tratar caso "Válido por tempo indeterminado".

### `src/components/project/RecordEditor.tsx`
- Novo estado `noExpiration` + Switch dedicado (estilo igual ao "Não aplicável", borda destacada quando ativo).
- Reset/lógica de exclusividade com `notApplicable`.
- Desabilitar Solicitado/Planejado quando `noExpiration` ativo.
- Enviar `no_expiration` no `mutateAsync`.

### `src/hooks/useProjectData.ts`
- Garantir que `no_expiration` faz parte do tipo `ProjectRecord` e é persistido no update (verificar o whitelist atual).

### Exibição (`ClientDetail.tsx`, `ClientCard.tsx`, `Metrics.tsx`)
- Onde mostra "Válido até": se `no_expiration`, exibir **"Não vence"**.
- Conformidade: registros `no_expiration` contam como "ok" (já automático via `computeStatus`).
- Pequeno indicador textual em vez do ano (ex.: `∞` ou "Sem validade") no card mobile e na tabela.

## Fora de escopo

- Mudanças visuais gerais, navegação, métricas (apenas o ajuste de label "Não vence").
- Migração retroativa de dados existentes.
