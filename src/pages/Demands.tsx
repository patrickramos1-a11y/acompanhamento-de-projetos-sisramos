import { useMemo, useState } from "react";
import { Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, PageSkeleton, StatusBadge } from "@/components/project/status-ui";
import { usePlatformData, useUpdateProjectRecord } from "@/hooks/useProjectData";
import { computeStatus, StatusKey, statusMeta, statusOrder } from "@/lib/status";

type ViewMode = "flat" | "client" | "type";

function QuickYear({ id, initial }: { id: string; initial: number | null }) {
  const [year, setYear] = useState(initial?.toString() ?? "");
  const update = useUpdateProjectRecord();
  return (
    <div className="flex gap-2">
      <Input className="h-8 w-24" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} />
      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => update.mutate({ id, values: { year: year ? Number(year) : null, requested: false } })}><Save className="h-4 w-4" /></Button>
    </div>
  );
}

export default function Demands() {
  const { records, settings, projectTypes, isLoading } = usePlatformData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusKey | "all">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [view, setView] = useState<ViewMode>("flat");
  const config = settings.data;

  const rows = useMemo(() => {
    if (!config) return [];
    return (records.data ?? [])
      .filter((record) => record.project_types?.is_active)
      .map((record) => ({ record, status: computeStatus(record, config) }))
      .filter(({ record, status }) => status !== "ok")
      .filter(({ record, status }) => statusFilter === "all" || status === statusFilter)
      .filter(({ record }) => typeFilter === "all" || record.project_type_id === typeFilter)
      .filter(({ record }) => `${record.clients?.name ?? ""} ${record.clients?.code ?? ""}`.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => statusMeta[b.status].rank - statusMeta[a.status].rank || (a.record.clients?.name ?? "").localeCompare(b.record.clients?.name ?? ""));
  }, [records.data, config, search, statusFilter, typeFilter]);

  if (isLoading) return <PageSkeleton />;
  if (!config) return <EmptyState title="Não foi possível carregar as demandas." />;

  const grouped = rows.reduce<Record<string, typeof rows>>((acc, row) => {
    const key = view === "client" ? row.record.clients?.name ?? "Sem cliente" : view === "type" ? row.record.project_types?.name ?? "Sem tipo" : "Demandas";
    acc[key] = [...(acc[key] ?? []), row];
    return acc;
  }, {});

  return (
    <main className="space-y-5">
      <header><h1 className="text-2xl font-semibold tracking-normal">Demandas</h1><p className="text-sm text-muted-foreground">Pendências vencidas, em alerta, faltantes ou solicitadas.</p></header>
      <section className="grid gap-3 lg:grid-cols-[1fr_180px_220px_180px]">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar cliente" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusKey | "all")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos status</SelectItem>{statusOrder.filter((s) => s !== "ok").map((s) => <SelectItem key={s} value={s}>{statusMeta[s].label}</SelectItem>)}</SelectContent></Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos tipos</SelectItem>{projectTypes.data?.map((type) => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}</SelectContent></Select>
        <Select value={view} onValueChange={(v) => setView(v as ViewMode)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="flat">Lista plana</SelectItem><SelectItem value="client">Por cliente</SelectItem><SelectItem value="type">Por tipo</SelectItem></SelectContent></Select>
      </section>
      {!rows.length ? <EmptyState title="Nenhuma demanda encontrada." /> : Object.entries(grouped).map(([group, groupRows]) => (
        <section key={group} className="overflow-hidden rounded-lg border bg-card">
          <div className="border-b px-4 py-3 text-sm font-medium">{group}</div>
          <Table><TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Projeto</TableHead><TableHead>Status</TableHead><TableHead>Ano</TableHead><TableHead>Conclusão rápida</TableHead></TableRow></TableHeader><TableBody>
            {groupRows.map(({ record, status }) => <TableRow key={record.id}><TableCell>{record.clients?.name}<div className="text-xs text-muted-foreground">{record.clients?.code}</div></TableCell><TableCell>{record.project_types?.name}</TableCell><TableCell><StatusBadge status={status} /></TableCell><TableCell>{record.year ?? "—"}</TableCell><TableCell><QuickYear id={record.id} initial={record.year} /></TableCell></TableRow>)}
          </TableBody></Table>
        </section>
      ))}
    </main>
  );
}
