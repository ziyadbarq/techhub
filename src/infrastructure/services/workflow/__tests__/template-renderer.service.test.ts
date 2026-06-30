import { describe, it, expect } from "vitest";

import { renderTemplate } from "@/infrastructure/services/workflow/template-renderer.service";

describe("renderTemplate", () => {
  it("substitutes flat keys", () => {
    const out = renderTemplate("Hi {{requester_name}}, ref {{request_id}}", {
      requester_name: "Ziyad",
      request_id: "REQ-001",
    });
    expect(out).toBe("Hi Ziyad, ref REQ-001");
  });

  it("supports dot-paths", () => {
    const out = renderTemplate(
      "Status: {{request.status}} at {{request.url}}",
      {
        request: { status: "IN_REVIEW", url: "https://x/r/1" },
      },
    );
    expect(out).toBe("Status: IN_REVIEW at https://x/r/1");
  });

  it("substitutes form fields via {{field.<key>}}", () => {
    const out = renderTemplate(
      "Title: {{field.title}} priority={{field.priority}}",
      {
        field: { title: "Disk full", priority: "high" },
      },
    );
    expect(out).toBe("Title: Disk full priority=high");
  });

  it("renders missing variables as empty string", () => {
    const out = renderTemplate("Missing: [{{nope}}] [{{a.b.c}}]", {});
    expect(out).toBe("Missing: [] []");
  });

  it("tolerates whitespace inside braces", () => {
    const out = renderTemplate("{{ a }} {{   b.c   }}", { a: 1, b: { c: 2 } });
    expect(out).toBe("1 2");
  });

  it("stringifies object values", () => {
    const out = renderTemplate("Bag: {{x}}", { x: { k: 1 } });
    expect(out).toBe('Bag: {"k":1}');
  });
});
