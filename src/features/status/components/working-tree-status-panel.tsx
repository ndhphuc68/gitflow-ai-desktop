import { AppError } from "../../../shared/types/app-error";
import {
  RepositoryStatusEntry,
  RepositoryStatusGroup,
} from "../entities/repository-status";

const STATUS_GROUPS: RepositoryStatusGroup[] = [
  "staged",
  "unstaged",
  "untracked",
  "conflicted",
];

const GROUP_LABELS: Record<RepositoryStatusGroup, string> = {
  staged: "Staged",
  unstaged: "Unstaged",
  untracked: "Untracked",
  conflicted: "Conflicted",
};

const STATUS_BADGE_CLASS: Record<RepositoryStatusEntry["status"], string> = {
  modified: "border-amber-600/40 bg-amber-950/60 text-amber-200",
  added: "border-emerald-600/40 bg-emerald-950/60 text-emerald-200",
  deleted: "border-rose-600/40 bg-rose-950/60 text-rose-200",
  untracked: "border-sky-600/40 bg-sky-950/60 text-sky-200",
  conflicted: "border-violet-600/40 bg-violet-950/60 text-violet-200",
};

type WorkingTreeStatusPanelProps = {
  isLoading: boolean;
  statusErrorMessage: string | null;
  toggleStageError: AppError | null;
  entries: RepositoryStatusEntry[];
  isEntryMutating: (entryPath: string) => boolean;
  onToggleStage: (entry: RepositoryStatusEntry, group: RepositoryStatusGroup) => void;
};

export function WorkingTreeStatusPanel({
  isLoading,
  statusErrorMessage,
  toggleStageError,
  entries,
  isEntryMutating,
  onToggleStage,
}: WorkingTreeStatusPanelProps) {
  return (
    <section className="rounded border border-zinc-800 bg-zinc-900 p-4 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Working Tree Status
        </h3>
      </div>

      {isLoading && <p className="text-zinc-300">Loading repository status...</p>}

      {statusErrorMessage && (
        <div className="rounded border border-red-700/50 bg-red-950/40 p-3 text-red-200">
          <p className="font-medium">{statusErrorMessage}</p>
        </div>
      )}

      {toggleStageError && (
        <div className="mb-3 rounded border border-red-700/50 bg-red-950/40 p-3 text-red-200">
          <p className="font-medium">{toggleStageError.message}</p>
          <p className="mt-1 text-xs text-red-300/90">Code: {toggleStageError.code}</p>
        </div>
      )}

      {!isLoading && !statusErrorMessage && entries.length === 0 && (
        <p className="text-zinc-300">Working tree is clean.</p>
      )}

      {!isLoading && !statusErrorMessage && entries.length > 0 && (
        <div className="space-y-4">
          {STATUS_GROUPS.map((group) => {
            const groupedEntries = entries.filter((entry) => entry.group === group);

            if (groupedEntries.length === 0) {
              return null;
            }

            return (
              <div key={group}>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
                  {GROUP_LABELS[group]} ({groupedEntries.length})
                </h4>
                <ul className="space-y-1.5">
                  {groupedEntries.map((entry) => (
                    <li
                      key={`${group}:${entry.path}:${entry.status}:${entry.staged ? "1" : "0"}:${groupedEntries.indexOf(entry)}`}
                      className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5"
                    >
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${STATUS_BADGE_CLASS[entry.status]}`}
                      >
                        {entry.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleStage(entry, group)}
                        disabled={group === "conflicted" || isEntryMutating(entry.path)}
                        className="truncate text-left text-zinc-200 transition hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                        title={entry.path}
                      >
                        {entry.path}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleStage(entry, group)}
                        disabled={group === "conflicted" || isEntryMutating(entry.path)}
                        className="ml-auto rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                        title={
                          group === "staged"
                            ? "Unstage file"
                            : group === "conflicted"
                              ? "Resolve conflict before staging"
                              : "Stage file"
                        }
                      >
                        {isEntryMutating(entry.path)
                          ? "..."
                          : group === "staged"
                            ? "Unstage"
                            : group === "conflicted"
                              ? "Blocked"
                              : "Stage"}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
