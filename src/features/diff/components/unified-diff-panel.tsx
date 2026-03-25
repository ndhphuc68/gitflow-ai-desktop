import { KeyboardEvent, useEffect, useRef, useState } from "react";

import { LoadingSpinner } from "../../../shared/ui/loading-spinner";
import { DiffFile, DiffLine } from "../entities/diff";
import { diffChangeTypeLabel, splitFilePathForDisplay } from "../lib/diff-display";
import { normalizeWorkingTreeFilePath } from "../types/working-diff-selection";

type UnifiedDiffPanelProps = {
  title: string;
  isLoading: boolean;
  /** True while loading unified diff text for the currently selected file (file list already shown). */
  isContentLoading?: boolean;
  errorMessage: string | null;
  files: DiffFile[];
  selectedFilePath: string | null;
  onSelectFilePath: (filePath: string) => void;
  emptyMessage: string;
  /** When set, shows staged vs unstaged context in the file header (working tree diff only). */
  workingTreeScope?: "staged" | "unstaged";
  isKeyboardFocused?: boolean;
  onActivateKeyboardZone?: () => void;
};

const LINE_CLASS: Record<DiffLine["type"], string> = {
  context: "border-l-2 border-l-transparent bg-base/30 text-muted",
  added: "border-l-2 border-l-success-border bg-success-bg text-success-fg",
  removed: "border-l-2 border-l-danger-border bg-danger-bg text-danger-fg",
};

const SCOPE_BADGE: Record<"staged" | "unstaged", { label: string; className: string }> = {
  staged: {
    label: "Staged",
    className: "border-success-border bg-success-bg text-success-fg",
  },
  unstaged: {
    label: "Unstaged",
    className: "border-warning-border bg-warning-bg text-warning-fg",
  },
};

const CHANGE_BADGE: Record<
  DiffFile["changeType"],
  { label: string; className: string }
> = {
  modified: {
    label: diffChangeTypeLabel("modified"),
    className: "border-accent-border bg-accent-bg text-accent-fg",
  },
  added: {
    label: diffChangeTypeLabel("added"),
    className: "border-success-border bg-success-bg text-success-fg",
  },
  deleted: {
    label: diffChangeTypeLabel("deleted"),
    className: "border-danger-border bg-danger-bg text-danger-fg",
  },
  renamed: {
    label: diffChangeTypeLabel("renamed"),
    className: "border-subtle bg-elevated text-secondary",
  },
  binary: {
    label: diffChangeTypeLabel("binary"),
    className: "border-subtle bg-elevated text-secondary",
  },
};

function DiffFileHeader({
  activeFile,
  workingTreeScope,
}: {
  activeFile: DiffFile;
  workingTreeScope?: "staged" | "unstaged";
}) {
  const { basename, parentPath } = splitFilePathForDisplay(activeFile.path);
  const changeBadge = CHANGE_BADGE[activeFile.changeType];

  return (
    <div className="border-b border-subtle bg-elevated px-3 py-2">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className="truncate font-mono text-[13px] font-semibold leading-snug text-primary"
            title={activeFile.path}
          >
            {basename}
          </p>
          {parentPath ? (
            <p
              className="mt-0.5 truncate font-mono text-[11px] leading-snug text-muted"
              title={activeFile.path}
            >
              {parentPath}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          <span
            className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${changeBadge.className}`}
          >
            {changeBadge.label}
          </span>
          {workingTreeScope ? (
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SCOPE_BADGE[workingTreeScope].className}`}
            >
              {SCOPE_BADGE[workingTreeScope].label}
            </span>
          ) : null}
        </div>
      </div>
      {activeFile.oldPath && activeFile.oldPath !== activeFile.path ? (
        <p className="mt-1.5 font-mono text-[11px] leading-snug text-muted">
          <span className="text-secondary">Renamed from </span>
          <span className="text-muted">{activeFile.oldPath}</span>
        </p>
      ) : null}
    </div>
  );
}

export function UnifiedDiffPanel({
  title,
  isLoading,
  isContentLoading = false,
  errorMessage,
  files,
  selectedFilePath,
  onSelectFilePath,
  emptyMessage,
  workingTreeScope,
  isKeyboardFocused = false,
  onActivateKeyboardZone,
}: UnifiedDiffPanelProps) {
  const [activeHunkIndex, setActiveHunkIndex] = useState(0);
  const diffScrollRef = useRef<HTMLDivElement>(null);
  const normalizedSelected =
    selectedFilePath !== null && selectedFilePath.length > 0
      ? normalizeWorkingTreeFilePath(selectedFilePath)
      : null;
  const activeFile =
    files.find(
      (file) => normalizeWorkingTreeFilePath(file.path) === normalizedSelected
    ) ??
    files[0] ??
    null;
  const activeHunks = activeFile?.hunks ?? [];

  useEffect(() => {
    setActiveHunkIndex(0);
  }, [activeFile?.path, activeHunks.length]);

  useEffect(() => {
    if (!isKeyboardFocused || activeHunks.length === 0) {
      return;
    }
    const activeHunkElement = diffScrollRef.current?.querySelector<HTMLElement>(
      `[data-hunk-index="${activeHunkIndex}"]`
    );
    activeHunkElement?.scrollIntoView({ block: "nearest" });
  }, [isKeyboardFocused, activeHunkIndex, activeHunks.length]);

  const handlePanelKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "PageDown" || event.key === "PageUp") {
      if (!diffScrollRef.current) {
        return;
      }
      event.preventDefault();
      const scrollDelta = Math.floor(diffScrollRef.current.clientHeight * 0.9);
      diffScrollRef.current.scrollBy({
        top: event.key === "PageDown" ? scrollDelta : -scrollDelta,
        behavior: "auto",
      });
      return;
    }

    if (event.key.toLowerCase() !== "j" && event.key.toLowerCase() !== "k") {
      return;
    }
    if (activeHunks.length === 0) {
      return;
    }

    event.preventDefault();
    setActiveHunkIndex((current) => {
      if (event.key.toLowerCase() === "j") {
        return Math.min(activeHunks.length - 1, current + 1);
      }
      return Math.max(0, current - 1);
    });
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
        <h3 className="ui-section-title">{title}</h3>
      </div>

      {isLoading && (
        <div className="flex min-h-[200px] items-center gap-2.5 text-secondary">
          <LoadingSpinner variant="panel" />
          <span className="text-sm">Loading diff…</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-md border border-danger-border bg-danger-bg p-3 text-danger-fg">
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {!isLoading && !errorMessage && files.length === 0 && (
        <div
          className="rounded-md border border-dashed border-subtle bg-base/50 px-3 py-5 text-center text-muted"
          role="status"
        >
          <p className="text-sm font-medium text-secondary">{emptyMessage}</p>
        </div>
      )}

      {!isLoading && !errorMessage && files.length > 0 && activeFile && (
        <div className="space-y-3">
          {files.length > 1 && (
            <div className="flex gap-1.5 overflow-auto pb-1 pr-0.5">
              {files.map((file) => {
                const isSelected =
                  normalizedSelected !== null &&
                  normalizeWorkingTreeFilePath(file.path) === normalizedSelected;
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => onSelectFilePath(file.path)}
                    className={`shrink-0 rounded-md border px-2 py-1 font-mono text-[11px] transition-colors duration-150 ease-out ${
                      isSelected
                        ? "border-accent-border border-b-2 border-b-accent bg-accent-bg font-semibold text-primary"
                        : "border-subtle border-b-2 border-b-transparent bg-elevated text-muted hover:border-strong hover:bg-panel hover:text-primary"
                    }`}
                  >
                    {file.path}
                  </button>
                );
              })}
            </div>
          )}

          <div className="rounded-md border border-subtle bg-elevated">
            <DiffFileHeader activeFile={activeFile} workingTreeScope={workingTreeScope} />

            {!isContentLoading && activeFile.isBinary && (
              <p className="px-3 py-2 text-xs text-muted">Binary file diff is not shown.</p>
            )}

            {isContentLoading && (
              <div className="flex min-h-[220px] items-center gap-2 px-3 py-4 text-xs text-muted">
                <LoadingSpinner variant="diffContent" />
                <span>Loading file diff…</span>
              </div>
            )}

            {!isContentLoading && !activeFile.isBinary && activeFile.hunks.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted">No textual hunks found.</p>
            )}

            {!isContentLoading && !activeFile.isBinary && activeFile.hunks.length > 0 && (
              <div
                ref={diffScrollRef}
                className="max-h-[440px] overflow-auto font-mono text-[12px] leading-relaxed"
              >
                {activeFile.hunks.map((hunk, hunkIndex) => (
                  <div
                    data-hunk-index={hunkIndex}
                    key={`${activeFile.path}:${hunkIndex}:${hunk.header}`}
                    className={`border-b border-subtle/70 bg-base/30 ${
                      isKeyboardFocused && hunkIndex === activeHunkIndex
                        ? "ring-1 ring-inset ring-accent/40"
                        : ""
                    }`}
                  >
                    <div className="sticky top-0 z-1 border-b border-subtle/70 bg-elevated px-3 py-1.5 font-mono text-[11px] text-muted">
                      {hunk.header}
                    </div>
                    <div className="py-0.5">
                      {hunk.lines.map((line, index) => (
                        <div
                          key={`${hunk.header}:${index}`}
                          className={`whitespace-pre-wrap px-3 py-px ${LINE_CLASS[line.type]}`}
                        >
                          <span className="inline-block w-[10px] select-none text-muted">
                            {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                          </span>
                          {line.content}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
