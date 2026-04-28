import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Filter, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { ClientCard } from "@/components/project/ClientCard";
import { EmptyState, PageSkeleton } from "@/components/project/status-ui";
import { CreateClientDialog } from "@/pages/Configure";
import { usePlatformData } from "@/hooks/useProjectData";
import { statusMeta, StatusKey } from "@/lib/status";
import { recordsForClient, statusForClient } from "@/lib/project-view";
import { cn } from "@/lib/utils";

const filters: (StatusKey | "all")[] = ["all", "overdue", "warning", "missing", "requested", "ok"];

type SortMode = "critical" | "alpha" | "alphaDesc" | "scoreAsc" | "scoreDesc";

export default function Index() {
  const { clients, projectTypes, records, settings, isLoading, error } = usePlatformData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusKey | "all">("all");
  const [sort, setSort] = useState<SortMode>("critical");
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [typeFilterOpen, setTypeFilterOpen] = useState(false);

  const types = projectTypes.data ?? [];
  const allRecords = records.data ?? [];
  const config = settings.data;

  const sortedTypes = useMemo(
    () => [...types].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })),
    [types],
  );

  const toggleType = (id: string) =>
    setSelectedTypeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const rows = useMemo(() => {
    if (!config) return [];
    return (clients.data ?? [])
      .map((client) => ({ client, ...statusForClient(client, types, allRecords, config) }))
      .filter(({ client }) => {
        const matchesSearch = `${client.name} ${client.code ?? ""}`.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;
        if (selectedTypeIds.length > 0) {
          const clientRecords = recordsForClient(allRecords, client.id);
          const hasAny = clientRecords.some((r) => selectedTypeIds.includes(r.project_type_id));
          if (!hasAny) return false;
        }
        return true;
      })
      .filter(({ worst }) => statusFilter === "all" || worst === statusFilter)
      .sort((a, b) => {
        if (sort === "alpha") return a.client.name.localeCompare(b.client.name);
        if (sort === "alphaDesc") return b.client.name.localeCompare(a.client.name);
        if (sort === "scoreAsc") return a.score - b.score;
        if (sort === "scoreDesc") return b.score - a.score;
        return statusMeta[b.worst].rank - statusMeta[a.worst].rank || a.client.name.localeCompare(b.client.name);
      });
  }, [clients.data, types, allRecords, config, search, statusFilter, sort, selectedTypeIds]);

  if (isLoading) return <PageSkeleton />;
  if (error || !config) return <EmptyState title="Não foi possível carregar os dados." />;

  const total = clients.data?.length ?? 0;
  const critical = rows.filter((row) => row.worst === "overdue").length;
  const warning = rows.filter((row) => row.worst === "warning").length;
  const avg = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length) : 0;

  return (
    <main className="space-y-5">
      <header className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Painel de Projetos</h1>
          <p className="text-sm text-muted-foreground">Status de validade por cliente e tipo de serviço.</p>
        </div>
        <CreateClientDialog trigger={<Button><Plus className="h-4 w-4" />Novo cliente</Button>} />
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        {[['Clientes', total], ['Defasados', critical], ['Em atenção', warning], ['Conformidade média', `${avg}%`]].map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por cliente, sigla ou responsável" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Select value={sort} onValueChange={(value) => setSort(value as SortMode)}>
          <SelectTrigger className="w-full lg:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="critical">Críticos primeiro</SelectItem>
            <SelectItem value="alpha">Alfabética</SelectItem>
            <SelectItem value="scoreAsc">Menor conformidade</SelectItem>
            <SelectItem value="scoreDesc">Maior conformidade</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-1">
          {filters.map((filter) => (
            <Button key={filter} variant={statusFilter === filter ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(filter)}>
              {filter === "all" ? "Todos" : statusMeta[filter].label}
            </Button>
          ))}
        </div>
      </section>

      {total === 0 ? (
        <EmptyState title="Nenhum cliente cadastrado — cadastrar agora" action={<CreateClientDialog trigger={<Button>Novo cliente</Button>} />} />
      ) : rows.length === 0 ? (
        <EmptyState title="Nenhum cliente encontrado para os filtros atuais." />
      ) : (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ client }) => (
            <ClientCard key={client.id} client={client} types={types} records={recordsForClient(allRecords, client.id)} settings={config} />
          ))}
        </section>
      )}
    </main>
  );
}
