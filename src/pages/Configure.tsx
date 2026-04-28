import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calendar, Check, Clock, Plus, Save, Trash2 } from "lucide-react";
import { computeStatus, statusMeta, type StatusKey } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EmptyState, PageSkeleton } from "@/components/project/status-ui";
import { ResponsibleAvatar } from "@/components/project/ResponsibleAvatar";
import { nextDefaultColor } from "@/lib/responsible-colors";
import { ProjectType, Responsible, useCreateClient, useCreateProjectType, useCreateResponsible, useDeleteClient, useDeleteProjectType, useDeleteResponsible, usePlatformData, useResponsibles, useUpdateClient, useUpdateProjectType, useUpdateResponsible, useUpdateSettings } from "@/hooks/useProjectData";

export function CreateClientDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const createClient = useCreateClient();

  async function submit(event: FormEvent) {
    event.preventDefault();
    await createClient.mutateAsync({ name, code: null, responsible: null });
    setName("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo cliente</DialogTitle>
          <DialogDescription>Cria o cliente e os registros em branco para os tipos ativos.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <DialogFooter><Button disabled={createClient.isPending}><Plus className="h-4 w-4" />Cadastrar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateProjectTypeDialog({ nextOrder }: { nextOrder: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const createType = useCreateProjectType();

  async function submit(event: FormEvent) {
    event.preventDefault();
    await createType.mutateAsync({ name, abbreviation: abbreviation.toUpperCase(), display_order: nextOrder, is_active: true });
    setName("");
    setAbbreviation("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Novo tipo</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo tipo de projeto</DialogTitle><DialogDescription>Cria registros em branco para todos os clientes existentes.</DialogDescription></DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="space-y-2"><Label>Abreviação</Label><Input value={abbreviation} onChange={(e) => setAbbreviation(e.target.value.toUpperCase())} required /></div>
          <DialogFooter><Button disabled={createType.isPending}>Criar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TypeRow({ type }: { type: ProjectType }) {
  const updateType = useUpdateProjectType();
  const deleteType = useDeleteProjectType();
  const [name, setName] = useState(type.name);
  const [abbr, setAbbr] = useState(type.abbreviation);

  useEffect(() => {
    setName(type.name);
    setAbbr(type.abbreviation);
  }, [type.name, type.abbreviation]);

  return (
    <div className="grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-[1fr_120px_auto_auto] sm:items-center">
      <Input value={name} onChange={(e) => setName(e.target.value)} />
      <Input value={abbr} onChange={(e) => setAbbr(e.target.value.toUpperCase())} />
      <Switch checked={type.is_active} onCheckedChange={(checked) => updateType.mutate({ id: type.id, values: { is_active: checked } })} />
      <div className="flex gap-2">
        <Button size="icon" variant="outline" onClick={() => updateType.mutate({ id: type.id, values: { name, abbreviation: abbr.toUpperCase() } })}><Save className="h-4 w-4" /></Button>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button size="icon" variant="destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Excluir tipo?</AlertDialogTitle><AlertDialogDescription>Os registros vinculados também serão removidos.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteType.mutate(type.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function ClientRow({
  client,
  onSave,
  onDelete,
  confirmCode,
  setConfirmCode,
}: {
  client: { id: string; name: string };
  onSave: (name: string) => void;
  onDelete: () => void;
  confirmCode: string;
  setConfirmCode: (v: string) => void;
}) {
  const [name, setName] = useState(client.name);
  useEffect(() => setName(client.name), [client.name]);
  const dirty = name.trim().length > 0 && name !== client.name;

  return (
    <div className="grid gap-2 rounded-lg border bg-card p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
      <Input value={name} onChange={(e) => setName(e.target.value)} />
      <Button size="icon" variant="outline" disabled={!dirty} onClick={() => onSave(name.trim())} title="Salvar alterações">
        <Save className="h-4 w-4" />
      </Button>
      <AlertDialog onOpenChange={() => setConfirmCode("")}>
        <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir {client.name}?</AlertDialogTitle><AlertDialogDescription>Digite o nome exato para confirmar a exclusão do cliente.</AlertDialogDescription></AlertDialogHeader>
          <Input value={confirmCode} onChange={(e) => setConfirmCode(e.target.value)} />
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction disabled={confirmCode !== client.name} onClick={onDelete}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CreateResponsibleDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const create = useCreateResponsible();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    await create.mutateAsync({ name: name.trim() });
    setName("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo responsável</DialogTitle>
          <DialogDescription>Cadastra uma pessoa que pode ser atribuída a projetos planejados.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus /></div>
          <DialogFooter><Button disabled={create.isPending}><Plus className="h-4 w-4" />Cadastrar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResponsibleRow({ responsible, assignedCount }: { responsible: Responsible; assignedCount: number }) {
  const update = useUpdateResponsible();
  const remove = useDeleteResponsible();
  const [name, setName] = useState(responsible.name);
  useEffect(() => setName(responsible.name), [responsible.name]);
  const dirty = name.trim().length > 0 && name.trim() !== responsible.name;

  return (
    <div className="grid gap-2 rounded-lg border bg-card p-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
      <div className="flex items-center gap-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <span className="px-2 text-xs text-muted-foreground whitespace-nowrap">
        {assignedCount} {assignedCount === 1 ? "projeto" : "projetos"}
      </span>
      <Button size="icon" variant="outline" disabled={!dirty} onClick={() => update.mutate({ id: responsible.id, values: { name: name.trim() } })} title="Salvar nome">
        <Save className="h-4 w-4" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild><Button size="icon" variant="destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {responsible.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {assignedCount > 0
                ? `Este responsável está atribuído a ${assignedCount} ${assignedCount === 1 ? "projeto" : "projetos"}. Removê-lo deixará esses projetos sem responsável.`
                : "Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate(responsible.id)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function Configure() {
  const { clients, projectTypes, settings, responsibles, records, isLoading } = usePlatformData(true);
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const updateSettings = useUpdateSettings();
  const [validity, setValidity] = useState(5);
  const [warning, setWarning] = useState(1);
  const [confirmCode, setConfirmCode] = useState("");

  useEffect(() => {
    if (settings.data) {
      setValidity(settings.data.validity_years);
      setWarning(settings.data.warning_years);
    }
  }, [settings.data]);

  const sortedTypes = useMemo(
    () => [...(projectTypes.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })),
    [projectTypes.data],
  );
  const sortedClients = useMemo(
    () => [...(clients.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })),
    [clients.data],
  );
  const sortedResponsibles = useMemo(
    () => [...(responsibles.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })),
    [responsibles.data],
  );
  const responsibleCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of records.data ?? []) {
      const rid = (r as any).responsible_id as string | null;
      if (rid) map.set(rid, (map.get(rid) ?? 0) + 1);
    }
    return map;
  }, [records.data]);
  const nextOrder = useMemo(() => (projectTypes.data?.length ?? 0) + 1, [projectTypes.data]);

  if (isLoading) return <PageSkeleton />;

  return (
    <main className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-normal">Configurar</h1>
        <p className="text-sm text-muted-foreground">Clientes, tipos de projeto, responsáveis e regra de validade.</p>
      </header>
      <Tabs defaultValue="clients">
        <TabsList>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="types">Tipos</TabsTrigger>
          <TabsTrigger value="responsibles">Responsáveis</TabsTrigger>
          <TabsTrigger value="settings">Gerais</TabsTrigger>
        </TabsList>
        <TabsContent value="clients" className="mt-4 space-y-3">
          <div className="flex justify-end"><CreateClientDialog trigger={<Button><Plus className="h-4 w-4" />Novo cliente</Button>} /></div>
          {sortedClients.length ? sortedClients.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              onSave={(name) => updateClient.mutate({ id: client.id, values: { name } })}
              onDelete={() => deleteClient.mutate(client.id)}
              confirmCode={confirmCode}
              setConfirmCode={setConfirmCode}
            />
          )) : <EmptyState title="Nenhum cliente cadastrado — cadastrar agora" action={<CreateClientDialog trigger={<Button>Novo cliente</Button>} />} />}
        </TabsContent>
        <TabsContent value="types" className="mt-4 space-y-3">
          <div className="flex justify-end"><CreateProjectTypeDialog nextOrder={nextOrder} /></div>
          {sortedTypes.length ? (
            <div className="space-y-2">{sortedTypes.map((type) => <TypeRow key={type.id} type={type} />)}</div>
          ) : <EmptyState title="Nenhum tipo de projeto cadastrado." />}
        </TabsContent>
        <TabsContent value="responsibles" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <CreateResponsibleDialog trigger={<Button><Plus className="h-4 w-4" />Novo Responsável</Button>} />
          </div>
          {sortedResponsibles.length ? (
            <div className="space-y-2">
              {sortedResponsibles.map((r) => (
                <ResponsibleRow key={r.id} responsible={r} assignedCount={responsibleCounts.get(r.id) ?? 0} />
              ))}
            </div>
          ) : (
            <EmptyState title="Nenhum responsável cadastrado." action={<CreateResponsibleDialog trigger={<Button>Novo Responsável</Button>} />} />
          )}
        </TabsContent>
        <TabsContent value="settings" className="mt-4 max-w-2xl space-y-5 rounded-lg border bg-card p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Validade padrão em anos</Label><Input type="number" min={1} value={validity} onChange={(e) => setValidity(Number(e.target.value))} /></div>
            <div className="space-y-2"><Label>Antecedência do alerta em anos</Label><Input type="number" min={0} value={warning} onChange={(e) => setWarning(Number(e.target.value))} /></div>
          </div>
          <ValidityPreview validity={validity} warning={warning} />
          <Button onClick={() => updateSettings.mutate({ validity_years: validity, warning_years: warning })}><Save className="h-4 w-4" />Salvar</Button>
        </TabsContent>
      </Tabs>
    </main>
  );
}

const previewIcon: Record<StatusKey, typeof Check> = {
  ok: Check,
  warning: Clock,
  overdue: AlertTriangle,
  missing: AlertTriangle,
  requested: Clock,
  planned: Calendar,
  late: AlertTriangle,
  na: Check,
};

const previewCellClass: Record<"ok" | "warning" | "overdue", string> = {
  ok: "border-status-ok/40 bg-status-ok/15 text-status-ok",
  warning: "border-status-warning/40 bg-status-warning/15 text-status-warning",
  overdue: "border-status-overdue/40 bg-status-overdue/15 text-status-overdue",
};

function ValidityPreview({ validity, warning }: { validity: number; warning: number }) {
  const current = new Date().getFullYear();
  const validityValid = Number.isFinite(validity) && validity >= 1;
  const warningValid = Number.isFinite(warning) && warning >= 0;

  if (!validityValid || !warningValid) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        Informe valores válidos: validade ≥ 1 e antecedência ≥ 0.
      </div>
    );
  }

  const years = Array.from({ length: validity + 3 }, (_, index) => current - (validity + 2) + index);
  const config = { validity_years: validity, warning_years: warning };
  const anoDefasado = current - validity;
  const anoAtencao = current - (validity - warning);
  const anoOk = anoAtencao + 1;
  const hasWarningBand = warning < validity;

  return (
    <div className="space-y-4 rounded-lg border bg-background/40 p-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Pré-visualização da regra</p>
        <div className="flex flex-wrap gap-1.5">
          {years.map((year) => {
            const status = computeStatus({ year, requested: false }, config, current) as "ok" | "warning" | "overdue";
            const Icon = previewIcon[status] ?? Check;
            const isToday = year === current;
            return (
              <div
                key={year}
                className={`flex min-w-[58px] flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs transition-colors ${previewCellClass[status]} ${isToday ? "ring-1 ring-primary ring-offset-1 ring-offset-background" : ""}`}
                title={`${year} — ${statusMeta[status].label}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="font-medium leading-none">{year}</span>
                {isToday ? <span className="text-[10px] uppercase tracking-wide opacity-80">hoje</span> : null}
              </div>
            );
          })}
        </div>
      </div>
      <ul className="space-y-1.5 text-sm">
        <li className="flex items-start gap-2 text-status-ok">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="text-foreground">Projetos realizados em <strong className="text-status-ok">{anoOk}</strong> ou depois estão OK</span>
        </li>
        {hasWarningBand ? (
          <li className="flex items-start gap-2 text-status-warning">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="text-foreground">Projetos realizados em <strong className="text-status-warning">{anoAtencao}</strong> vencem este ano e precisam ser renovados</span>
          </li>
        ) : (
          <li className="flex items-start gap-2 text-muted-foreground">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Antecedência maior ou igual à validade — nenhum ano fica em atenção.</span>
          </li>
        )}
        <li className="flex items-start gap-2 text-status-overdue">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="text-foreground">Projetos realizados em <strong className="text-status-overdue">{anoDefasado}</strong> ou antes estão expirados</span>
        </li>
      </ul>
    </div>
  );
}
