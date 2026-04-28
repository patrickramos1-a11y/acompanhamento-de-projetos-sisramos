export const RESPONSIBLE_PALETTE = [
  "#3b82f6", // azul
  "#22c55e", // verde
  "#8b5cf6", // roxo
  "#f97316", // laranja
  "#ec4899", // rosa
  "#06b6d4", // ciano
  "#ca8a04", // amarelo-escuro
  "#b91c1c", // vermelho-escuro
  "#14b8a6", // verde-água
  "#a78bfa", // lilás
];

export function nextDefaultColor(existingColors: string[]): string {
  const used = new Set(existingColors.map((c) => c.toLowerCase()));
  for (const c of RESPONSIBLE_PALETTE) {
    if (!used.has(c.toLowerCase())) return c;
  }
  return RESPONSIBLE_PALETTE[existingColors.length % RESPONSIBLE_PALETTE.length];
}

export function getInitial(name: string): string {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}
