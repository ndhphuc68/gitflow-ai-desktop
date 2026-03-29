import { KeyboardEvent, useEffect, useMemo, useRef } from "react";

import { LoadingSpinner } from "../../../shared/ui/loading-spinner";
import { Commit } from "../entities/commit";

type HistoryListPanelProps = {
  isLoading: boolean;
  errorMessage: string | null;
  commits: Commit[];
  selectedCommitHash: string | null;
  onSelectCommit: (commit: Commit) => void;
  onClearSelection?: () => void;
  isKeyboardFocused?: boolean;
  onActivateKeyboardZone?: () => void;
};

export function HistoryListPanel({
  isLoading,
  errorMessage,
  commits,
  selectedCommitHash,
  onSelectCommit,
  onClearSelection,
  isKeyboardFocused = false,
  onActivateKeyboardZone,
}: HistoryListPanelProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const selectedIndex = useMemo(
    () => commits.findIndex((commit) => commit.hash === selectedCommitHash),
    [commits, selectedCommitHash]
  );

  useEffect(() => {
    if (!selectedCommitHash) {
      return;
    }
    const selectedElement = listRef.current?.querySelector<HTMLElement>('[data-selected="true"]');
    selectedElement?.scrollIntoView({ block: "nearest" });
  }, [selectedCommitHash]);

  const handlePanelKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (commits.length === 0) {
      return;
    }
    if (
      event.key !== "ArrowDown" &&
      event.key !== "ArrowUp" &&
      event.key !== "Home" &&
      event.key !== "End" &&
      event.key !== "Enter"
    ) {
      return;
    }

    event.preventDefault();

    if (event.key === "Enter") {
      const current = selectedIndex >= 0 ? commits[selectedIndex] : commits[0];
      if (current) {
        onSelectCommit(current);
      }
      return;
    }

    let nextIndex = selectedIndex >= 0 ? selectedIndex : 0;
    if (event.key === "ArrowDown") {
      nextIndex = Math.min(commits.length - 1, nextIndex + 1);
    } else if (event.key === "ArrowUp") {
      nextIndex = Math.max(0, nextIndex - 1);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = commits.length - 1;
    }

    const nextCommit = commits[nextIndex];
    if (nextCommit) {
      onSelectCommit(nextCommit);
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col text-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
          History
        </h3>
        <div className="flex items-center gap-2">
          {selectedCommitHash && onClearSelection ? (
            <button
              type="button"
              onClick={onClearSelection}
              className="ui-button-secondary px-2 py-0.5 text-[11px] font-medium"
            >
              Clear selection
            </button>
          ) : null}
          <span className="text-xs text-[var(--color-text-secondary)]">{commits.length} commits</span>
        </div>
      </div>

      {isLoading && <p className="text-[var(--color-text-secondary)]">Loading commit history...</p>}

      {errorMessage && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/50 bg-[var(--color-danger-soft)] p-3 text-[var(--color-text)]">
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {!isLoading && !errorMessage && commits.length === 0 && (
        <p className="text-[var(--color-text-secondary)]">No commits found for this branch.</p>
      )}

      {!isLoading && !errorMessage && commits.length > 0 && (
        <ul className="min-h-0 flex-1 space-y-1 overflow-auto pr-1">
          {commits.map((commit) => {
            const isSelected = selectedCommitHash === commit.hash;
            return (
              <li key={commit.hash}>
                <button
                  data-selected={isSelected ? "true" : "false"}
                  type="button"
                  onClick={() => onSelectCommit(commit)}
                  aria-current={isSelected ? "true" : undefined}
                  className={`w-full rounded-[var(--radius-md)] py-2 pr-3 text-left transition ${
                    isSelected
                        ? "ui-row-selected border-l-4 border-l-[var(--color-primary)] pl-2"
                        : "ui-table-row pl-3"
                  }`}
                  title={commit.hash}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                        isSelected
                          ? "border-[var(--color-primary)]/60 bg-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] text-[var(--color-primary-soft)]"
                          : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {commit.shortHash}
                    </span>
                    <span
                      className={`truncate ${isSelected ? "font-medium text-[var(--color-text)]" : "text-[var(--color-text)]"}`}
                    >
                      {commit.subject}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {commit.authorName} - {new Date(commit.authoredAt).toLocaleString()}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


