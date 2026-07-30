import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RecordEditor } from "@/components/project/RecordEditor";
import { ResponsibleAvatar } from "@/components/project/ResponsibleAvatar";
import { ComplianceBar, EmptyState, PageSkeleton, StatusBadge } from "@/components/project/status-ui";
import { usePlatformData } from "@/hooks/useProjectData";
import { computeStatus, effectiveStatusSettings, statusDistance, statusMeta, validUntil } from "@/lib/status";
import { complianceScore } from "@/lib/status";
import { sortByCriticality } from "@/lib/project-view";

export default function ClientDetail() {
  const { id } = useParams();
  const { clients, projectTypes, records, settings, responsibles, isLoading } = usePlatformData();
  const [showNotApplicable, setShowNotApplicable] = useState(false);

  if (isLoading) return <PageSkeleton />;
  const client = clients.data?.find((item) => item.id === id);
  const config = settings.data;
  if (!client || !config) return <EmptyState title="Cliente não encontrado." action={<Button asChild><Link to="/">Voltar ao painel</Link></Button>} />;

  const types = projectTypes.data ?? [];
  const responsibleMap = new Map((responsibles.data ?? []).map((r) => [r.id, r]));
  const byType = new Map((records.data ?? []).filter((record) => record.client_id === client.id).map((record) => [record.project_type_id, record]));
  const rows = types
    .map((type) => {
      const typeConfig = effectiveStatusSettings(config, type);
      const record = byType.get(type.id);
      return { type, record, typeConfig, status: computeStatus(record ?? { year: null, requested: false }, typeConfig) };
    })
    .sort((a, b) => sortByCriticality(a.status, b.status));
  const notApplicableCount = rows.filter((row) => row.status === "na").length;
  const hiddenNotApplicableCount = showNotApplicable ? 0 : notApplicableCount;
  const visibleRows = showNotApplicable ? rows : rows.filter((row) => row.status !== "na");
  const score = complianceScore(rows.map((row) => row.status));
  const hasAnyResponsible = visibleRows.some((r) => r.record && (r.record as any).responsible_id);
  const missingColSpan = hasAnyResponsible ? 6 : 5;

  return (
    <main className="space-y-4 sm:space-y-5">
      <Button variant="ghost" asChild className="-ml-2"><Link to="/"><ArrowLeft className="h-4 w-4" />Painel</Link></Button>
      <header className="rounded-lg border bg-card p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-xl font-semibold tracking-normal sm:text-2xl">{client.name}</h1>
          </div>
          <div className="w-full md:w-64">
            <div className="mb-2 flex justify-between text-sm"><span>Conformidade</span><strong>{score}%</strong></div>
            <ComplianceBar value={score} />
          </div>
        </div>
      </header>

      <section className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          {notApplicableCount > 0
            ? showNotApplicable
              ? `${notApplicableCount} N/A em exibicao`
              : `${hiddenNotApplicableCount} N/A ocultos`
            : null}
        </div>
        <Button
          type="button"
          variant={showNotApplicable ? "default" : "outline"}
          size="sm"
          onClick={() => setShowNotApplicable((value) => !value)}
        >
          {showNotApplicable ? "Ocultar N/A" : "Mostrar N/A"}
        </Button>
      </section>

      {visibleRows.length === 0 ? (
        <EmptyState title="Todos os projetos deste cliente estão marcados como não aplicáveis." />
      ) : (
        <>
          <section className="space-y-2 md:hidden">
            {visibleRows.map(({ type, record, status, typeConfig }) => {
              const until = record ? ((record as any).no_expiration ? "Não vence" : validUntil(record.year, typeConfig)) : null;
              const rid = record ? ((record as any).responsible_id as string | null) : null;
              const r = rid ? responsibleMap.get(rid) : undefined;
              return (
                <div key={type.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{type.name}</p>
                      <p className="text-xs text-muted-foreground">{type.abbreviation}</p>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                  {record ? (
                    <>
                      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                        <div>
                          <dt className="text-muted-foreground">Ano</dt>
                          <dd>{record.year ?? "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Válido até</dt>
                          <dd>{until ?? "—"}</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-muted-foreground">Situação</dt>
                          <dd>{statusDistance(record, typeConfig)}</dd>
                        </div>
                        {r ? (
                          <div className="col-span-2">
                            <dt className="text-muted-foreground">Responsável</dt>
                            <dd className="mt-0.5 flex items-center gap-2">
                              <ResponsibleAvatar name={r.name} color={(r as any).color ?? "#3b82f6"} size={20} withTooltip={false} />
                              <span>{r.name}</span>
                            </dd>
                          </div>
                        ) : null}
                        {record.notes ? (
                          <div className="col-span-2">
                            <dt className="text-muted-foreground">Observações</dt>
                            <dd className="line-clamp-2">{record.notes}</dd>
                          </div>
                        ) : null}
                      </dl>
                      <div className="mt-3">
                        <RecordEditor record={record} trigger={<Button variant="outline" size="sm" className="w-full">Editar</Button>} />
                      </div>
                    </>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">Registro ainda não criado.</p>
                  )}
                </div>
              );
            })}
          </section>

          <section className="hidden overflow-hidden rounded-lg border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Válido até</TableHead>
                  <TableHead>Situação</TableHead>
                  {hasAnyResponsible ? <TableHead>Responsável</TableHead> : null}
                  <TableHead>Observações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map(({ type, record, status, typeConfig }) => record ? (
                  <TableRow key={type.id}>
                    <TableCell><div className="font-medium">{type.name}</div><div className="text-xs text-muted-foreground">{type.abbreviation}</div></TableCell>
                    <TableCell><StatusBadge status={status} /></TableCell>
                    <TableCell>{record.year ?? "—"}</TableCell>
                    <TableCell>{(record as any).no_expiration ? <span className="text-status-ok">Não vence</span> : (validUntil(record.year, typeConfig) ?? "—")}</TableCell>
                    <TableCell className="text-muted-foreground">{statusDistance(record, typeConfig)}</TableCell>
                    {hasAnyResponsible ? (
                      <TableCell>
                        {(() => {
                          const rid = (record as any).responsible_id as string | null;
                          const r = rid ? responsibleMap.get(rid) : undefined;
                          if (!r) return <span className="text-muted-foreground">—</span>;
                          return (
                            <div className="flex items-center gap-2">
                              <ResponsibleAvatar name={r.name} color={(r as any).color ?? "#3b82f6"} size={24} withTooltip={false} />
                              <span className="text-sm">{r.name}</span>
                            </div>
                          );
                        })()}
                      </TableCell>
                    ) : null}
                    <TableCell className="max-w-xs truncate">{record.notes ?? "—"}</TableCell>
                    <TableCell className="text-right"><RecordEditor record={record} /></TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={type.id}>
                    <TableCell>{type.name}</TableCell><TableCell><span className={statusMeta.missing.className}>Falta</span></TableCell><TableCell colSpan={missingColSpan}>Registro ainda não criado.</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </>
      )}
    </main>
  );
}
