import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState, PageSkeleton } from "@/components/project/status-ui";
import { usePlatformData } from "@/hooks/useProjectData";
import { computeStatus, statusMeta, statusOrder } from "@/lib/status";
import { statusForClient } from "@/lib/project-view";

const chartColor: Record<string, string> = {
  ok: "hsl(var(--status-ok))",
  warning: "hsl(var(--status-warning))",
  overdue: "hsl(var(--status-overdue))",
  missing: "hsl(var(--status-missing))",
  requested: "hsl(var(--status-requested))",
  planned: "hsl(var(--status-planned))",
  late: "hsl(var(--status-late))",
  na: "hsl(var(--status-na))",
};

export default function Metrics() {
  const { clients, projectTypes, records, settings, responsibles, isLoading } = usePlatformData();
  if (isLoading) return <PageSkeleton />;
  const config = settings.data;
  if (!config) return <EmptyState title="Não foi possível carregar as métricas." />;

  const activeTypes = projectTypes.data ?? [];
  const allRecords = (records.data ?? []).filter((record) => record.project_types?.is_active);
  const distribution = statusOrder.map((status) => ({ name: statusMeta[status].label, status, value: allRecords.filter((record) => computeStatus(record, config) === status).length })).filter((item) => item.value > 0);
  const compliance = (clients.data ?? [])
    .map((client) => {
      const result = statusForClient(client, activeTypes, allRecords, config);
      const okCount = result.statuses.filter((s) => s === "ok").length;
      return {
        name: client.name,
        fullName: client.name,
        conformidade: result.score,
        okCount,
        total: result.statuses.length,
      };
    })
    .sort((a, b) => a.conformidade - b.conformidade);
  const byType = activeTypes.map((type) => {
    const typeRecords = allRecords.filter((record) => record.project_type_id === type.id);
    return statusOrder.reduce<Record<string, string | number>>((acc, status) => ({ ...acc, [statusMeta[status].label]: typeRecords.filter((record) => computeStatus(record, config) === status).length }), { name: type.abbreviation });
  });
  const current = new Date().getFullYear();
  const recordYears = allRecords.map((record) => record.year).filter((year): year is number => typeof year === "number");
  const timeline = recordYears.length
    ? (() => {
        const minYear = Math.min(...recordYears);
        const maxValid = Math.max(...recordYears) + config.validity_years;
        const endYear = Math.max(maxValid, current);
        return Array.from({ length: endYear - minYear + 1 }, (_, index) => {
          const year = minYear + index;
          return { year, status: computeStatus({ year, requested: false }, config, current) };
        });
      })()
    : [];

  const allResponsibles = responsibles.data ?? [];
  const responsibleLoad = allResponsibles
    .map((r) => {
      const assigned = allRecords.filter(
        (rec) => (rec as any).planned === true && (rec as any).responsible_id === r.id,
      );
      let plannedCount = 0;
      let lateCount = 0;
      const plannedAbbrs: string[] = [];
      const lateAbbrs: string[] = [];
      for (const rec of assigned) {
        const status = computeStatus(rec, config);
        const abbr = rec.project_types?.abbreviation ?? "—";
        if (status === "late") {
          lateCount += 1;
          lateAbbrs.push(abbr);
        } else if (status === "planned") {
          plannedCount += 1;
          plannedAbbrs.push(abbr);
        }
      }
      return {
        id: r.id,
        name: r.name,
        planned: plannedCount,
        late: lateCount,
        total: plannedCount + lateCount,
        plannedAbbrs,
        lateAbbrs,
      };
    })
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <main className="space-y-4 sm:space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-normal sm:text-2xl">Métricas</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">Visão consolidada de status, conformidade e pendências.</p>
      </header>
      <section className="grid items-stretch gap-3 sm:gap-4 xl:grid-cols-2">
        <div className="rounded-lg border bg-card p-3 sm:p-4">
          <h2 className="mb-3 text-sm font-medium sm:mb-4">Distribuição global</h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={84}>
                    {distribution.map((entry) => <Cell key={entry.status} fill={chartColor[entry.status]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:flex sm:w-44 sm:flex-col">
              {distribution.map((entry) => {
                const total = distribution.reduce((sum, item) => sum + item.value, 0);
                const pct = total ? Math.round((entry.value / total) * 100) : 0;
                return (
                  <li key={entry.status} className="flex items-center gap-2 text-xs">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: chartColor[entry.status] }} />
                    <span className="flex-1 truncate text-foreground">{entry.name}</span>
                    <span className="text-muted-foreground">{entry.value} · {pct}%</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="flex flex-col rounded-lg border bg-card p-3 sm:p-4">
          <h2 className="mb-2 text-sm font-medium">Conformidade por cliente</h2>
          <div className="flex-1 min-h-[280px] max-h-[600px] overflow-y-auto">
            <ResponsiveContainer width="100%" height="100%" minHeight={compliance.length * 44 + 40}>
              <BarChart data={compliance} layout="vertical" margin={{ top: 0, right: 48, left: 8, bottom: 0 }} barCategoryGap={6}>
                <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} horizontal={false} vertical />
                <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={Math.min(120, Math.max(60, (compliance.reduce((m, c) => Math.max(m, c.name.length), 0) * 6) + 12))} tick={{ fontSize: 11 }} interval={0} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                  formatter={(value: number, _name, props) => [`${value}% (${props.payload.okCount}/${props.payload.total} OK)`, props.payload.fullName]}
                />
                <Bar dataKey="conformidade" radius={[0, 4, 4, 0]} barSize={22} isAnimationActive={false}>
                  {compliance.map((entry, idx) => (
                    <Cell key={idx} fill={entry.conformidade < 40 ? "#f87171" : entry.conformidade < 70 ? "#fbbf24" : "#34d399"} />
                  ))}
                  <LabelList dataKey="conformidade" position="right" formatter={(v: number) => `${v}%`} style={{ fill: "hsl(var(--foreground))", fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3 sm:p-4 xl:col-span-2">
          <h2 className="mb-3 text-sm font-medium sm:mb-4">Pendências por tipo</h2>
          <div className="h-72 sm:h-80">
            <ResponsiveContainer>
              <BarChart data={byType} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={byType.length > 6 ? -30 : 0} textAnchor={byType.length > 6 ? "end" : "middle"} height={byType.length > 6 ? 50 : 30} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                {statusOrder.map((status) => <Bar key={status} dataKey={statusMeta[status].label} stackId="a" fill={chartColor[status]} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
      <section className="rounded-lg border bg-card p-3 sm:p-4">
        <h2 className="mb-3 text-sm font-medium sm:mb-4">Timeline de validade</h2>
        {timeline.length ? (
          <div className="grid grid-cols-3 gap-2 xs:grid-cols-4 sm:grid-cols-6 lg:grid-cols-11">
            {timeline.map((item) => (
              <div key={item.year} className={`rounded-md border p-2 text-center text-xs sm:p-3 ${statusMeta[item.status].className}`}>
                <div className="font-medium">{item.year}</div>
                <div className="text-[10px] sm:text-xs">{statusMeta[item.status].label}</div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">Sem registros com ano informado para gerar a timeline.</p>}
      </section>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-4 text-sm font-medium">Carga por Responsável</h2>
        {responsibleLoad.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum projeto planejado atribuído ainda.</p>
        ) : (
          <div style={{ height: Math.max(180, responsibleLoad.length * 44 + 40) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responsibleLoad} layout="vertical" margin={{ top: 0, right: 32, left: 8, bottom: 0 }} barCategoryGap={8}>
                <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} horizontal={false} vertical />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={Math.min(160, Math.max(60, responsibleLoad.reduce((m, e) => Math.max(m, e.name.length), 0) * 7 + 12))}
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const entry = payload[0].payload as typeof responsibleLoad[number];
                    return (
                      <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
                        <p className="font-medium text-foreground">{entry.name}</p>
                        <p className="text-muted-foreground">Total: {entry.total}</p>
                        <p className="text-status-planned">
                          No prazo: {entry.planned}{entry.plannedAbbrs.length ? ` · ${entry.plannedAbbrs.join(", ")}` : ""}
                        </p>
                        <p className="text-status-late">
                          Atrasados: {entry.late}{entry.lateAbbrs.length ? ` · ${entry.lateAbbrs.join(", ")}` : ""}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="planned" name="No prazo" stackId="a" fill="hsl(var(--status-planned))" radius={[0, 0, 0, 0]} barSize={22} isAnimationActive={false} />
                <Bar dataKey="late" name="Atrasado" stackId="a" fill="hsl(var(--status-late))" radius={[0, 4, 4, 0]} barSize={22} isAnimationActive={false}>
                  <LabelList
                    dataKey="total"
                    position="right"
                    formatter={(v: number) => v}
                    style={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </main>
  );
}
