import { KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

import { LoadingSpinner } from "../../../shared/ui/loading-spinner";
import { AppError } from "../../../shared/types/app-error";
import { RepositoryStatusEntry } from "../../status/entities/repository-status";
import type { WorkingDiffSelection } from "../types/working-diff-selection";
import {
  normalizeWorkingTreeFilePath,
  workingDiffSelectionKey,
} from "../types/working-diff-selection";

type WorkingChangesPanelProps = {
  isLoading: boolean;
  errorMessage: string | null;
  entries: RepositoryStatusEntry[];
  selectedDiff: WorkingDiffSelection | null;
  onSelectDiff: (selection: WorkingDiffSelection) => void;
  onDiscardFile: (filePath: string) => Promise<boolean>;
  isDiscardPending: (filePath: string) => boolean;
  onUnstageFile: (filePath: string) => void;
  isUnstagePending: (filePath: string) => boolean;
  discardError: AppError | null;
  discardSuccessMessage: string | null;
  unstageError: AppError | null;
  onDiscardFlowOpen: () => void;
  requestedDiscardPath?: string | null;
  onDiscardRequestHandled?: () => void;
  isKeyboardFocused?: boolean;
  onActivateKeyboardZone?: () => void;
};

export function WorkingChangesPanel({
  isLoading,
  errorMessage,
  entries,
  selectedDiff,
  onSelectDiff,
  onDiscardFile,
  isDiscardPending,
  onUnstageFile,
  isUnstagePending,
  discardError,
  discardSuccessMessage,
  unstageError,
  onDiscardFlowOpen,
  requestedDiscardPath = null,
  onDiscardRequestHandled,
  isKeyboardFocused = false,
  onActivateKeyboardZone,
}: WorkingChangesPanelProps) {
  const [confirmDiscardPath, setConfirmDiscardPath] = useState<string | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inspectableEntries = entries.filter(
    (entry) => entry.group === "staged" || entry.group === "unstaged"
  );
  const unstagedPaths = entries
    .filter((entry) => entry.group === "unstaged")
    .map((entry) => entry.path);
  const hasDiscardInFlight = unstagedPaths.some((path) => isDiscardPending(path));
  const selectedIndex = useMemo(() => {
    if (!selectedDiff) {
      return -1;
    }
    return inspectableEntries.findIndex(
      (entry) => workingDiffSelectionKey(toSelection(entry)) === workingDiffSelectionKey(selectedDiff)
    );
  }, [inspectableEntries, selectedDiff]);

  function toSelection(entry: RepositoryStatusEntry): WorkingDiffSelection {
    return {
      path: normalizeWorkingTreeFilePath(entry.path),
      scope: entry.group === "staged" ? "staged" : "unstaged",
    };
  }

  useEffect(() => {
    if (!confirmDiscardPath) {
      return;
    }

    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !hasDiscardInFlight) {
        setConfirmDiscardPath(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [confirmDiscardPath, hasDiscardInFlight]);

  useEffect(() => {
    const selectedElement = listRef.current?.querySelector<HTMLElement>('[data-selected="true"]');
    selectedElement?.scrollIntoView({ block: "nearest" });
  }, [selectedDiff]);

  useEffect(() => {
    if (!requestedDiscardPath) {
      return;
    }
    if (hasDiscardInFlight) {
      onDiscardRequestHandled?.();
      return;
    }
    onDiscardFlowOpen();
    setConfirmDiscardPath(requestedDiscardPath);
    onDiscardRequestHandled?.();
  }, [requestedDiscardPath, hasDiscardInFlight, onDiscardFlowOpen, onDiscardRequestHandled]);

  const handlePanelKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (inspectableEntries.length === 0) {
      return;
    }
    if (
      event.key !== "ArrowDown" &&
      event.key !== "ArrowUp" &&
      event.key !== "Home" &&
      event.key !== "End" &&
      event.key !== "Enter" &&
      event.key.toLowerCase() !== "d"
    ) {
      return;
    }

    if (event.key.toLowerCase() === "d") {
      const currentEntry = selectedIndex >= 0 ? inspectableEntries[selectedIndex] : inspectableEntries[0];
      if (currentEntry?.group === "unstaged") {
        event.preventDefault();
        onDiscardFlowOpen();
        setConfirmDiscardPath(currentEntry.path);
      }
      return;
    }

    event.preventDefault();

    if (event.key === "Enter") {
      const currentEntry = selectedIndex >= 0 ? inspectableEntries[selectedIndex] : inspectableEntries[0];
      if (currentEntry) {
        onSelectDiff(toSelection(currentEntry));
      }
      return;
    }

    let nextIndex = selectedIndex >= 0 ? selectedIndex : 0;
    if (event.key === "ArrowDown") {
      nextIndex = Math.min(inspectableEntries.length - 1, nextIndex + 1);
    } else if (event.key === "ArrowUp") {
      nextIndex = Math.max(0, nextIndex - 1);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = inspectableEntries.length - 1;
    }

    const nextEntry = inspectableEntries[nextIndex];
    if (nextEntry) {
      onSelectDiff(toSelection(nextEntry));
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
      <div className="mb-3 flex items-center justify-between">
        <h3 className="ui-section-title">
          Working Changes
        </h3>
      </div>

      {isLoading && (
        <div className="flex min-h-[120px] items-center gap-2.5 text-secondary">
          <LoadingSpinner variant="panel" />
          <span className="text-sm">Loading changed files…</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-md border border-danger-border bg-danger-bg p-3 text-danger-fg">
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {discardSuccessMessage && (
        <div className="mb-3 rounded-md border border-success-border bg-success-bg p-3 text-success-fg">
          <p className="font-medium">{discardSuccessMessage}</p>
        </div>
      )}

      {discardError && (
        <div className="mb-3 rounded-md border border-danger-border bg-danger-bg p-3 text-danger-fg">
          <p className="font-medium">{discardError.message}</p>
          <p className="mt-1 text-xs text-danger-fg/90">Code: {discardError.code}</p>
          {discardError.details ? (
            <p className="mt-1 break-all text-xs text-danger-fg/80">{discardError.details}</p>
          ) : null}
        </div>
      )}

      {unstageError && (
        <div className="mb-3 rounded-md border border-danger-border bg-danger-bg p-3 text-danger-fg">
          <p className="font-medium">{unstageError.message}</p>
          <p className="mt-1 text-xs text-danger-fg/90">Code: {unstageError.code}</p>
          {unstageError.details ? (
            <p className="mt-1 break-all text-xs text-danger-fg/80">{unstageError.details}</p>
          ) : null}
        </div>
      )}

      {!isLoading && !errorMessage && inspectableEntries.length === 0 && (
        <div
          className="rounded-md border border-dashed border-subtle bg-base/50 px-3 py-5 text-center"
          role="status"
        >
          <p className="text-sm font-medium text-secondary">No changes detected</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Modify files in your editor or switch branch — updates appear here when Git sees a diff.
          </p>
        </div>
      )}

      {!isLoading && !errorMessage && inspectableEntries.length > 0 && (
        <ul ref={listRef} className="max-h-48 space-y-0.5 overflow-auto pr-0.5">
          {inspectableEntries.map((entry) => {
            const selection = toSelection(entry);
            const isSelected =
              selectedDiff !== null &&
              workingDiffSelectionKey(selectedDiff) === workingDiffSelectionKey(selection);
            const showDiscard = entry.group === "unstaged";
            const showUnstage = entry.group === "staged";
            return (
              <li
                key={`${entry.group}:${entry.path}:${entry.status}`}
                className="group/row"
                data-selected={isSelected ? "true" : "false"}
              >
                <div
                  className={`flex items-center gap-2 rounded-md border px-1.5 py-1 text-xs transition-colors duration-150 ease-out ${
                    isSelected
                      ? "border-accent-border border-l-[3px] border-l-accent bg-accent-bg text-accent-fg"
                      : "border-subtle border-l-[3px] border-l-transparent bg-elevated text-secondary group-hover/row:border-strong group-hover/row:bg-panel"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectDiff(selection)}
                    className={`min-w-0 flex-1 truncate text-left font-mono text-[11px] transition-colors duration-150 ease-out ${
                      isSelected ? "text-primary" : "text-secondary group-hover/row:text-primary"
                    }`}
                    title={entry.path}
                  >
                    <span
                      className={`mr-2 inline-block rounded border px-1 py-px text-[10px] font-semibold uppercase tracking-wide ${
                        isSelected
                          ? "border-accent-border bg-accent-bg text-accent-fg"
                          : "border-subtle text-muted"
                      }`}
                    >
                      {entry.group === "staged" ? "Staged" : "Unstaged"}
                    </span>
                    {entry.path}
                  </button>
                  <div className="flex min-w-22 shrink-0 justify-end">
                    {showUnstage ? (
                      <button
                        type="button"
                        onClick={() => {
                          onDiscardFlowOpen();
                          onUnstageFile(entry.path);
                        }}
                        disabled={isUnstagePending(entry.path)}
                        className="rounded border border-warning-border bg-warning-bg px-2 py-0.5 text-[11px] font-medium text-warning-fg transition-colors duration-150 ease-out hover:bg-warning-bg/70 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
                        title="Remove file from index (unstage)"
                      >
                        {isUnstagePending(entry.path) ? "Unstaging…" : "Unstage"}
                      </button>
                    ) : null}
                    {showDiscard ? (
                      <button
                        type="button"
                        onClick={() => {
                          onDiscardFlowOpen();
                          setConfirmDiscardPath(entry.path);
                        }}
                        disabled={isDiscardPending(entry.path)}
                        className="rounded-md border border-danger-border bg-danger-bg px-2 py-0.5 text-[11px] font-medium text-danger-fg transition-colors duration-150 ease-out hover:bg-danger-bg/70 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
                        title="Discard local unstaged changes"
                      >
                        {isDiscardPending(entry.path) ? "Discarding..." : "Discard"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {confirmDiscardPath && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="discard-changes-title"
          onClick={() => {
            if (!hasDiscardInFlight) {
              setConfirmDiscardPath(null);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded border border-subtle bg-panel p-4 shadow-xl outline-none"
            role="document"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="discard-changes-title" className="text-sm font-semibold text-primary">
              Discard Changes
            </h3>
            <p className="mt-2 text-sm text-secondary">
              This will permanently discard local changes for:
            </p>
            <p className="mt-2 break-all rounded border border-subtle bg-base px-2 py-1.5 text-xs text-secondary">
              {confirmDiscardPath}
            </p>
            <p className="mt-2 text-xs font-medium text-danger-fg">
              This will permanently discard local changes.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={() => setConfirmDiscardPath(null)}
                disabled={hasDiscardInFlight}
                className="flex-1 rounded border border-subtle bg-elevated px-3 py-2 text-sm font-medium text-primary transition hover:bg-panel disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void onDiscardFile(confirmDiscardPath).then((isSuccess) => {
                    if (isSuccess) {
                      setConfirmDiscardPath(null);
                    }
                  });
                }}
                disabled={hasDiscardInFlight}
                className="flex-1 rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-sm font-medium text-danger-fg transition hover:bg-danger-bg/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {hasDiscardInFlight ? "Discarding..." : "Confirm Discard"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
