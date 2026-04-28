## Ajuste de altura — gráfico "Conformidade por cliente"

Eliminar definitivamente o espaço vertical sobrando no card do gráfico de barras horizontais em `src/pages/Metrics.tsx`.

### Mudanças

1. **Altura do `ResponsiveContainer`**: trocar `Math.max(200, n * 44)` por exatamente `compliance.length * 44 + 40` — sem mínimo. Com 1 cliente = 84px.
2. **Margins do `BarChart`**: trocar `{ left: 8, right: 48, top: 8, bottom: 8 }` por `{ top: 0, right: 60, left: 60, bottom: 0 }` para zerar folga vertical interna.
3. **`barSize`**: trocar 22 por **24** fixo, garantindo que a barra não estique.
4. **Card externo**: garantir que não há `min-height` no `<div className="rounded-lg border bg-card p-4">` — confirmado, não há; o card encolhe naturalmente para abraçar o conteúdo.
5. **Limpeza**: remover um `</div>` órfão remanescente do refactor anterior (linha 108) que está quebrando a indentação da estrutura JSX.

Sem alterações nos demais gráficos da página.