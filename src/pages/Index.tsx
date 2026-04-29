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
  const { clients, projectTypes, records, settings, responsibles, isLoading, error } = usePlatformData();
  const [search, setSearch] = useState("");
  const [statusFilters, setStatusFilters] = useState<StatusKey[]>([]);
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("critical");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [typeFilterOpen, setTypeFilterOpen] = useState(false);
  const [responsibleFilters, setResponsibleFilters] = useState<string[]>([]);
  const [responsibleFilterOpen, setResponsibleFilterOpen] = useState(false);

  const types = projectTypes.data ?? [];
  const allRecords = records.data ?? [];
  const allResponsibles = responsibles.data ?? [];
  const config = settings.data;

  const sortedTypes = useMemo(
    () => [...types].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })),
    [types],
  );

  const toggleType = (id: string) =>
    setSelectedTypeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const sortedResponsibles = useMemo(
    () => [...allResponsibles].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })),
    [allResponsibles],
  );

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
        if (responsibleFilters.length > 0) {
          const clientRecords = recordsForClient(allRecords, client.id);
          const hasAny = clientRecords.some(
            (r) => (r as any).planned === true && responsibleFilters.includes((r as any).responsible_id),
          );
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
  }, [clients.data, types, allRecords, config, search, statusFilters, sortKey, sortDir, selectedTypeIds, responsibleFilters]);

  if (isLoading) return <PageSkeleton />;
  if (error || !config) return <EmptyState title="Não foi possível carregar os dados." />;

  const total = clients.data?.length ?? 0;
  const critical = rows.filter((row) => row.worst === "overdue").length;
  const late = rows.filter((row) => row.worst === "late").length;
  const warning = rows.filter((row) => row.worst === "warning").length;
  const avg = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length) : 0;

  const activeFilterCount =
    (statusFilters.length > 0 ? 1 : 0) +
    (selectedTypeIds.length > 0 ? 1 : 0) +
    (responsibleFilters.length > 0 ? 1 : 0) +
    (sortKey !== "critical" || sortDir !== "desc" ? 1 : 0);

  const clearAllFilters = () => {
    setStatusFilters([]);
    setSelectedTypeIds([]);
    setResponsibleFilters([]);
    setSortKey("critical");
    setSortDir("desc");
  };

  const sortChips: { key: SortKey; label: string }[] = [
    { key: "critical", label: "Criticidade" },
    { key: "alpha", label: "Alfabética" },
    { key: "score", label: "Conformidade" },
  ];

  const FiltersBody = (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ordenar por</p>
        <div className="flex flex-wrap gap-2">
          {sortChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setSortKey(chip.key)}
              className={cn(
                "h-9 rounded-full border px-3 text-xs font-medium transition-colors",
                sortKey === chip.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {chip.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
            aria-label="Inverter direção"
          >
            {sortDir === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
            {sortDir === "desc" ? "Maior" : "Menor"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
          {statusFilters.length > 0 && (
            <button type="button" onClick={() => setStatusFilters([])} className="text-xs text-muted-foreground hover:text-foreground">
              limpar
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const checked = statusFilters.includes(f);
            return (
              <button
                key={f}
                type="button"
                onClick={() =>
                  setStatusFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]))
                }
                className={cn(
                  "h-9 rounded-full border px-3 text-xs font-medium transition-colors",
                  checked
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                {statusMeta[f].label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tipos de projeto</p>
          {selectedTypeIds.length > 0 && (
            <button type="button" onClick={() => setSelectedTypeIds([])} className="text-xs text-muted-foreground hover:text-foreground">
              limpar
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {sortedTypes.map((type) => {
            const checked = selectedTypeIds.includes(type.id);
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => toggleType(type.id)}
                className={cn(
                  "h-9 rounded-full border px-3 text-xs font-medium transition-colors",
                  checked
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
                title={type.name}
              >
                {type.abbreviation || type.name}
              </button>
            );
          })}
        </div>
      </div>

      {sortedResponsibles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Responsáveis</p>
            {responsibleFilters.length > 0 && (
              <button type="button" onClick={() => setResponsibleFilters([])} className="text-xs text-muted-foreground hover:text-foreground">
                limpar
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {sortedResponsibles.map((r) => {
              const checked = responsibleFilters.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() =>
                    setResponsibleFilters((prev) =>
                      prev.includes(r.id) ? prev.filter((x) => x !== r.id) : [...prev, r.id],
                    )
                  }
                  className={cn(
                    "h-9 rounded-full border px-3 text-xs font-medium transition-colors",
                    checked
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent",
                  )}
                >
                  {r.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <main className="space-y-5">
      <header className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-xl font-semibold tracking-normal sm:text-2xl">Painel de Projetos</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">Status de validade por cliente e tipo de serviço.</p>
        </div>
        <div className="hidden md:block">
          <CreateClientDialog trigger={<Button><Plus className="h-4 w-4" />Novo cliente</Button>} />
        </div>
      </header>

      <section className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-5">
        {[['Clientes', total], ['Defasados', critical], ['Atrasados', late], ['Em atenção', warning], ['Conformidade média', `${avg}%`]].map(([label, value], idx) => (
          <div
            key={label as string}
            className={cn(
              "rounded-lg border bg-card p-3 sm:p-4",
              idx === 4 && "col-span-2 md:col-span-1",
            )}
          >
            <p className="text-[11px] text-muted-foreground sm:text-xs">{label}</p>
            <p className="mt-1.5 text-xl font-semibold sm:mt-2 sm:text-2xl">{value}</p>
          </div>
        ))}
      </section>

      {/* Mobile: search + single filter button */}
      <section className="flex flex-col gap-2 lg:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar cliente" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>
                )}
              </span>
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-xl p-4 safe-pb">
            <SheetHeader className="mb-4 text-left">
              <SheetTitle>Filtros e ordenação</SheetTitle>
            </SheetHeader>
            {FiltersBody}
            <div className="sticky bottom-0 mt-5 flex gap-2 border-t border-border bg-background pt-3">
              <Button variant="outline" className="flex-1" onClick={clearAllFilters} disabled={activeFilterCount === 0}>
                Limpar tudo
              </Button>
              <Button className="flex-1" onClick={() => setMobileFiltersOpen(false)}>
                Aplicar
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </section>

      {/* Desktop: full filter bar */}
      <section className="hidden flex-col gap-3 lg:flex lg:flex-row lg:items-center">
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
                  <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => setSelectedTypeIds([])}>
                    <X className="h-4 w-4" />
                    Limpar seleção
                  </Button>
                </div>
              )}
            </Command>
          </PopoverContent>
        </Popover>
        <Popover open={statusFilterOpen} onOpenChange={setStatusFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between lg:w-56">
              <span className="flex items-center gap-2 truncate">
                <Filter className="h-4 w-4" />
                {statusFilters.length === 0 ? (
                  "Filtrar por status"
                ) : (
                  <>
                    Status
                    <Badge variant="secondary" className="ml-1">{statusFilters.length}</Badge>
                  </>
                )}
              </span>
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar status..." />
              <CommandList>
                <CommandEmpty>Nenhum status encontrado.</CommandEmpty>
                <CommandGroup>
                  {filters.map((filter) => {
                    const checked = statusFilters.includes(filter);
                    return (
                      <CommandItem
                        key={filter}
                        value={statusMeta[filter].label}
                        onSelect={() =>
                          setStatusFilters((prev) =>
                            prev.includes(filter) ? prev.filter((x) => x !== filter) : [...prev, filter],
                          )
                        }
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded border",
                            checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                          )}
                        >
                          {checked && <Check className="h-3 w-3" />}
                        </div>
                        <span className="flex-1 truncate">{statusMeta[filter].label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
              {statusFilters.length > 0 && (
                <div className="border-t p-2">
                  <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => setStatusFilters([])}>
                    <X className="h-4 w-4" />
                    Limpar seleção
                  </Button>
                </div>
              )}
            </Command>
          </PopoverContent>
        </Popover>
        <Popover open={responsibleFilterOpen} onOpenChange={setResponsibleFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between lg:w-56">
              <span className="flex items-center gap-2 truncate">
                <Filter className="h-4 w-4" />
                {responsibleFilters.length === 0 ? (
                  "Filtrar por responsável"
                ) : (
                  <>
                    Responsável
                    <Badge variant="secondary" className="ml-1">{responsibleFilters.length}</Badge>
                  </>
                )}
              </span>
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar responsável..." />
              <CommandList>
                <CommandEmpty>Nenhum responsável encontrado.</CommandEmpty>
                <CommandGroup>
                  {sortedResponsibles.map((r) => {
                    const checked = responsibleFilters.includes(r.id);
                    return (
                      <CommandItem
                        key={r.id}
                        value={r.name}
                        onSelect={() =>
                          setResponsibleFilters((prev) =>
                            prev.includes(r.id) ? prev.filter((x) => x !== r.id) : [...prev, r.id],
                          )
                        }
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded border",
                            checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                          )}
                        >
                          {checked && <Check className="h-3 w-3" />}
                        </div>
                        <span className="flex-1 truncate">{r.name}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
              {responsibleFilters.length > 0 && (
                <div className="border-t p-2">
                  <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => setResponsibleFilters([])}>
                    <X className="h-4 w-4" />
                    Limpar seleção
                  </Button>
                </div>
              )}
            </Command>
          </PopoverContent>
        </Popover>
      </section>

      {total === 0 ? (
        <EmptyState title="Nenhum cliente cadastrado — cadastrar agora" action={<CreateClientDialog trigger={<Button>Novo cliente</Button>} />} />
      ) : rows.length === 0 ? (
        <EmptyState title="Nenhum cliente encontrado para os filtros atuais." />
      ) : (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ client }) => (
            <ClientCard
              key={client.id}
              client={client}
              types={types}
              records={recordsForClient(allRecords, client.id)}
              settings={config}
              responsibles={allResponsibles}
              highlightResponsibleIds={responsibleFilters.length > 0 ? responsibleFilters : null}
            />
          ))}
        </section>
      )}

      {/* FAB mobile */}
      <div className="fixed bottom-20 right-4 z-30 md:hidden safe-bottom">
        <CreateClientDialog
          trigger={
            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
              <Plus className="h-6 w-6" />
            </Button>
          }
        />
      </div>
    </main>
  );
}
