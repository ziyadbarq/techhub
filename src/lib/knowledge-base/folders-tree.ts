export type FolderLink = { id: string; parentId: string | null };

export function wouldCreateFolderCycle(
  folders: readonly FolderLink[],
  sourceId: string,
  parentId: string | null,
): boolean {
  const parentById = new Map(
    folders.map((folder) => [folder.id, folder.parentId]),
  );
  const visited = new Set<string>();
  let current = parentId;
  while (current !== null) {
    if (current === sourceId || visited.has(current)) return true;
    visited.add(current);
    current = parentById.get(current) ?? null;
  }
  return false;
}

/** A top-level folder is level 1; folders can nest down to this level. */
export const MAX_FOLDER_DEPTH = 3;

/** Level of a folder: 1 at the top, 2 inside it, and so on. 0 for "no folder". */
export function folderDepth(
  folders: readonly FolderLink[],
  folderId: string | null,
): number {
  const parentById = new Map(
    folders.map((folder) => [folder.id, folder.parentId]),
  );
  const visited = new Set<string>();
  let depth = 0;
  let current = folderId;
  while (current !== null && !visited.has(current)) {
    visited.add(current);
    depth += 1;
    current = parentById.get(current) ?? null;
  }
  return depth;
}

/** Levels a folder occupies with everything inside it: 1 for an empty folder. */
export function folderSubtreeHeight(
  folders: readonly FolderLink[],
  folderId: string,
): number {
  const children = new Map<string, string[]>();
  for (const folder of folders) {
    if (folder.parentId === null) continue;
    const list = children.get(folder.parentId) ?? [];
    list.push(folder.id);
    children.set(folder.parentId, list);
  }
  const visited = new Set<string>();
  const height = (id: string): number => {
    if (visited.has(id)) return 0;
    visited.add(id);
    let deepest = 0;
    for (const child of children.get(id) ?? []) {
      deepest = Math.max(deepest, height(child));
    }
    return deepest + 1;
  };
  return height(folderId);
}

/**
 * Whether putting a folder under `parentId` would go deeper than
 * MAX_FOLDER_DEPTH. `sourceId` is the folder being moved, or null for a new
 * (empty) folder.
 */
export function exceedsFolderDepth(
  folders: readonly FolderLink[],
  sourceId: string | null,
  parentId: string | null,
): boolean {
  const height = sourceId ? folderSubtreeHeight(folders, sourceId) : 1;
  return folderDepth(folders, parentId) + height > MAX_FOLDER_DEPTH;
}
