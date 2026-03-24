const DEFAULT_MAX_LENGTH = 44;

export { repositoryRootPathsEqual } from "../../../shared/utils/repository-path";

/**
 * Shortens a long filesystem path for dense sidebar display (middle ellipsis).
 */
export function shortenRepositoryPath(path: string, maxLength = DEFAULT_MAX_LENGTH): string {
  const trimmed = path.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  const headChars = Math.max(12, Math.floor((maxLength - 3) * 0.45));
  const tailChars = Math.max(12, maxLength - 3 - headChars);
  if (headChars + tailChars + 3 > trimmed.length) {
    return trimmed;
  }

  return `${trimmed.slice(0, headChars)}…${trimmed.slice(-tailChars)}`;
}
