import { describe, expect, it } from "vitest";

import {
  checkFieldCorrections,
  formAccessFor,
  isCorrectableField,
} from "../form-access";
import type { FormFieldDefinition, FormSchema } from "../types";

function field(
  key: string,
  extra: Partial<FormFieldDefinition> & { visibility?: string } = {},
): FormFieldDefinition {
  return { key, label: key.toUpperCase(), type: "TEXT", ...extra } as never;
}

describe("formAccessFor", () => {
  it("gives nothing without a role", () => {
    expect(formAccessFor([])).toEqual({
      canView: false,
      canCorrectFields: false,
      canActOnAnyStep: false,
    });
  });

  it("lets a viewer only view", () => {
    expect(formAccessFor(["VIEWER"])).toEqual({
      canView: true,
      canCorrectFields: false,
      canActOnAnyStep: false,
    });
  });

  it("lets a manager view and correct, not act", () => {
    expect(formAccessFor(["MANAGER"])).toEqual({
      canView: true,
      canCorrectFields: true,
      canActOnAnyStep: false,
    });
  });

  it("lets an owner do everything", () => {
    expect(formAccessFor(["OWNER"])).toEqual({
      canView: true,
      canCorrectFields: true,
      canActOnAnyStep: true,
    });
  });
});

describe("isCorrectableField", () => {
  it("allows what the requester fills", () => {
    expect(isCorrectableField(field("title"))).toBe(true);
    expect(isCorrectableField(field("pick", { type: "SELECT" }))).toBe(true);
  });

  it("refuses system, file, hidden, admin-only and access-service fields", () => {
    expect(isCorrectableField(field("n", { type: "SYSTEM_FIELD" }))).toBe(
      false,
    );
    expect(isCorrectableField(field("c", { type: "COMPUTED" }))).toBe(false);
    expect(isCorrectableField(field("_sys_x"))).toBe(false);
    expect(isCorrectableField(field("f", { type: "FILE" }))).toBe(false);
    expect(isCorrectableField(field("h", { visibility: "HIDDEN" }))).toBe(
      false,
    );
    expect(
      isCorrectableField(field("a", { visibility: "ADMINISTRATIVE" })),
    ).toBe(false);
    expect(
      isCorrectableField(
        field("svc", {
          type: "LOOKUP",
          config: { dataSource: "ACCESS_SERVICES" },
        }),
      ),
    ).toBe(false);
  });
});

describe("checkFieldCorrections", () => {
  const schema: FormSchema = {
    fields: [
      field("title", { required: true }),
      field("note"),
      field("file", { type: "FILE" }),
    ],
  };
  const shown = () => true;

  it("accepts a change to a correctable field", () => {
    expect(
      checkFieldCorrections({
        schema,
        updates: { title: "Fixed" },
        merged: { title: "Fixed" },
        isShown: shown,
      }),
    ).toEqual([]);
  });

  it("refuses unknown and non-correctable fields", () => {
    expect(
      checkFieldCorrections({
        schema,
        updates: { nope: 1, file: [] },
        merged: {},
        isShown: shown,
      }),
    ).toEqual([
      '"nope" is not a field of this form.',
      "FILE can't be corrected.",
    ]);
  });

  it("won't empty a required field the form shows", () => {
    expect(
      checkFieldCorrections({
        schema,
        updates: { title: "" },
        merged: { title: "" },
        isShown: shown,
      }),
    ).toEqual(["TITLE is required."]);
    expect(
      checkFieldCorrections({
        schema,
        updates: { title: "" },
        merged: { title: "" },
        isShown: () => false,
      }),
    ).toEqual([]);
  });

  it("needs at least one change", () => {
    expect(
      checkFieldCorrections({
        schema,
        updates: {},
        merged: {},
        isShown: shown,
      }),
    ).toEqual(["Nothing to change."]);
  });
});
