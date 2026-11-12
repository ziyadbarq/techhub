import { describe, expect, it } from "vitest";
import { wouldCreateFolderCycle } from "../folders-tree";

const folders = [
  { id: "root", parentId: null },
  { id: "child", parentId: "root" },
  { id: "leaf", parentId: "child" },
  { id: "other", parentId: null },
];

describe("Knowledge folders tree", () => {
  it("prevents self-parenting and descendant cycles", () => {
    expect(wouldCreateFolderCycle(folders, "root", "root")).toBe(true);
    expect(wouldCreateFolderCycle(folders, "root", "leaf")).toBe(true);
    expect(wouldCreateFolderCycle(folders, "child", "leaf")).toBe(true);
  });
  it("allows root placement and unrelated parents", () => {
    expect(wouldCreateFolderCycle(folders, "root", null)).toBe(false);
    expect(wouldCreateFolderCycle(folders, "child", "other")).toBe(false);
  });
});
