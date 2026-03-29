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
    <section className="flex h-full min-h-0 flex-col text-sm">
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
          Changes
        </h3>
      </div>

      {isLoading && <p className="text-[var(--color-text-secondary)]">Loading changed files...</p>}

      {errorMessage && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/50 bg-[var(--color-danger-soft)] p-3 text-[var(--color-text)]">
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {discardSuccessMessage && (
        <div className="mb-3 rounded-[var(--radius-md)] border border-[var(--color-success)]/50 bg-[var(--color-success-soft)] p-3 text-[var(--color-text)]">
          <p className="font-medium">{discardSuccessMessage}</p>
        </div>
      )}

      {discardError && (
        <div className="mb-3 rounded-[var(--radius-md)] border border-[var(--color-danger)]/50 bg-[var(--color-danger-soft)] p-3 text-[var(--color-text)]">
          <p className="font-medium">{discardError.message}</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Code: {discardError.code}</p>
          {discardError.details ? (
            <p className="mt-1 break-all text-xs text-[var(--color-text-secondary)]">{discardError.details}</p>
          ) : null}
        </div>
      )}

      {unstageError && (
        <div className="mb-3 rounded-[var(--radius-md)] border border-[var(--color-danger)]/50 bg-[var(--color-danger-soft)] p-3 text-[var(--color-text)]">
          <p className="font-medium">{unstageError.message}</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Code: {unstageError.code}</p>
          {unstageError.details ? (
            <p className="mt-1 break-all text-xs text-[var(--color-text-secondary)]">{unstageError.details}</p>
          ) : null}
        </div>
      )}

      {!isLoading && !errorMessage && inspectableEntries.length === 0 && (
        <p className="text-[var(--color-text-secondary)]">No changed files to inspect.</p>
      )}

      {!isLoading && !errorMessage && inspectableEntries.length > 0 && (
        <ul className="min-h-0 flex-1 space-y-1 overflow-auto pr-1">
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
                  className={`flex items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-2 text-xs transition ${
                    isSelected
                      ? "ui-row-selected"
                      : "ui-table-row text-[var(--color-text)]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectDiff(selection)}
                    className="min-w-0 flex-1 truncate text-left transition hover:text-[var(--color-text)]"
                    title={entry.path}
                  >
                    <span
                      className={`mr-2 inline-block rounded border px-1 py-px text-[10px] font-semibold uppercase tracking-wide ${
                        isSelected
                          ? "border-[var(--color-primary)]/50 bg-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] text-[var(--color-primary-soft)]"
                          : "border-[var(--color-border)]/80 text-[var(--color-text-secondary)]"
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
                        className="rounded-[var(--radius-md)] border border-[var(--color-warning)]/55 bg-[var(--color-warning-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text)] transition hover:border-[var(--color-warning)] hover:bg-[color-mix(in_srgb,var(--color-warning-soft)_80%,transparent)] disabled:cursor-not-allowed disabled:opacity-60"
                        title="Remove file from index (unstage)"
                      >
                        {isUnstagePending(entry.path) ? "Unstaging..." : "Unstage"}
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
                        className="ui-button-danger px-2 py-0.5 text-[11px] font-medium disabled:cursor-not-allowed disabled:opacity-60"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(11,18,32,0.82)] p-4 backdrop-blur-sm"
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
            className="ui-modal w-full max-w-md p-4 outline-none"
            role="document"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="discard-changes-title" className="text-sm font-semibold text-[var(--color-text)]">
              Discard Changes
            </h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              This will permanently discard local changes for:
            </p>
            <p className="ui-card mt-2 break-all px-2 py-1.5 text-xs text-[var(--color-text)]">
              {confirmDiscardPath}
            </p>
            <p className="mt-2 text-xs font-medium text-[var(--color-danger)]">
              This will permanently discard local changes.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={() => setConfirmDiscardPath(null)}
                disabled={hasDiscardInFlight}
                className="ui-button-secondary flex-1 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
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
                className="ui-button-danger flex-1 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
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
