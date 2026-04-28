export type StatusKey = "missing" | "requested" | "ok" | "warning" | "overdue";

export type StatusRecord = {
  year: number | null;
  requested: boolean;
};

export type StatusSettings = {
  validity_years: number;
  warning_years: number;
};

export const statusMeta: Record<StatusKey, { label: string; short: string; rank: number; className: string; dotClassName: string }> = {
  overdue: {
    label: "Defasado",
    short: "DEF",
    rank: 5,
    className: "border-status-overdue/35 bg-status-overdue/12 text-status-overdue",
    dotClassName: "bg-status-overdue",
  },
  warning: {
    label: "Atenção",
    short: "ATN",
    rank: 4,
    className: "border-status-warning/35 bg-status-warning/12 text-status-warning",
    dotClassName: "bg-status-warning",
  },
  missing: {
    label: "Falta",
    short: "FAL",
    rank: 3,
    className: "border-status-missing/35 bg-status-missing/12 text-status-missing",
    dotClassName: "bg-status-missing",
  },
  requested: {
    label: "Solicitado",
    short: "SOL",
    rank: 2,
    className: "border-status-requested/35 bg-status-requested/12 text-status-requested",
    dotClassName: "bg-status-requested",
  },
  ok: {
    label: "OK",
    short: "OK",
    rank: 1,
    className: "border-status-ok/35 bg-status-ok/12 text-status-ok",
    dotClassName: "bg-status-ok",
  },
};

export const statusOrder: StatusKey[] = ["overdue", "warning", "missing", "requested", "ok"];

export function computeStatus(record: StatusRecord, settings: StatusSettings, currentYear = new Date().getFullYear()): StatusKey {
  if (!record.year) return record.requested ? "requested" : "missing";

  const validUntil = record.year + settings.validity_years;
  if (validUntil <= currentYear) return "overdue";
  if (validUntil <= currentYear + settings.warning_years) return "warning";
  return "ok";
}

export function validUntil(year: number | null, settings: StatusSettings) {
  return year ? year + settings.validity_years : null;
}

export function worstStatus(statuses: StatusKey[]): StatusKey {
  return statuses.reduce<StatusKey>((worst, current) => (statusMeta[current].rank > statusMeta[worst].rank ? current : worst), "ok");
}

export function complianceScore(statuses: StatusKey[]) {
  if (!statuses.length) return 0;
  const compliant = statuses.filter((status) => status === "ok" || status === "warning").length;
  return Math.round((compliant / statuses.length) * 100);
}

export function statusDistance(record: StatusRecord, settings: StatusSettings, currentYear = new Date().getFullYear()) {
  const until = validUntil(record.year, settings);
  if (!until) return record.requested ? "Solicitado, aguardando conclusão" : "Sem ano informado";
  if (until <= currentYear) return `Expirado há ${currentYear - until + 1} ano(s)`;
  return `Faltam ${until - currentYear} ano(s)`;
}
