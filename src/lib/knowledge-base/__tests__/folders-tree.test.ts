import { describe, expect, it } from "vitest";
import {
  exceedsFolderDepth,
  folderDepth,
  folderSubtreeHeight,
  wouldCreateFolderCycle,
} from "../folders-tree";

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

  it("measures depth and subtree height", () => {
    expect(folderDepth(folders, null)).toBe(0);
    expect(folderDepth(folders, "root")).toBe(1);
    expect(folderDepth(folders, "leaf")).toBe(3);
    expect(folderSubtreeHeight(folders, "root")).toBe(3);
    expect(folderSubtreeHeight(folders, "leaf")).toBe(1);
  });
  it("allows at most three levels of folders", () => {
    // New folders: fine up to level 3, refused inside a level-3 folder.
    expect(exceedsFolderDepth(folders, null, null)).toBe(false);
    expect(exceedsFolderDepth(folders, null, "child")).toBe(false);
    expect(exceedsFolderDepth(folders, null, "leaf")).toBe(true);
    // Moves count the folders inside the one being moved.
    expect(exceedsFolderDepth(folders, "other", "child")).toBe(false);
    expect(exceedsFolderDepth(folders, "child", "other")).toBe(false);
    expect(exceedsFolderDepth(folders, "root", "other")).toBe(true);
    expect(exceedsFolderDepth(folders, "leaf", "other")).toBe(false);
    expect(exceedsFolderDepth(folders, "root", null)).toBe(false);
  });
});
