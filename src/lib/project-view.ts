import { Client, ProjectRecord, ProjectType, Settings } from "@/hooks/useProjectData";
import { complianceScore, computeStatus, StatusKey, statusMeta, worstStatus } from "@/lib/status";

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
  return statusMeta[b].rank - statusMeta[a].rank;
}

