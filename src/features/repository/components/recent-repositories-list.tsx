import type { RecentRepositoryDto } from "../types/recent-repository-dto";
import {
  repositoryRootPathsEqual,
  shortenRepositoryPath,
} from "../utils/format-repository-path";

type RecentRepositoriesListProps = {
  entries: RecentRepositoryDto[];
  isLoading: boolean;
  loadErrorMessage: string | null;
  removeErrorMessage: string | null;
  currentRootPath: string | null;
  isOpenPending: boolean;
  onOpenRecent: (rootPath: string) => void;
  onRemoveRecent: (rootPath: string) => void;
  removePendingRootPath: string | null;
};

export function RecentRepositoriesList({
  entries,
  isLoading,
  loadErrorMessage,
  removeErrorMessage,
  currentRootPath,
  isOpenPending,
  onOpenRecent,
  onRemoveRecent,
  removePendingRootPath,
}: RecentRepositoriesListProps) {
  const showList = !isLoading && !loadErrorMessage && entries.length > 0;
  const showEmpty = !isLoading && !loadErrorMessage && entries.length === 0;

  return (
    <div className="border-b border-[var(--color-divider)] pb-4">
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
        Recent
      </h2>
      {isLoading && (
        <p className="text-xs text-[var(--color-text-secondary)]" role="status">
          Loading...
        </p>
      )}
      {!isLoading && loadErrorMessage && (
        <p className="text-xs text-[var(--color-danger)]" role="alert">
          {loadErrorMessage}
        </p>
      )}
      {!isLoading && removeErrorMessage && (
        <p className="mb-2 text-xs text-[var(--color-danger)]" role="alert">
          {removeErrorMessage}
        </p>
      )}
      {showEmpty && (
        <p className="text-xs text-[var(--color-text-muted)]">No recent repositories yet.</p>
      )}
      {showList && (
        <ul className="max-h-56 space-y-1 overflow-y-auto pr-0.5">
          {entries.map((entry) => {
            const isActive = repositoryRootPathsEqual(currentRootPath, entry.rootPath);
            const isRemovePending = repositoryRootPathsEqual(
              removePendingRootPath,
              entry.rootPath
            );
            return (
              <li key={entry.rootPath} className="flex items-stretch gap-1">
                <button
                  type="button"
                  disabled={isOpenPending}
                  onClick={() => {
                    onOpenRecent(entry.rootPath);
                  }}
                  aria-label={`Open repository ${entry.name}`}
                  className={`min-w-0 flex-1 rounded-[var(--radius-md)] px-2.5 py-2 text-left text-xs disabled:cursor-not-allowed disabled:opacity-50 ${
                    isActive
                      ? "ui-row-selected"
                      : "ui-sidebar-item text-[var(--color-text)]"
                  }`}
                >
                  <span className="block truncate font-medium">{entry.name}</span>
                  <span
                    className="mt-0.5 block truncate font-mono text-[10px] text-[var(--color-text-muted)]"
                    title={entry.rootPath}
                  >
                    {shortenRepositoryPath(entry.rootPath)}
                  </span>
                </button>
                <button
                  type="button"
                  title="Remove from recent"
                  aria-label={`Remove ${entry.name} from recent repositories`}
                  disabled={isRemovePending}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveRecent(entry.rootPath);
                  }}
                  className="ui-button-ghost shrink-0 px-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  x
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
