# Refatoração visual: adotar identidade SISRAMOS

A plataforma hoje usa um tema escuro genérico (fundo `240 20% 5%`, primary teal). A referência "BOLETIM AMBIENTAL - SISRAMOS" usa um **tema claro institucional** com verde como cor de marca, fundo levemente esverdeado, cards brancos com sombras coloridas suaves, raio de borda 12–16px e tipografia fluida. O objetivo é replicar essa linguagem em todas as telas mantendo a funcionalidade atual.

## Direção visual

- **Tema claro como padrão.** Fundo da página `hsl(120 25% 98%)` com gradientes radiais verdes suaves nas bordas (igual ao SISRAMOS).
- **Verde institucional** (`hsl(122 38% 40%)`) como `--primary` e cor de acento de toda a interface (botões, chips ativos, anéis de foco, sidebar).
- **Cards** brancos (`--card: 0 0% 100%`) com `border-radius: 16px`, borda sutil verde 8% e sombra `0 8px 24px -12px verde/18%`. Hover sobe 4px com sombra mais intensa.
- **Sidebar** verde escuro (`hsl(122 30% 20%)`) com texto claro, idêntico ao SISRAMOS — substituindo o sidebar quase-preto atual.
- **Bottom-nav mobile**: fundo branco com borda superior, item ativo em verde.
- **Tipografia fluida** com `clamp()` para títulos (h1 1.75→2.5rem, h2 1.25→1.75rem) e classes utilitárias `.text-title / .text-subtitle / .text-label / .text-value`.
- **Sombras coloridas**: `--shadow-card`, `--shadow-card-hover`, `--shadow-glow-primary` tingidas de verde em vez de pretas.
- **Badges**: pílulas redondas (`--radius-full`) com fundo verde/amarelo/vermelho/azul a 10% e texto saturado — substitui os `StatusBadge` atuais sem mudar a semântica das cores de status.
- **Chips de projeto** no card de cliente: manter ícones e abreviações, mas usar fundo branco/cinza-claro com borda verde-suave; chips críticos (overdue/late) ganham borda vermelha em vez do contorno escuro atual.
- **Inputs/Selects**: borda cinza, foco com anel verde `0 0 0 3px verde/15%`.
- **Tabela** (`ClientDetail` desktop): linhas com borda-esquerda transparente que vira verde no hover, igual ao padrão SISRAMOS.

## Tokens a portar (em `src/index.css`)

Substituir o bloco `:root` atual por uma versão clara baseada no SISRAMOS:

- Escala `--primary-50..900` em verde.
- `--background: 0 0% 96%`, `--bg-page: 120 25% 98%`, `--foreground: 122 30% 15%`.
- `--card: 0 0% 100%`, `--popover: 0 0% 100%`, `--muted: 122 15% 92%`.
- `--primary: 122 38% 40%` + `--primary-foreground: 0 0% 100%`.
- `--border / --input: 220 13% 91%`, `--ring: 122 38% 40%`, `--radius: 0.75rem`.
- Sidebar verde escuro (mesmos valores acima).
- Manter tokens de **status do projeto** existentes (`--status-ok/warning/overdue/missing/requested/planned/late/na`) — esses já carregam significado de negócio; apenas reajustar luminosidade para um fundo claro (ex.: `--status-ok: 122 45% 38%`, `--status-overdue: 0 75% 50%`).
- Adicionar tokens de espaçamento, shadows e fluid type do SISRAMOS.
- Remover do `body` o `color-scheme: dark` e aplicar o gradiente radial verde fixo do SISRAMOS.

## Arquivos afetados

- `src/index.css` — reescrita dos design tokens, sombras, gradiente de fundo, utilitários (`.card-base`, `.section-header`, `.badge-base`, `.text-title/value/label`, `.grid-kpi`). Mantém safe-area e regra anti-zoom iOS já existentes.
- `tailwind.config.ts` — adicionar cor `sisramos.*`, expor `chart.*` com 6 slots e novos keyframes (`shimmer`, `gauge-fill`); pode adicionar `borderRadius.xl/2xl` se necessário.
- `src/components/project/AppShell.tsx` — sidebar/topbar/bottom-nav adaptados ao novo tema (sidebar verde, header branco, bottom-nav branca com item ativo verde).
- `src/components/project/ClientCard.tsx` — fundo branco, sombra `shadow-card`, chips com nova paleta clara, rodapé com texto cinza médio em vez de vermelho dessaturado.
- `src/components/project/status-ui.tsx` (StatusBadge / StatusDot) — usar a classe `.badge-base` + variantes de cor de status.
- `src/components/project/ResponsibleAvatar.tsx` — manter, apenas garantir contraste no fundo claro.
- `src/pages/Index.tsx` — KPIs usando `.card-base` + `.text-value`, headline com `.section-header`, FAB verde.
- `src/pages/ClientDetail.tsx` — cabeçalho do cliente em card branco, tabela com linhas e hover verde, cards mobile com mesma linguagem.
- `src/pages/Configure.tsx` — abas com indicador verde, linhas em cards claros, color picker com aro verde.
- `src/pages/Metrics.tsx` — paleta dos charts trocada para `chart-1..6` (já no Tailwind), legendas e eixos com `foreground` claro.
- `src/components/ui/*` — não editar diretamente; eles já consomem `--primary/--card/--border` e seguirão o tema automaticamente.

## Fora do escopo

- Mudanças em regra de negócio, dados ou estrutura de tabelas.
- Adicionar modo escuro novo (o tema escuro permanece definido para usuários do sistema mas a aplicação fica em claro por padrão, sem toggle).
- Reescrever ícones, layouts de página ou hierarquia de navegação além da troca de cores/sombras/raios.

## Como validar

Após a implementação: abrir `/`, `/cliente/:id`, `/metricas`, `/configurar` em 1280px e 375px; verificar contraste do texto verde-escuro no fundo claro, sombras visíveis sem "halo" duro, sidebar verde com itens ativos legíveis, chips de status mantendo leitura imediata (ok/atenção/atrasado/etc.), nenhum resíduo do fundo escuro anterior.
