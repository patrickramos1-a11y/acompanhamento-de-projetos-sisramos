import { Link } from "react-router-dom";
import { AlertTriangle, AlarmClock, Calendar, Clock, RotateCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Client, ProjectRecord, ProjectType, Settings } from "@/hooks/useProjectData";
import { cn } from "@/lib/utils";
import {
  complianceScore,
  computeStatus,
  formatPlannedFor,
  StatusKey,
  statusDistance,
  statusMeta,
  validUntil,
} from "@/lib/status";

type Props = {
  client: Client;
  types: ProjectType[];
  records: ProjectRecord[];
  settings: Settings;
  highlightResponsibleId?: string | null;
};

function scoreTone(score: number) {
  if (score >= 70) return "text-status-ok";
  if (score >= 40) return "text-status-warning";
  return "text-status-overdue";
}

function scoreBar(score: number) {
  if (score >= 70) return "bg-status-ok";
  if (score >= 40) return "bg-status-warning";
  return "bg-status-overdue";
}

function chipClass(status: StatusKey) {
  switch (status) {
    case "overdue":
      return "bg-[#2b0d0d] border border-[#4a1a1a] text-[#f5a3a3]";
    case "late":
      return "bg-status-late/10 border border-status-late/35 text-status-late";
    case "warning":
      return "bg-[#2b1f0d] border border-[#4a3515] text-[#f5d27a]";
    case "ok":
      return "bg-[#0d2b1f] border border-[#1a4a35] text-[#86e2b8]";
    case "requested":
      return "bg-[#0d1a2b] border border-[#1a3050] text-[#8cc4f5]";
    case "planned":
      return "bg-status-planned/10 border border-status-planned/35 text-status-planned";
    case "na":
      return "bg-transparent border border-dashed border-[#1f1f2a] text-muted-foreground/40 opacity-70";
    case "missing":
    default:
      return "bg-transparent border border-dashed border-[#2a2a3a] text-muted-foreground";
  }
}

function chipIcon(status: StatusKey) {
  if (status === "overdue") return <AlertTriangle className="h-3 w-3" />;
  if (status === "late") return <AlarmClock className="h-3 w-3" />;
  if (status === "warning") return <Clock className="h-3 w-3" />;
  if (status === "requested") return <RotateCw className="h-3 w-3" />;
  if (status === "planned") return <Calendar className="h-3 w-3" />;
  return null;
}

export function ClientCard({ client, types, records, settings, highlightResponsibleId }: Props) {
  const recordsByType = new Map(records.map((record) => [record.project_type_id, record]));

  const items = types
    .map((type) => {
      const raw = recordsByType.get(type.id);
      const record = raw ?? { year: null, requested: false, not_applicable: false, planned: false, planned_for: null };
      const status = computeStatus(record as any, settings);
      return { type, record, status };
    })
    .sort((a, b) => {
      // N/A always last
      if (a.status === "na" && b.status !== "na") return 1;
      if (b.status === "na" && a.status !== "na") return -1;
      return statusMeta[b.status].rank - statusMeta[a.status].rank;
    });

  const statuses = items.map((i) => i.status);
  const score = complianceScore(statuses);

  const counts = {
    overdue: statuses.filter((s) => s === "overdue").length,
    late: statuses.filter((s) => s === "late").length,
    warning: statuses.filter((s) => s === "warning").length,
    missing: statuses.filter((s) => s === "missing").length,
  };

  const hasOverdue = counts.overdue > 0;
  const hasLate = counts.late > 0;
  const hasWarning = counts.warning > 0;
  const hasMissing = counts.missing > 0;
  const allOk = !hasOverdue && !hasLate && !hasWarning && !hasMissing;

  const borderClass = hasOverdue
    ? "border-status-overdue/25 hover:border-status-overdue/45"
    : hasLate
      ? "border-status-late/25 hover:border-status-late/45"
      : hasWarning
        ? "border-status-warning/25 hover:border-status-warning/45"
        : allOk
          ? "border-status-ok/20 hover:border-status-ok/40"
          : "border-border hover:border-border/80";

  const subtextParts: { text: string; className: string }[] = [];
  if (counts.overdue) subtextParts.push({ text: `${counts.overdue} ${counts.overdue === 1 ? "defasado" : "defasados"}`, className: "text-status-overdue" });
  if (counts.late) subtextParts.push({ text: `${counts.late} ${counts.late === 1 ? "atrasado" : "atrasados"}`, className: "text-status-late" });
  if (counts.warning) subtextParts.push({ text: `${counts.warning} ${counts.warning === 1 ? "vencendo" : "vencendo"}`, className: "text-status-warning" });
  if (counts.missing) subtextParts.push({ text: `${counts.missing} ${counts.missing === 1 ? "faltando" : "faltando"}`, className: "text-status-missing" });

  const overdueAbbrs = items.filter((i) => i.status === "overdue").map((i) => i.type.abbreviation);
  const lateAbbrs = items.filter((i) => i.status === "late").map((i) => i.type.abbreviation);
  const warningAbbrs = items.filter((i) => i.status === "warning").map((i) => i.type.abbreviation);

  return (
    <Link
      to={`/clientes/${client.id}`}
      className={cn(
        "group block rounded-lg border bg-card p-5 transition-colors",
        borderClass,
      )}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {client.name.slice(0, 2)}
            </div>
            <h2 className="min-w-0 flex-1 truncate text-xl font-bold tracking-tight">{client.name}</h2>
          </div>
          <span className={cn("text-xl font-bold tabular-nums", scoreTone(score))}>{score}%</span>
        </div>
        <div className="text-xs">
          {subtextParts.length === 0 ? (
            <span className="text-status-ok">Todos os projetos em dia</span>
          ) : (
            subtextParts.map((part, idx) => (
              <span key={idx}>
                <span className={part.className}>{part.text}</span>
                {idx < subtextParts.length - 1 ? <span className="text-muted-foreground"> · </span> : null}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Corpo */}
      <div className="flex flex-col gap-2.5">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
          <div
            className={cn("h-full rounded-full transition-all", scoreBar(score))}
            style={{ width: `${Math.max(2, Math.min(100, score))}%` }}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {items.map(({ type, record, status }) => {
            const until = validUntil(record.year, settings);
            const meta = statusMeta[status];
            const isHighlighted =
              !!highlightResponsibleId &&
              status === "planned" &&
              (record as any).responsible_id === highlightResponsibleId;
            return (
              <Tooltip key={type.id}>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium",
                      chipClass(status),
                      isHighlighted && "ring-1 ring-status-planned/70 ring-offset-1 ring-offset-card",
                    )}
                  >
                    {isHighlighted && <span className="h-1.5 w-1.5 rounded-full bg-status-planned" aria-hidden />}
                    {chipIcon(status)}
                    <span>{type.abbreviation}</span>
                    {status === "ok" && record.year ? <span className="opacity-80">· {record.year}</span> : null}
                    {status === "planned" && (record as any).planned_for ? <span className="opacity-80">· {formatPlannedFor((record as any).planned_for)}</span> : null}
                    {status === "late" ? <span className="opacity-80">· atrasado</span> : null}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{type.name}</p>
                  <p>{meta.label}{until ? ` · válido até ${until}` : ""}</p>
                  <p>{statusDistance(record, settings)}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Rodapé condicional */}
      {(hasOverdue || hasLate || hasWarning) && (
        <div className="flex flex-col gap-1 border-t border-border/40 pt-2.5">
          {hasOverdue && (
            <p className="text-xs text-status-overdue">
              Renovação urgente: {overdueAbbrs.join(", ")}
            </p>
          )}
          {hasLate && (
            <p className="text-xs text-status-late">
              Atrasado: {lateAbbrs.join(", ")}
            </p>
          )}
          {hasWarning && (
            <p className="text-xs text-status-warning">
              Vence este ano: {warningAbbrs.join(", ")}
            </p>
          )}
        </div>
      )}
    </Link>
  );
}
