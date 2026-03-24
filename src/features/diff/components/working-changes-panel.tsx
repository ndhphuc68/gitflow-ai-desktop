import { useEffect, useRef, useState } from "react";

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
}: WorkingChangesPanelProps) {
  const [confirmDiscardPath, setConfirmDiscardPath] = useState<string | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const inspectableEntries = entries.filter(
    (entry) => entry.group === "staged" || entry.group === "unstaged"
  );
  const unstagedPaths = entries
    .filter((entry) => entry.group === "unstaged")
    .map((entry) => entry.path);
  const hasDiscardInFlight = unstagedPaths.some((path) => isDiscardPending(path));

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

  return (
    <section className="rounded border border-zinc-800 bg-zinc-900 p-4 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Working Changes
        </h3>
      </div>

      {isLoading && <p className="text-zinc-300">Loading changed files...</p>}

      {errorMessage && (
        <div className="rounded border border-red-700/50 bg-red-950/40 p-3 text-red-200">
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {discardSuccessMessage && (
        <div className="mb-3 rounded border border-emerald-700/50 bg-emerald-950/40 p-3 text-emerald-200">
          <p className="font-medium">{discardSuccessMessage}</p>
        </div>
      )}

      {discardError && (
        <div className="mb-3 rounded border border-red-700/50 bg-red-950/40 p-3 text-red-200">
          <p className="font-medium">{discardError.message}</p>
          <p className="mt-1 text-xs text-red-300/90">Code: {discardError.code}</p>
          {discardError.details ? (
            <p className="mt-1 break-all text-xs text-red-300/80">{discardError.details}</p>
          ) : null}
        </div>
      )}

      {unstageError && (
        <div className="mb-3 rounded border border-red-700/50 bg-red-950/40 p-3 text-red-200">
          <p className="font-medium">{unstageError.message}</p>
          <p className="mt-1 text-xs text-red-300/90">Code: {unstageError.code}</p>
          {unstageError.details ? (
            <p className="mt-1 break-all text-xs text-red-300/80">{unstageError.details}</p>
          ) : null}
        </div>
      )}

      {!isLoading && !errorMessage && inspectableEntries.length === 0 && (
        <p className="text-zinc-300">No changed files to inspect.</p>
      )}

      {!isLoading && !errorMessage && inspectableEntries.length > 0 && (
        <ul className="max-h-48 space-y-1 overflow-auto">
          {inspectableEntries.map((entry) => {
            const selection = toSelection(entry);
            const isSelected =
              selectedDiff !== null &&
              workingDiffSelectionKey(selectedDiff) === workingDiffSelectionKey(selection);
            const showDiscard = entry.group === "unstaged";
            const showUnstage = entry.group === "staged";
            return (
              <li key={`${entry.group}:${entry.path}:${entry.status}`}>
                <div
                  className={`flex items-center gap-2 rounded border px-2 py-1.5 text-xs transition ${
                    isSelected
                      ? "border-sky-600/70 bg-sky-950/40 text-sky-100"
                      : "border-zinc-800 bg-zinc-950 text-zinc-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectDiff(selection)}
                    className="min-w-0 flex-1 truncate text-left transition hover:text-zinc-100"
                    title={entry.path}
                  >
                    <span
                      className={`mr-2 inline-block rounded border px-1 py-px text-[10px] font-medium uppercase tracking-wide ${
                        isSelected
                          ? "border-sky-500/50 bg-sky-900/40 text-sky-200/90"
                          : "border-zinc-600/60 text-zinc-400"
                      }`}
                    >
                      {entry.group === "staged" ? "Staged" : "Unstaged"}
                    </span>
                    {entry.path}
                  </button>
                  <div className="flex min-w-[5.5rem] shrink-0 justify-end">
                    {showUnstage ? (
                      <button
                        type="button"
                        onClick={() => {
                          onDiscardFlowOpen();
                          onUnstageFile(entry.path);
                        }}
                        disabled={isUnstagePending(entry.path)}
                        className="rounded border border-amber-700/60 bg-amber-950/35 px-2 py-0.5 text-[11px] font-medium text-amber-100 transition hover:bg-amber-900/45 disabled:cursor-not-allowed disabled:opacity-60"
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
                        className="rounded border border-red-700/70 bg-red-950/40 px-2 py-0.5 text-[11px] font-medium text-red-200 transition hover:bg-red-900/60 disabled:cursor-not-allowed disabled:opacity-60"
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
            className="w-full max-w-md rounded border border-zinc-700 bg-zinc-900 p-4 shadow-xl outline-none"
            role="document"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="discard-changes-title" className="text-sm font-semibold text-zinc-100">
              Discard Changes
            </h3>
            <p className="mt-2 text-sm text-zinc-300">
              This will permanently discard local changes for:
            </p>
            <p className="mt-2 break-all rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200">
              {confirmDiscardPath}
            </p>
            <p className="mt-2 text-xs font-medium text-red-300">
              This will permanently discard local changes.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={() => setConfirmDiscardPath(null)}
                disabled={hasDiscardInFlight}
                className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="flex-1 rounded border border-red-700 bg-red-900/40 px-3 py-2 text-sm font-medium text-red-100 transition hover:bg-red-900/60 disabled:cursor-not-allowed disabled:opacity-50"
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
