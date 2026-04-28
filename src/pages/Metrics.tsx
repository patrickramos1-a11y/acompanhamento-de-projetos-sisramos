import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
  const compliance = (clients.data ?? []).map((client) => ({ name: client.code ?? client.name, conformidade: statusForClient(client, activeTypes, allRecords, config).score })).sort((a, b) => a.conformidade - b.conformidade);
  const byType = activeTypes.map((type) => {
    const typeRecords = allRecords.filter((record) => record.project_type_id === type.id);
    return statusOrder.reduce<Record<string, string | number>>((acc, status) => ({ ...acc, [statusMeta[status].label]: typeRecords.filter((record) => computeStatus(record, config) === status).length }), { name: type.abbreviation });
  });
  const current = new Date().getFullYear();
  const timeline = Array.from({ length: 11 }, (_, index) => {
    const year = current - 5 + index;
    const status = computeStatus({ year, requested: false }, config, current);
    return { year, status };
  });

  return (
    <main className="space-y-5">
      <header><h1 className="text-2xl font-semibold tracking-normal">Métricas</h1><p className="text-sm text-muted-foreground">Visão consolidada de status, conformidade e pendências.</p></header>
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border bg-card p-4"><h2 className="mb-4 text-sm font-medium">Distribuição global</h2><div className="h-72"><ResponsiveContainer><PieChart><Pie data={distribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96}>{distribution.map((entry) => <Cell key={entry.status} fill={chartColor[entry.status]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></div>
        <div className="rounded-lg border bg-card p-4"><h2 className="mb-4 text-sm font-medium">Conformidade por cliente</h2><div className="h-72"><ResponsiveContainer><BarChart data={compliance} layout="vertical" margin={{ left: 12 }}><CartesianGrid stroke="hsl(var(--border))" horizontal={false} /><XAxis type="number" domain={[0, 100]} /><YAxis dataKey="name" type="category" width={56} /><Tooltip /><Bar dataKey="conformidade" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></div>
        <div className="rounded-lg border bg-card p-4 xl:col-span-2"><h2 className="mb-4 text-sm font-medium">Pendências por tipo</h2><div className="h-72"><ResponsiveContainer><BarChart data={byType}><CartesianGrid stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip />{statusOrder.map((status) => <Bar key={status} dataKey={statusMeta[status].label} stackId="a" fill={chartColor[status]} />)}</BarChart></ResponsiveContainer></div></div>
      </section>
      <section className="rounded-lg border bg-card p-4"><h2 className="mb-4 text-sm font-medium">Timeline de validade</h2><div className="grid grid-cols-2 gap-2 sm:grid-cols-6 lg:grid-cols-11">{timeline.map((item) => <div key={item.year} className={`rounded-md border p-3 text-center text-xs ${statusMeta[item.status].className}`}><div className="font-medium">{item.year}</div><div>{statusMeta[item.status].label}</div></div>)}</div></section>
    </main>
  );
}
