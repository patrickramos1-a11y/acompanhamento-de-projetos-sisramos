import type { ReactNode } from "react";
import { FormEvent, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ProjectRecord, useUpdateProjectRecord } from "@/hooks/useProjectData";

export function RecordEditor({ record, trigger }: { record: ProjectRecord; trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(record.year?.toString() ?? "");
  const [requested, setRequested] = useState(record.requested);
  const [notes, setNotes] = useState(record.notes ?? "");
  const updateRecord = useUpdateProjectRecord();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await updateRecord.mutateAsync({
      id: record.id,
      values: {
        year: year.trim() ? Number(year) : null,
        requested,
        notes: notes.trim() || null,
      },
    });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger ?? <Button variant="outline" size="sm">Editar</Button>}</PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Ano concluído</Label>
            <Input inputMode="numeric" placeholder="Ex: 2024" value={year} onChange={(event) => setYear(event.target.value.replace(/\D/g, "").slice(0, 4))} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <Label>Solicitado</Label>
            <Switch checked={requested} onCheckedChange={setRequested} />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
          </div>
          <Button className="w-full" size="sm" disabled={updateRecord.isPending}>
            <Save className="h-4 w-4" />
            Salvar
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
