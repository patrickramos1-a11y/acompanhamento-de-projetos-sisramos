import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RecordEditor } from "@/components/project/RecordEditor";
import { ComplianceBar, EmptyState, PageSkeleton, StatusBadge } from "@/components/project/status-ui";
import { usePlatformData } from "@/hooks/useProjectData";
import { computeStatus, statusDistance, statusMeta, validUntil } from "@/lib/status";
import { complianceScore } from "@/lib/status";
import { sortByCriticality } from "@/lib/project-view";

export default function ClientDetail() {
  const { id } = useParams();
  const { clients, projectTypes, records, settings, isLoading } = usePlatformData();

  if (isLoading) return <PageSkeleton />;
  const client = clients.data?.find((item) => item.id === id);
  const config = settings.data;
  if (!client || !config) return <EmptyState title="Cliente não encontrado." action={<Button asChild><Link to="/">Voltar ao painel</Link></Button>} />;

  const types = projectTypes.data ?? [];
  const byType = new Map((records.data ?? []).filter((record) => record.client_id === client.id).map((record) => [record.project_type_id, record]));
  const rows = types
    .map((type) => ({ type, record: byType.get(type.id), status: computeStatus(byType.get(type.id) ?? { year: null, requested: false }, config) }))
    .sort((a, b) => sortByCriticality(a.status, b.status));
  const score = complianceScore(rows.map((row) => row.status));

  return (
    <main className="space-y-5">
      <Button variant="ghost" asChild><Link to="/"><ArrowLeft className="h-4 w-4" />Painel</Link></Button>
      <header className="rounded-lg border bg-card p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">{client.name}</h1>
            <p className="text-sm text-muted-foreground">{client.code}{client.responsible ? ` · ${client.responsible}` : ""}</p>
          </div>
          <div className="w-full md:w-64">
            <div className="mb-2 flex justify-between text-sm"><span>Conformidade</span><strong>{score}%</strong></div>
            <ComplianceBar value={score} />
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Tipo</TableHead><TableHead>Status</TableHead><TableHead>Ano</TableHead><TableHead>Válido até</TableHead><TableHead>Situação</TableHead><TableHead>Observações</TableHead><TableHead className="text-right">Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ type, record, status }) => record ? (
              <TableRow key={type.id}>
                <TableCell><div className="font-medium">{type.name}</div><div className="text-xs text-muted-foreground">{type.abbreviation}</div></TableCell>
                <TableCell><StatusBadge status={status} /></TableCell>
                <TableCell>{record.year ?? "—"}</TableCell>
                <TableCell>{validUntil(record.year, config) ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{statusDistance(record, config)}</TableCell>
                <TableCell className="max-w-xs truncate">{record.notes ?? "—"}</TableCell>
                <TableCell className="text-right"><RecordEditor record={record} /></TableCell>
              </TableRow>
            ) : (
              <TableRow key={type.id}>
                <TableCell>{type.name}</TableCell><TableCell><span className={statusMeta.missing.className}>Falta</span></TableCell><TableCell colSpan={5}>Registro ainda não criado.</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </main>
  );
}
