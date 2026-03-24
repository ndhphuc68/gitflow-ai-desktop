export type WorkingDiffScope = "staged" | "unstaged";

export type WorkingDiffSelection = {
  path: string;
  scope: WorkingDiffScope;
};

/** Aligns status paths with diff headers across Windows/Git output styles. */
export function normalizeWorkingTreeFilePath(path: string): string {
  return path.trim().replace(/\\/g, "/");
}

export function workingDiffSelectionKey(selection: WorkingDiffSelection): string {
  return `${selection.scope}:${normalizeWorkingTreeFilePath(selection.path)}`;
}
