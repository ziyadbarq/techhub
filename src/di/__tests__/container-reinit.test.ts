import { afterEach, describe, expect, it } from "vitest";
import { getContainer, resetContainer } from "../container";
import { moduleRegistry } from "../module-registry";
import { ALL_MODULES } from "../module-definitions";

describe("container initialisation with a leftover registry", () => {
  afterEach(() => {
    resetContainer();
    moduleRegistry.reset();
  });

  it("starts instead of failing with 'already registered'", () => {
    resetContainer();
    moduleRegistry.reset();
    // What a dev hot reload (or a failed first attempt) leaves behind: a
    // populated registry while this module's `container` is still null.
    for (const diModule of ALL_MODULES) moduleRegistry.register(diModule);

    expect(() => getContainer()).not.toThrow();
    expect(moduleRegistry.getAll()).toHaveLength(ALL_MODULES.length);
  });
});
