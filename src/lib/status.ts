export type StatusKey =
  | "na"
  | "missing"
  | "requested"
  | "planned"
  | "ok"
  | "warning"
  | "late"
  | "overdue";

export type StatusRecord = {
  year: number | null;
  requested: boolean;
  not_applicable?: boolean | null;
  planned?: boolean | null;
  planned_for?: string | null; // ISO date string YYYY-MM-DD
  no_expiration?: boolean | null;
};

export type StatusSettings = {
  validity_years: number;
  warning_years: number;
};

export const statusMeta: Record<StatusKey, { label: string; short: string; rank: number; className: string; dotClassName: string }> = {
  overdue: {
    label: "Defasado",
    short: "DEF",
    rank: 7,
    className: "border-status-overdue/35 bg-status-overdue/12 text-status-overdue",
    dotClassName: "bg-status-overdue",
  },
  late: {
    label: "Atrasado",
    short: "ATR",
    rank: 6,
    className: "border-status-late/35 bg-status-late/12 text-status-late",
    dotClassName: "bg-status-late",
  },
  warning: {
    label: "Atenção",
    short: "ATN",
    rank: 5,
    className: "border-status-warning/35 bg-status-warning/12 text-status-warning",
    dotClassName: "bg-status-warning",
  },
  missing: {
    label: "Falta",
    short: "FAL",
    rank: 4,
    className: "border-status-missing/35 bg-status-missing/12 text-status-missing",
    dotClassName: "bg-status-missing",
  },
  requested: {
    label: "Solicitado",
    short: "SOL",
    rank: 3,
    className: "border-status-requested/35 bg-status-requested/12 text-status-requested",
    dotClassName: "bg-status-requested",
  },
  planned: {
    label: "Planejado",
    short: "PLN",
    rank: 2,
    className: "border-status-planned/35 bg-status-planned/12 text-status-planned",
    dotClassName: "bg-status-planned",
  },
  ok: {
    label: "OK",
    short: "OK",
    rank: 1,
    className: "border-status-ok/35 bg-status-ok/12 text-status-ok",
    dotClassName: "bg-status-ok",
  },
  na: {
    label: "N/A",
    short: "N/A",
    rank: 0,
    className: "border-dashed border-status-na/40 bg-transparent text-muted-foreground/50",
    dotClassName: "bg-status-na",
  },
};

export const statusOrder: StatusKey[] = ["overdue", "late", "warning", "missing", "requested", "planned", "ok", "na"];

function parsePlannedFor(value: string | null | undefined): Date | null {
  if (!value) return null;
  // Expect YYYY-MM-DD; build as local date end-of-month for "still planned" comparison
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]); // 1-12
  // Use end of month so it counts as planned during the entire chosen month.
  return new Date(year, month, 0); // day 0 of next month = last day of given month
}

export function computeStatus(record: StatusRecord, settings: StatusSettings, currentYear = new Date().getFullYear()): StatusKey {
  if (record.not_applicable) return "na";

  if (record.no_expiration) {
    if (record.year) return "ok";
    // sem ano informado, ainda falta concluir
  }

  if (record.year) {
    const validUntilYear = record.year + settings.validity_years;
    if (validUntilYear <= currentYear) return "overdue";
    if (validUntilYear <= currentYear + settings.warning_years) return "warning";
    return "ok";
  }

  if (record.planned) {
    const date = parsePlannedFor(record.planned_for ?? null);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date && date.getTime() >= today.getTime()) return "planned";
    if (date && date.getTime() < today.getTime()) return "late";
    // planned but no date — treat as planned (UI prevents this case on save)
    return "planned";
  }

  if (record.requested) return "requested";
  return "missing";
}

export function validUntil(year: number | null, settings: StatusSettings) {
  return year ? year + settings.validity_years : null;
}

export function worstStatus(statuses: StatusKey[]): StatusKey {
  const filtered = statuses.filter((s) => s !== "na");
  if (!filtered.length) return "ok";
  return filtered.reduce<StatusKey>((worst, current) => (statusMeta[current].rank > statusMeta[worst].rank ? current : worst), "ok");
}

export function complianceScore(statuses: StatusKey[]) {
  const considered = statuses.filter((s) => s !== "na");
  if (!considered.length) return 0;
  const compliant = considered.filter((status) => status === "ok" || status === "warning").length;
  return Math.round((compliant / considered.length) * 100);
}

export function formatPlannedFor(value: string | null | undefined): string {
  const date = parsePlannedFor(value);
  if (!date) return "—";
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${months[date.getMonth()]}/${String(date.getFullYear()).slice(-2)}`;
}

export function statusDistance(record: StatusRecord, settings: StatusSettings, currentYear = new Date().getFullYear()) {
  if (record.not_applicable) return "Não aplicável";
  if (record.no_expiration && record.year) return `Concluído em ${record.year} · Não vence`;
  if (record.planned && record.planned_for) {
    const date = parsePlannedFor(record.planned_for);
    if (date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date.getTime() < today.getTime()) return `Atrasado desde ${formatPlannedFor(record.planned_for)}`;
      return `Previsto para ${formatPlannedFor(record.planned_for)}`;
    }
  }
  const until = validUntil(record.year, settings);
  if (!until) return record.requested ? "Solicitado, aguardando conclusão" : "Sem ano informado";
  if (until <= currentYear) return `Expirado há ${currentYear - until + 1} ano(s)`;
  return `Faltam ${until - currentYear} ano(s)`;
}
