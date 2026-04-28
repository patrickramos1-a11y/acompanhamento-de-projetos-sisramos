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
};

export default function Metrics() {
  const { clients, projectTypes, records, settings, isLoading } = usePlatformData();
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

  return (
    <main className="space-y-5">
      <header><h1 className="text-2xl font-semibold tracking-normal">Métricas</h1><p className="text-sm text-muted-foreground">Visão consolidada de status, conformidade e pendências.</p></header>
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border bg-card p-4"><h2 className="mb-4 text-sm font-medium">Distribuição global</h2><div className="h-72"><ResponsiveContainer><PieChart><Pie data={distribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96}>{distribution.map((entry) => <Cell key={entry.status} fill={chartColor[entry.status]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></div>
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-4 text-sm font-medium">Conformidade por cliente</h2>
          <div className="max-h-[600px] overflow-y-auto" style={{ height: Math.min(600, Math.max(400, compliance.length * 36 + 40)) }}>
            <div style={{ height: Math.max(400, compliance.length * 36) }}>
              <ResponsiveContainer>
                <BarChart data={compliance} layout="vertical" margin={{ left: 8, right: 48, top: 8, bottom: 8 }} barCategoryGap={6}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.4} horizontal={false} vertical />
                  <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} interval={0} />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                    formatter={(value: number, _name, props) => [`${value}% (${props.payload.okCount}/${props.payload.total} OK)`, props.payload.fullName]}
                  />
                  <Bar dataKey="conformidade" radius={[0, 4, 4, 0]} barSize={22}>
                    {compliance.map((entry, idx) => (
                      <Cell key={idx} fill={entry.conformidade < 40 ? "#f87171" : entry.conformidade < 70 ? "#fbbf24" : "#34d399"} />
                    ))}
                    <LabelList dataKey="conformidade" position="right" formatter={(v: number) => `${v}%`} style={{ fill: "hsl(var(--foreground))", fontSize: 11 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 xl:col-span-2"><h2 className="mb-4 text-sm font-medium">Pendências por tipo</h2><div className="h-72"><ResponsiveContainer><BarChart data={byType}><CartesianGrid stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip />{statusOrder.map((status) => <Bar key={status} dataKey={statusMeta[status].label} stackId="a" fill={chartColor[status]} />)}</BarChart></ResponsiveContainer></div></div>
      </section>
      <section className="rounded-lg border bg-card p-4"><h2 className="mb-4 text-sm font-medium">Timeline de validade</h2>{timeline.length ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-6 lg:grid-cols-11">{timeline.map((item) => <div key={item.year} className={`rounded-md border p-3 text-center text-xs ${statusMeta[item.status].className}`}><div className="font-medium">{item.year}</div><div>{statusMeta[item.status].label}</div></div>)}</div> : <p className="text-sm text-muted-foreground">Sem registros com ano informado para gerar a timeline.</p>}</section>
    </main>
  );
}
