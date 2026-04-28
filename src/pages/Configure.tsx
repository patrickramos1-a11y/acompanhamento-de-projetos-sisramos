import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, Check, Clock, GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { computeStatus, statusMeta, type StatusKey } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EmptyState, PageSkeleton } from "@/components/project/status-ui";
import { ProjectType, useCreateClient, useCreateProjectType, useDeleteClient, useDeleteProjectType, usePlatformData, useUpdateClient, useUpdateProjectType, useUpdateSettings } from "@/hooks/useProjectData";

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

function SortableTypeRow({ type }: { type: ProjectType }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: type.id });
  const updateType = useUpdateProjectType();
  const deleteType = useDeleteProjectType();
  const [name, setName] = useState(type.name);
  const [abbr, setAbbr] = useState(type.abbreviation);

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-[auto_1fr_120px_auto_auto] sm:items-center">
      <button className="text-muted-foreground" {...attributes} {...listeners} type="button"><GripVertical className="h-4 w-4" /></button>
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

export default function Configure() {
  const { clients, projectTypes, settings, isLoading } = usePlatformData(true);
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const updateType = useUpdateProjectType();
  const updateSettings = useUpdateSettings();
  const [orderedTypes, setOrderedTypes] = useState<ProjectType[]>([]);
  const [validity, setValidity] = useState(5);
  const [warning, setWarning] = useState(1);
  const [confirmCode, setConfirmCode] = useState("");

  useEffect(() => setOrderedTypes(projectTypes.data ?? []), [projectTypes.data]);
  useEffect(() => {
    if (settings.data) {
      setValidity(settings.data.validity_years);
      setWarning(settings.data.warning_years);
    }
  }, [settings.data]);

  const nextOrder = useMemo(() => (projectTypes.data?.length ?? 0) + 1, [projectTypes.data]);

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedTypes.findIndex((type) => type.id === active.id);
    const newIndex = orderedTypes.findIndex((type) => type.id === over.id);
    const next = arrayMove(orderedTypes, oldIndex, newIndex);
    setOrderedTypes(next);
    await Promise.all(next.map((type, index) => updateType.mutateAsync({ id: type.id, values: { display_order: index + 1 } })));
  }

  if (isLoading) return <PageSkeleton />;

  return (
    <main className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-normal">Configurar</h1>
        <p className="text-sm text-muted-foreground">Clientes, tipos de projeto e regra de validade.</p>
      </header>
      <Tabs defaultValue="clients">
        <TabsList><TabsTrigger value="clients">Clientes</TabsTrigger><TabsTrigger value="types">Tipos</TabsTrigger><TabsTrigger value="settings">Gerais</TabsTrigger></TabsList>
        <TabsContent value="clients" className="mt-4 space-y-3">
          <div className="flex justify-end"><CreateClientDialog trigger={<Button><Plus className="h-4 w-4" />Novo cliente</Button>} /></div>
          {clients.data?.length ? clients.data.map((client) => (
            <div key={client.id} className="grid gap-2 rounded-lg border bg-card p-3 md:grid-cols-[1fr_auto] md:items-center">
              <Input defaultValue={client.name} onBlur={(e) => e.target.value !== client.name && updateClient.mutate({ id: client.id, values: { name: e.target.value } })} />
              <AlertDialog onOpenChange={() => setConfirmCode("")}>
                <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Excluir {client.name}?</AlertDialogTitle><AlertDialogDescription>Digite o nome exato para confirmar a exclusão do cliente.</AlertDialogDescription></AlertDialogHeader>
                  <Input value={confirmCode} onChange={(e) => setConfirmCode(e.target.value)} />
                  <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction disabled={confirmCode !== client.name} onClick={() => deleteClient.mutate(client.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )) : <EmptyState title="Nenhum cliente cadastrado — cadastrar agora" action={<CreateClientDialog trigger={<Button>Novo cliente</Button>} />} />}
        </TabsContent>
        <TabsContent value="types" className="mt-4 space-y-3">
          <div className="flex justify-end"><CreateProjectTypeDialog nextOrder={nextOrder} /></div>
          {orderedTypes.length ? (
            <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={orderedTypes.map((type) => type.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">{orderedTypes.map((type) => <SortableTypeRow key={type.id} type={type} />)}</div>
              </SortableContext>
            </DndContext>
          ) : <EmptyState title="Nenhum tipo de projeto cadastrado." />}
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
