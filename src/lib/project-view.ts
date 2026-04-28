import { Client, ProjectRecord, ProjectType, Settings } from "@/hooks/useProjectData";
import { complianceScore, computeStatus, StatusKey, worstStatus } from "@/lib/status";

export function recordsForClient(records: ProjectRecord[], clientId: string) {
  return records.filter((record) => record.client_id === clientId);
}

export function statusForClient(client: Client, types: ProjectType[], records: ProjectRecord[], settings: Settings) {
  const clientRecords = recordsForClient(records, client.id);
  const byType = new Map(clientRecords.map((record) => [record.project_type_id, record]));
  const statuses = types.map((type) => computeStatus(byType.get(type.id) ?? { year: null, requested: false }, settings));
  return { statuses, worst: worstStatus(statuses), score: complianceScore(statuses) };
}

export function sortByCriticality(a: StatusKey, b: StatusKey) {
  const order: Record<StatusKey, number> = { overdue: 5, warning: 4, missing: 3, requested: 2, ok: 1 };
  return order[b] - order[a];
}
