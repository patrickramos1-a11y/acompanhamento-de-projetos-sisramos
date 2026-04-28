import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Client, ProjectRecord, ProjectType, Settings } from "@/hooks/useProjectData";
import { cn } from "@/lib/utils";
import { complianceScore, computeStatus, statusDistance, statusMeta, validUntil, worstStatus } from "@/lib/status";

type Props = {
  client: Client;
  types: ProjectType[];
  records: ProjectRecord[];
  settings: Settings;
};

const accentByStatus = {
  overdue: "before:bg-status-overdue",
  warning: "before:bg-status-warning",
  missing: "before:bg-status-missing",
  requested: "before:bg-status-requested",
  ok: "before:bg-status-ok",
};

const scoreToneByStatus = {
  overdue: "text-status-overdue",
  warning: "text-status-warning",
  missing: "text-muted-foreground",
  requested: "text-status-requested",
  ok: "text-status-ok",
};

export function ClientCard({ client, types, records, settings }: Props) {
  const recordsByType = new Map(records.map((record) => [record.project_type_id, record]));
  const statuses = types.map((type) => computeStatus(recordsByType.get(type.id) ?? { year: null, requested: false }, settings));
  const worst = worstStatus(statuses);
  const score = complianceScore(statuses);

  return (
    <Link
      to={`/clientes/${client.id}`}
      className={cn(
        "group relative block overflow-hidden rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-lg hover:shadow-black/20",
        "before:absolute before:inset-y-0 before:left-0 before:w-1",
        accentByStatus[worst],
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold tracking-tight">{client.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {types.length} {types.length === 1 ? "projeto" : "projetos"} · {statusMeta[worst].label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-xl font-semibold tabular-nums", scoreToneByStatus[worst])}>{score}%</span>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>

      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
        <div
          className={cn("h-full rounded-full transition-all", {
            "bg-status-ok": worst === "ok",
            "bg-status-warning": worst === "warning",
            "bg-status-overdue": worst === "overdue",
            "bg-status-requested": worst === "requested",
            "bg-status-missing": worst === "missing",
          })}
          style={{ width: `${Math.max(2, Math.min(100, score))}%` }}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {types.map((type) => {
          const record = recordsByType.get(type.id) ?? { year: null, requested: false };
          const status = computeStatus(record, settings);
          const until = validUntil(record.year, settings);
          const meta = statusMeta[status];
          return (
            <Tooltip key={type.id}>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-[11px] font-medium tracking-wide",
                    meta.className,
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClassName)} />
                  {type.abbreviation}
                  {record.year ? <span className="opacity-70">· {record.year}</span> : null}
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
    </Link>
  );
}
