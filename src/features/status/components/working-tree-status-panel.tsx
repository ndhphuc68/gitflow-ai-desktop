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
  modified: "border-[var(--color-diff-modified-line)]/40 bg-[var(--color-diff-modified)] text-[var(--color-text)]",
  added: "border-[var(--color-diff-added-line)]/40 bg-[var(--color-diff-added)] text-[var(--color-text)]",
  deleted: "border-[var(--color-diff-removed-line)]/40 bg-[var(--color-diff-removed)] text-[var(--color-text)]",
  untracked: "border-[var(--color-info)]/40 bg-[var(--color-info-soft)] text-[var(--color-text)]",
  conflicted: "border-[var(--color-accent)]/40 bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] text-[var(--color-text)]",
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
    <section className="ui-panel p-4 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
          Working Tree Status
        </h3>
      </div>

      {isLoading && <p className="text-[var(--color-text-secondary)]">Loading repository status...</p>}

      {statusErrorMessage && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/50 bg-[var(--color-danger-soft)] p-3 text-[var(--color-text)]">
          <p className="font-medium">{statusErrorMessage}</p>
        </div>
      )}

      {toggleStageError && (
        <div className="mb-3 rounded-[var(--radius-md)] border border-[var(--color-danger)]/50 bg-[var(--color-danger-soft)] p-3 text-[var(--color-text)]">
          <p className="font-medium">{toggleStageError.message}</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Code: {toggleStageError.code}</p>
        </div>
      )}

      {!isLoading && !statusErrorMessage && entries.length === 0 && (
        <p className="text-[var(--color-text-secondary)]">Working tree is clean.</p>
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
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                  {GROUP_LABELS[group]} ({groupedEntries.length})
                </h4>
                <ul className="space-y-1.5">
                  {groupedEntries.map((entry) => (
                    <li
                      key={`${group}:${entry.path}:${entry.status}:${entry.staged ? "1" : "0"}:${groupedEntries.indexOf(entry)}`}
                      className="ui-table-row flex items-center gap-2 border-[var(--color-divider)] px-2 py-1.5"
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
                        className="truncate text-left text-[var(--color-text)] transition hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-60"
                        title={entry.path}
                      >
                        {entry.path}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleStage(entry, group)}
                        disabled={group === "conflicted" || isEntryMutating(entry.path)}
                        className="ui-button-secondary ml-auto px-2 py-0.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
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
