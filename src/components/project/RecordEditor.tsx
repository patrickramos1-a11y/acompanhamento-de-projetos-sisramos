import type { ReactNode } from "react";
import { FormEvent, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ProjectRecord, useResponsibles, useUpdateProjectRecord } from "@/hooks/useProjectData";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const months = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

function parsePlanned(value: string | null | undefined) {
  if (!value) return { month: "", year: "" };
  const m = /^(\d{4})-(\d{2})/.exec(value);
  if (!m) return { month: "", year: "" };
  return { year: m[1], month: m[2] };
}

export function RecordEditor({ record, trigger }: { record: ProjectRecord; trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(record.year?.toString() ?? "");
  const [requested, setRequested] = useState(record.requested);
  const [notApplicable, setNotApplicable] = useState<boolean>(Boolean((record as any).not_applicable));
  const [noExpiration, setNoExpiration] = useState<boolean>(Boolean((record as any).no_expiration));
  const [planned, setPlanned] = useState<boolean>(Boolean((record as any).planned));
  const initialPlanned = parsePlanned((record as any).planned_for ?? null);
  const [plannedMonth, setPlannedMonth] = useState(initialPlanned.month);
  const [plannedYear, setPlannedYear] = useState(initialPlanned.year);
  const [responsibleId, setResponsibleId] = useState<string>(((record as any).responsible_id ?? "none") as string);
  const [error, setError] = useState<string | null>(null);
  const updateRecord = useUpdateProjectRecord();
  const responsiblesQuery = useResponsibles();
  const responsibles = (responsiblesQuery.data ?? []).slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));

  // Reset when reopening with a different record
  useEffect(() => {
    if (open) {
      setYear(record.year?.toString() ?? "");
      setRequested(record.requested);
      setNotApplicable(Boolean((record as any).not_applicable));
      setPlanned(Boolean((record as any).planned));
      const p = parsePlanned((record as any).planned_for ?? null);
      setPlannedMonth(p.month);
      setPlannedYear(p.year);
      setResponsibleId(((record as any).responsible_id ?? "none") as string);
      setError(null);
    }
  }, [open, record]);

  const handleNotApplicable = (value: boolean) => {
    setNotApplicable(value);
    if (value) {
      setRequested(false);
      setPlanned(false);
      setYear("");
    }
  };

  const handleRequested = (value: boolean) => {
    if (notApplicable) return;
    setRequested(value);
    if (value) setPlanned(false);
  };

  const handlePlanned = (value: boolean) => {
    if (notApplicable) return;
    setPlanned(value);
    if (value) setRequested(false);
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (planned && (!plannedMonth || !plannedYear)) {
      setError("Informe mês e ano da previsão de entrega.");
      return;
    }

    const plannedFor = planned && plannedMonth && plannedYear ? `${plannedYear}-${plannedMonth}-01` : null;

    await updateRecord.mutateAsync({
      id: record.id,
      values: {
        year: notApplicable ? null : year.trim() ? Number(year) : null,
        requested: notApplicable ? false : requested,
        notes: (record as any).notes !== undefined ? (record.notes ?? null) : null,
        not_applicable: notApplicable,
        planned: notApplicable ? false : planned,
        planned_for: notApplicable ? null : plannedFor,
      } as any,
    });
    setOpen(false);
  }

  // Notes need to remain controlled — keep separate
  const [notes, setNotes] = useState(record.notes ?? "");
  useEffect(() => {
    if (open) setNotes(record.notes ?? "");
  }, [open, record]);

  // Override submit values to include notes
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (planned && (!plannedMonth || !plannedYear)) {
      setError("Informe mês e ano da previsão de entrega.");
      return;
    }
    const plannedFor = planned && plannedMonth && plannedYear ? `${plannedYear}-${plannedMonth}-01` : null;
    const finalResponsible = !notApplicable && planned && responsibleId !== "none" ? responsibleId : null;
    await updateRecord.mutateAsync({
      id: record.id,
      values: {
        year: notApplicable ? null : year.trim() ? Number(year) : null,
        requested: notApplicable ? false : requested,
        notes: notes.trim() || null,
        not_applicable: notApplicable,
        planned: notApplicable ? false : planned,
        planned_for: notApplicable ? null : plannedFor,
        responsible_id: finalResponsible,
      } as any,
    });
    setOpen(false);
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => String(currentYear + i));
  const isMobile = useIsMobile();

  const formContent = (
    <form className="space-y-4" onSubmit={submit}>
      {/* Não aplicável */}
      <div className={cn(
        "flex items-start justify-between gap-3 rounded-md border p-3",
        notApplicable ? "border-status-na/40 bg-muted/30" : "border-border",
      )}>
        <div className="flex-1">
          <Label className="text-sm font-medium">Não aplicável</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">Este projeto não é exigido para este cliente</p>
        </div>
        <Switch checked={notApplicable} onCheckedChange={handleNotApplicable} />
      </div>

      <div className={cn("space-y-4", notApplicable && "opacity-50 pointer-events-none")}>
        <div className="space-y-2">
          <Label>Ano concluído</Label>
          <Input
            inputMode="numeric"
            placeholder="Ex: 2024"
            value={year}
            onChange={(event) => setYear(event.target.value.replace(/\D/g, "").slice(0, 4))}
            disabled={notApplicable}
          />
        </div>

        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <Label>Solicitado</Label>
          <Switch checked={requested} onCheckedChange={handleRequested} disabled={notApplicable} />
        </div>

        <div className={cn(
          "rounded-md border p-3 space-y-3",
          planned ? "border-status-planned/40 bg-status-planned/5" : "border-border",
        )}>
          <div className="flex items-center justify-between">
            <Label>Planejado</Label>
            <Switch checked={planned} onCheckedChange={handlePlanned} disabled={notApplicable} />
          </div>
          {planned && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Previsão de entrega</Label>
                <div className="flex gap-2">
                  <Select value={plannedMonth} onValueChange={setPlannedMonth} disabled={notApplicable}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Mês" /></SelectTrigger>
                    <SelectContent>
                      {months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={plannedYear} onValueChange={setPlannedYear} disabled={notApplicable}>
                    <SelectTrigger className="w-28"><SelectValue placeholder="Ano" /></SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Responsável</Label>
                <Select value={responsibleId} onValueChange={setResponsibleId} disabled={notApplicable}>
                  <SelectTrigger><SelectValue placeholder="Sem responsável" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem responsável</SelectItem>
                    {responsibles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button className="w-full" disabled={updateRecord.isPending}>
        <Save className="h-4 w-4" />
        Salvar
      </Button>
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger ?? <Button variant="outline" size="sm">Editar</Button>}</SheetTrigger>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-xl p-4 safe-pb">
          <SheetHeader className="mb-3 text-left">
            <SheetTitle>Editar registro</SheetTitle>
          </SheetHeader>
          {formContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger ?? <Button variant="outline" size="sm">Editar</Button>}</PopoverTrigger>
      <PopoverContent align="end" collisionPadding={16} className="w-96 max-h-[var(--radix-popover-content-available-height)] overflow-y-auto">
        {formContent}
      </PopoverContent>
    </Popover>
  );
}
