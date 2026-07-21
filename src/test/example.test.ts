import { describe, it, expect } from "vitest";
import { computeStatus, effectiveStatusSettings, validUntil } from "@/lib/status";

describe("project type validity override", () => {
  const settings = { validity_years: 5, warning_years: 1 };

  it("uses the global validity when the type has no override", () => {
    const typeConfig = effectiveStatusSettings(settings, { validity_years_override: null });

    expect(validUntil(2023, typeConfig)).toBe(2028);
    expect(computeStatus({ year: 2023, requested: false }, typeConfig, 2026)).toBe("ok");
  });

  it("uses a shorter type validity to mark records overdue", () => {
    const typeConfig = effectiveStatusSettings(settings, { validity_years_override: 2 });

    expect(validUntil(2023, typeConfig)).toBe(2025);
    expect(computeStatus({ year: 2023, requested: false }, typeConfig, 2026)).toBe("overdue");
  });

  it("uses a longer type validity to keep records ok", () => {
    const typeConfig = effectiveStatusSettings(settings, { validity_years_override: 10 });

    expect(validUntil(2019, typeConfig)).toBe(2029);
    expect(computeStatus({ year: 2019, requested: false }, typeConfig, 2026)).toBe("ok");
  });

  it("keeps no-expiration records ok regardless of the override", () => {
    const typeConfig = effectiveStatusSettings(settings, { validity_years_override: 1 });

    expect(computeStatus({ year: 2019, requested: false, no_expiration: true }, typeConfig, 2026)).toBe("ok");
  });
});
