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
    <div className="mb-4 border-b border-zinc-800 pb-4">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Recent
      </h2>
      {isLoading && (
        <p className="text-xs text-zinc-500" role="status">
          Loading…
        </p>
      )}
      {!isLoading && loadErrorMessage && (
        <p className="text-xs text-red-300/90" role="alert">
          {loadErrorMessage}
        </p>
      )}
      {!isLoading && removeErrorMessage && (
        <p className="mb-2 text-xs text-red-300/90" role="alert">
          {removeErrorMessage}
        </p>
      )}
      {showEmpty && (
        <p className="text-xs text-zinc-500">No recent repositories yet.</p>
      )}
      {showList && (
        <ul className="max-h-48 space-y-1 overflow-y-auto pr-0.5">
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
                  className={`min-w-0 flex-1 rounded border px-2 py-1.5 text-left text-xs transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isActive
                      ? "border-zinc-500 bg-zinc-800/80 text-zinc-50"
                      : "border-transparent bg-zinc-900/60 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800/60"
                  }`}
                >
                  <span className="block truncate font-medium">{entry.name}</span>
                  <span
                    className="mt-0.5 block truncate font-mono text-[10px] text-zinc-500"
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
                  className="shrink-0 rounded border border-zinc-800 px-1.5 text-xs text-zinc-500 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
