import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, ChevronsUpDown, Filter, Plus, Search, X } from "lucide-react";
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

const filters: StatusKey[] = ["overdue", "late", "warning", "missing", "requested", "planned", "ok", "na"];

type SortKey = "critical" | "alpha" | "score";
type SortDir = "asc" | "desc";

export default function Index() {
  const { clients, projectTypes, records, settings, isLoading, error } = usePlatformData();
  const [search, setSearch] = useState("");
  const [statusFilters, setStatusFilters] = useState<StatusKey[]>([]);
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("critical");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
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
      .filter(({ worst }) => statusFilters.length === 0 || statusFilters.includes(worst))
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortKey === "alpha") return a.client.name.localeCompare(b.client.name) * dir;
        if (sortKey === "score") return (a.score - b.score) * dir;
        // critical: desc = mais críticos primeiro
        const cmp = statusMeta[b.worst].rank - statusMeta[a.worst].rank;
        return (sortDir === "desc" ? cmp : -cmp) || a.client.name.localeCompare(b.client.name);
      });
  }, [clients.data, types, allRecords, config, search, statusFilters, sortKey, sortDir, selectedTypeIds]);

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
        <div className="flex w-full items-stretch lg:w-64">
          <button
            type="button"
            aria-label={sortDir === "desc" ? "Maior para menor" : "Menor para maior"}
            title={sortDir === "desc" ? "Maior para menor" : "Menor para maior"}
            onClick={(e) => {
              e.stopPropagation();
              setSortDir((d) => (d === "desc" ? "asc" : "desc"));
            }}
            className="flex items-center justify-center rounded-l-md border border-r-0 border-input bg-background px-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {sortDir === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
          </button>
          <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
            <SelectTrigger className="flex-1 rounded-l-none"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Criticidade</SelectItem>
              <SelectItem value="alpha">Alfabética</SelectItem>
              <SelectItem value="score">Conformidade</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Popover open={typeFilterOpen} onOpenChange={setTypeFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between lg:w-64">
              <span className="flex items-center gap-2 truncate">
                <Filter className="h-4 w-4" />
                {selectedTypeIds.length === 0 ? (
                  "Filtrar por projeto"
                ) : (
                  <>
                    Projetos
                    <Badge variant="secondary" className="ml-1">{selectedTypeIds.length}</Badge>
                  </>
                )}
              </span>
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar projeto..." />
              <CommandList>
                <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
                <CommandGroup>
                  {sortedTypes.map((type) => {
                    const checked = selectedTypeIds.includes(type.id);
                    return (
                      <CommandItem
                        key={type.id}
                        value={`${type.name} ${type.abbreviation ?? ""}`}
                        onSelect={() => toggleType(type.id)}
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded border",
                            checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                          )}
                        >
                          {checked && <Check className="h-3 w-3" />}
                        </div>
                        <span className="flex-1 truncate">{type.name}</span>
                        {type.abbreviation && (
                          <span className="ml-2 text-xs text-muted-foreground">{type.abbreviation}</span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
              {selectedTypeIds.length > 0 && (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => setSelectedTypeIds([])}
                  >
                    <X className="h-4 w-4" />
                    Limpar seleção
                  </Button>
                </div>
              )}
            </Command>
          </PopoverContent>
        </Popover>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusKey | "all")}>
          <SelectTrigger className="w-full lg:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filters.map((filter) => (
              <SelectItem key={filter} value={filter}>
                {filter === "all" ? "Todos" : statusMeta[filter].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
