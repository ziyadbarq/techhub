import { describe, expect, it } from "vitest";
import {
  agreementReportToCsv,
  buildAgreementReport,
  type AgreementPerson,
} from "../agreement-report";

const person = (userId: string, name: string, department: string | null = null): AgreementPerson => ({
  userId,
  name,
  email: `${userId}@barq.test`,
  department,
});

const at = (iso: string) => new Date(iso);

describe("buildAgreementReport", () => {
  const audience = [person("u1", "Sara"), person("u2", "Ahmed"), person("u3", "Bader")];

  it("counts only agreements to the current version", () => {
    const report = buildAgreementReport(3, audience, [
      { userId: "u1", version: 3, acknowledgedAt: at("2026-11-10T08:00:00Z") },
      { userId: "u2", version: 2, acknowledgedAt: at("2026-10-01T08:00:00Z") },
    ]);
    expect(report).toMatchObject({ version: 3, total: 3, agreedCount: 1, pendingCount: 2 });
    expect(report.agreed.map((r) => r.userId)).toEqual(["u1"]);
    expect(report.agreed[0].agreedAt).toBe("2026-11-10T08:00:00.000Z");
  });

  it("notes the latest earlier version a pending person agreed to", () => {
    const report = buildAgreementReport(4, audience, [
      { userId: "u2", version: 1, acknowledgedAt: at("2026-01-01T00:00:00Z") },
      { userId: "u2", version: 3, acknowledgedAt: at("2026-06-01T00:00:00Z") },
    ]);
    const ahmed = report.pending.find((r) => r.userId === "u2");
    expect(ahmed?.previousVersion).toBe(3);
    expect(report.pending.find((r) => r.userId === "u3")?.previousVersion).toBeNull();
  });

  it("ignores agreements from people outside the audience", () => {
    const report = buildAgreementReport(1, audience, [
      { userId: "former", version: 1, acknowledgedAt: at("2026-11-01T00:00:00Z") },
    ]);
    expect(report.agreedCount).toBe(0);
    expect(report.total).toBe(3);
  });

  it("de-duplicates the audience and sorts pending by name", () => {
    const report = buildAgreementReport(1, [...audience, person("u1", "Sara")], []);
    expect(report.total).toBe(3);
    expect(report.pending.map((r) => r.name)).toEqual(["Ahmed", "Bader", "Sara"]);
  });

  it("lists the most recent agreements first", () => {
    const report = buildAgreementReport(1, audience, [
      { userId: "u1", version: 1, acknowledgedAt: at("2026-11-01T00:00:00Z") },
      { userId: "u3", version: 1, acknowledgedAt: at("2026-11-05T00:00:00Z") },
    ]);
    expect(report.agreed.map((r) => r.userId)).toEqual(["u3", "u1"]);
  });
});

describe("agreementReportToCsv", () => {
  it("writes one row per person and neutralises formula cells", () => {
    const report = buildAgreementReport(
      2,
      [person("u1", "=HYPERLINK(\"x\")", "IT, Ops"), person("u2", "Ahmed")],
      [
        { userId: "u1", version: 2, acknowledgedAt: at("2026-11-10T08:00:00Z") },
        { userId: "u2", version: 1, acknowledgedAt: at("2026-10-10T08:00:00Z") },
      ],
    );
    const lines = agreementReportToCsv(report).trim().split("\r\n");
    expect(lines[0]).toBe("Name,Email,Department,Status,Agreed at,Previously agreed version");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe(
      '"\'=HYPERLINK(""x"")",u1@barq.test,"IT, Ops",Agreed,2026-11-10T08:00:00.000Z,',
    );
    expect(lines[2]).toBe("Ahmed,u2@barq.test,,Pending,,v1");
  });
});
