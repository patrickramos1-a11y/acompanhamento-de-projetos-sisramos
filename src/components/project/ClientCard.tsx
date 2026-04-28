import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Client, ProjectRecord, ProjectType, Settings } from "@/hooks/useProjectData";
import { cn } from "@/lib/utils";
import { complianceScore, computeStatus, statusDistance, statusMeta, validUntil, worstStatus } from "@/lib/status";
import { ComplianceBar } from "./status-ui";

type Props = {
  client: Client;
  types: ProjectType[];
  records: ProjectRecord[];
  settings: Settings;
};

const borderByStatus = {
  overdue: "border-l-status-overdue",
  warning: "border-l-status-warning",
  missing: "border-l-status-missing",
  requested: "border-l-status-requested",
  ok: "border-l-status-ok",
};

export function ClientCard({ client, types, records, settings }: Props) {
  const recordsByType = new Map(records.map((record) => [record.project_type_id, record]));
  const statuses = types.map((type) => computeStatus(recordsByType.get(type.id) ?? { year: null, requested: false }, settings));
  const worst = worstStatus(statuses);
  const score = complianceScore(statuses);

  return (
    <Link to={`/clientes/${client.id}`} className={cn("block rounded-lg border border-l-4 bg-card p-4 transition-colors hover:bg-accent/45", borderByStatus[worst])}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{client.name}</h2>
          <p className="text-xs text-muted-foreground">{client.code}{client.responsible ? ` · ${client.responsible}` : ""}</p>
        </div>
        <span className="text-sm font-medium">{score}%</span>
      </div>
      <ComplianceBar value={score} />
      <div className="mt-4 flex flex-wrap gap-1.5">
        {types.map((type) => {
          const record = recordsByType.get(type.id) ?? { year: null, requested: false };
          const status = computeStatus(record, settings);
          const until = validUntil(record.year, settings);
          return (
            <Tooltip key={type.id}>
              <TooltipTrigger asChild>
                <span className={cn("inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium", statusMeta[status].className)}>
                  {type.abbreviation} · {record.year ?? "—"}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{type.name}</p>
                <p>{statusMeta[status].label}{until ? ` · válido até ${until}` : ""}</p>
                <p>{statusDistance(record, settings)}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </Link>
  );
}
