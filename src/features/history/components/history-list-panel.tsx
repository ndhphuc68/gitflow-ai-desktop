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
    <section
      tabIndex={0}
      onFocus={onActivateKeyboardZone}
      onMouseDownCapture={onActivateKeyboardZone}
      onKeyDown={handlePanelKeyDown}
      className={`rounded-md border bg-panel p-4 text-sm outline-none ${
        isKeyboardFocused ? "border-accent-border ring-1 ring-accent/35" : "border-subtle"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="ui-section-title">
          Commit History
        </h3>
        <div className="flex items-center gap-2">
          {selectedCommitHash && onClearSelection ? (
            <button
              type="button"
              onClick={onClearSelection}
              className="rounded border border-subtle bg-base px-2 py-0.5 text-[11px] font-medium text-secondary transition-colors duration-150 ease-out hover:border-strong hover:text-primary active:scale-[0.98]"
            >
              Clear selection
            </button>
          ) : null}
          <span className="text-[11px] tabular-nums text-muted">{commits.length} commits</span>
        </div>
      </div>

      {isLoading && (
        <div className="flex min-h-[160px] items-center gap-2.5 text-secondary">
          <LoadingSpinner variant="panel" />
          <span className="text-sm">Loading commit history…</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-md border border-danger-border bg-danger-bg p-3 text-danger-fg">
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {!isLoading && !errorMessage && commits.length === 0 && (
        <div
          className="rounded-md border border-dashed border-subtle bg-base/50 px-3 py-5 text-center"
          role="status"
        >
          <p className="text-sm font-medium text-secondary">No commits yet</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            This branch has no history yet. Stage and commit with Git (e.g.{" "}
            <span className="font-mono text-muted">git add</span> /{" "}
            <span className="font-mono text-muted">git commit</span>), or switch to a branch that already has commits.
          </p>
        </div>
      )}

      {!isLoading && !errorMessage && commits.length > 0 && (
        <ul ref={listRef} className="max-h-80 space-y-0.5 overflow-auto pr-0.5">
          {commits.map((commit) => {
            const isSelected = selectedCommitHash === commit.hash;
            return (
              <li key={commit.hash}>
                <button
                  data-selected={isSelected ? "true" : "false"}
                  type="button"
                  onClick={() => onSelectCommit(commit)}
                  aria-current={isSelected ? "true" : undefined}
                  className={`w-full rounded-md border py-2 pl-2 pr-2.5 text-left transition-colors duration-150 ease-out ${
                    isSelected
                      ? "border-accent-border border-l-[3px] border-l-accent bg-accent-bg"
                      : "border-subtle border-l-[3px] border-l-transparent bg-elevated hover:border-strong hover:bg-panel"
                  }`}
                  title={commit.hash}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                        isSelected
                          ? "border-accent-border bg-accent-bg text-accent-fg"
                          : "border-subtle text-muted"
                      }`}
                    >
                      {commit.shortHash}
                    </span>
                    <span
                      className={`truncate ${isSelected ? "font-semibold text-primary" : "font-medium text-primary"}`}
                    >
                      {commit.subject}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    <span className="text-muted">{commit.authorName}</span>
                    <span className="text-secondary"> · </span>
                    <span className="tabular-nums text-muted">
                      {new Date(commit.authoredAt).toLocaleString()}
                    </span>
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
