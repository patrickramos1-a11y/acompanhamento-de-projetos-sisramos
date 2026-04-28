Concordo: do jeito que está na captura, ainda há muito espaço vazio e a área plotada ficou pequena/centralizada demais dentro do card. Vou corrigir o gráfico para o card abraçar o conteúdo real.

Plano de ajuste em `src/pages/Metrics.tsx`:

1. Remover a folga vertical visível do card
   - Reduzir/remover o espaçamento abaixo do título do gráfico.
   - Garantir que o wrapper externo não tenha `min-height`, altura fixa ou classe que force o card a ficar alto.
   - Manter apenas `max-height: 600px` e `overflow-y-auto` para quando houver muitos clientes.

2. Fazer o gráfico usar a altura exata dos dados
   - Calcular a altura como:
     ```ts
     const complianceChartHeight = compliance.length * 44 + 40;
     ```
   - Passar essa altura diretamente para o `ResponsiveContainer`:
     ```tsx
     <ResponsiveContainer width="100%" height={complianceChartHeight}>
     ```
   - Para 1 cliente, a altura será 84px.

3. Corrigir a área interna do `BarChart`
   - Aplicar exatamente:
     ```tsx
     margin={{ top: 0, right: 60, left: 60, bottom: 0 }}
     ```
   - Manter `barSize={24}` fixo no `Bar`.
   - Evitar qualquer configuração que faça a barra esticar para preencher área vazia.

4. Ajustar a largura útil do gráfico
   - O eixo Y está consumindo espaço demais e empurrando a barra para uma área pequena.
   - Vou reduzir o `YAxis width` para algo mais adequado e manter nomes legíveis, para a barra começar mais perto do nome do cliente sem desperdiçar tanto espaço.

5. Manter os requisitos anteriores
   - Barras horizontais.
   - Nome completo da empresa no eixo Y.
   - Cores por faixa: vermelho, amarelo, verde.
   - Percentual ao final da barra.
   - Tooltip com nome, percentual e OK/total.
   - Scroll interno somente quando houver muitos clientes.

Resultado esperado: com 1 cliente, o card fica baixo, sem o grande vazio abaixo; a barra permanece com 24px de altura e o eixo ocupa apenas o necessário.