export function normalizeRepositoryRootPathForComparison(path: string): string {
  const trimmed = path.trim();
  if (trimmed.length === 0) {
    return "";
  }
  const unified = trimmed.replace(/\\/g, "/").toLowerCase();
  let result = unified;
  while (result.length > 1 && result.endsWith("/")) {
    result = result.slice(0, -1);
  }
  return result;
}

export function repositoryRootPathsEqual(a: string | null | undefined, b: string): boolean {
  if (!a) {
    return false;
  }
  if (a === b) {
    return true;
  }
  return (
    normalizeRepositoryRootPathForComparison(a) === normalizeRepositoryRootPathForComparison(b)
  );
}
