import type { DiffChangeType } from "../entities/diff";

export function diffChangeTypeLabel(changeType: DiffChangeType): string {
  switch (changeType) {
    case "modified":
      return "Modified";
    case "added":
      return "Added";
    case "deleted":
      return "Deleted";
    case "renamed":
      return "Renamed";
    case "binary":
      return "Binary";
    default:
      return "Changed";
  }
}

export function splitFilePathForDisplay(path: string): {
  basename: string;
  parentPath: string | null;
} {
  const normalized = path.replace(/\\/g, "/");
  const slash = normalized.lastIndexOf("/");
  if (slash < 0) {
    return { basename: path, parentPath: null };
  }
  return {
    basename: normalized.slice(slash + 1),
    parentPath: normalized.slice(0, slash),
  };
}
