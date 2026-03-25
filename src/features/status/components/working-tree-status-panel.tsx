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
  modified: "border-warning-border bg-warning-bg text-warning-fg",
  added: "border-success-border bg-success-bg text-success-fg",
  deleted: "border-danger-border bg-danger-bg text-danger-fg",
  untracked: "border-accent-border bg-accent-bg text-accent-fg",
  conflicted: "border-subtle bg-elevated text-secondary",
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
    <section className="rounded-md border border-subtle bg-panel p-4 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="ui-section-title">
          Working Tree Status
        </h3>
      </div>

      {isLoading && <p className="text-secondary">Loading repository status...</p>}

      {statusErrorMessage && (
        <div className="rounded-md border border-danger-border bg-danger-bg p-3 text-danger-fg">
          <p className="font-medium">{statusErrorMessage}</p>
        </div>
      )}

      {toggleStageError && (
        <div className="mb-3 rounded-md border border-danger-border bg-danger-bg p-3 text-danger-fg">
          <p className="font-medium">{toggleStageError.message}</p>
          <p className="mt-1 text-xs text-danger-fg/90">Code: {toggleStageError.code}</p>
        </div>
      )}

      {!isLoading && !statusErrorMessage && entries.length === 0 && (
        <p className="text-secondary">Working tree is clean.</p>
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
                <h4 className="mb-2 ui-section-title">
                  {GROUP_LABELS[group]} ({groupedEntries.length})
                </h4>
                <ul className="space-y-1.5">
                  {groupedEntries.map((entry) => (
                    <li
                      key={`${group}:${entry.path}:${entry.status}:${entry.staged ? "1" : "0"}:${groupedEntries.indexOf(entry)}`}
                      className="flex items-center gap-2 rounded border border-subtle bg-elevated px-2 py-1.5"
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
                        className="truncate text-left text-secondary transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                        title={entry.path}
                      >
                        {entry.path}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleStage(entry, group)}
                        disabled={group === "conflicted" || isEntryMutating(entry.path)}
                        className="ml-auto rounded border border-subtle bg-panel px-2 py-0.5 text-xs text-secondary transition hover:border-strong hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
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
