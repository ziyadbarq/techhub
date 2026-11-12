export type FolderLink = { id: string; parentId: string | null };

export function wouldCreateFolderCycle(
  folders: readonly FolderLink[],
  sourceId: string,
  parentId: string | null,
): boolean {
  const parentById = new Map(folders.map((folder) => [folder.id, folder.parentId]));
  const visited = new Set<string>();
  let current = parentId;
  while (current !== null) {
    if (current === sourceId || visited.has(current)) return true;
    visited.add(current);
    current = parentById.get(current) ?? null;
  }
  return false;
}
