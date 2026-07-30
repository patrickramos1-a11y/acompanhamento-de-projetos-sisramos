import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ClientCard } from "@/components/project/ClientCard";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Client, ProjectRecord, ProjectType, Settings } from "@/hooks/useProjectData";

const settings: Settings = {
  id: true,
  validity_years: 5,
  warning_years: 1,
  updated_at: "2026-01-01T00:00:00Z",
};

const client: Client = {
  id: "client-1",
  name: "Cliente Teste",
  code: "CT",
  responsible: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const types: ProjectType[] = [
  {
    id: "type-ok",
    name: "Projeto Ativo",
    abbreviation: "ATV",
    display_order: 1,
    is_active: true,
    validity_years_override: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "type-na",
    name: "Projeto Nao Aplicavel",
    abbreviation: "NAA",
    display_order: 2,
    is_active: true,
    validity_years_override: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

const records: ProjectRecord[] = [
  {
    id: "record-ok",
    client_id: "client-1",
    project_type_id: "type-ok",
    year: 2025,
    requested: false,
    notes: null,
    not_applicable: false,
    no_expiration: false,
    planned: false,
    planned_for: null,
    responsible_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "record-na",
    client_id: "client-1",
    project_type_id: "type-na",
    year: null,
    requested: false,
    notes: null,
    not_applicable: true,
    no_expiration: false,
    planned: false,
    planned_for: null,
    responsible_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

function renderCard(showNotApplicable = false) {
  return render(
    <MemoryRouter>
      <TooltipProvider>
        <ClientCard client={client} types={types} records={records} settings={settings} showNotApplicable={showNotApplicable} />
      </TooltipProvider>
    </MemoryRouter>,
  );
}

describe("ClientCard not applicable visibility", () => {
  it("hides not applicable project chips by default", () => {
    renderCard();

    expect(screen.getByText("ATV")).toBeInTheDocument();
    expect(screen.queryByText("NAA")).not.toBeInTheDocument();
    expect(screen.getByText("1 N/A ocultos")).toBeInTheDocument();
  });

  it("shows not applicable project chips when enabled", () => {
    renderCard(true);

    expect(screen.getByText("ATV")).toBeInTheDocument();
    expect(screen.getByText("NAA")).toBeInTheDocument();
    expect(screen.queryByText("1 N/A ocultos")).not.toBeInTheDocument();
  });
});
