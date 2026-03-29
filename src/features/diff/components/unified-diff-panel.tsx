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
};

const LINE_CLASS: Record<DiffLine["type"], string> = {
  context: "text-[var(--color-text-secondary)]",
  added: "bg-[var(--color-diff-added)] text-[var(--color-diff-added-line)]",
  removed: "bg-[var(--color-diff-removed)] text-[var(--color-diff-removed-line)]",
};

const SCOPE_BADGE: Record<"staged" | "unstaged", { label: string; className: string }> = {
  staged: {
    label: "Staged",
    className: "border-[var(--color-success)]/45 bg-[var(--color-success-soft)] text-[var(--color-text)]",
  },
  unstaged: {
    label: "Unstaged",
    className: "border-[var(--color-warning)]/45 bg-[var(--color-warning-soft)] text-[var(--color-text)]",
  },
};

const CHANGE_BADGE: Record<
  DiffFile["changeType"],
  { label: string; className: string }
> = {
  modified: {
    label: diffChangeTypeLabel("modified"),
    className: "border-[var(--color-diff-modified-line)]/40 bg-[var(--color-diff-modified)] text-[var(--color-text)]",
  },
  added: {
    label: diffChangeTypeLabel("added"),
    className: "border-[var(--color-diff-added-line)]/40 bg-[var(--color-diff-added)] text-[var(--color-text)]",
  },
  deleted: {
    label: diffChangeTypeLabel("deleted"),
    className: "border-[var(--color-diff-removed-line)]/40 bg-[var(--color-diff-removed)] text-[var(--color-text)]",
  },
  renamed: {
    label: diffChangeTypeLabel("renamed"),
    className: "border-[var(--color-accent)]/40 bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)] text-[var(--color-text)]",
  },
  binary: {
    label: diffChangeTypeLabel("binary"),
    className: "border-[var(--color-border)] bg-[rgba(11,18,32,0.82)] text-[var(--color-text-secondary)]",
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
    <div className="border-b border-[var(--color-divider)] px-3 py-2">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className="truncate font-mono text-[13px] font-semibold leading-snug text-[var(--color-text)]"
            title={activeFile.path}
          >
            {basename}
          </p>
          {parentPath ? (
            <p className="mt-0.5 truncate font-mono text-[11px] leading-snug text-[var(--color-text-muted)]" title={activeFile.path}>
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
        <p className="mt-1.5 font-mono text-[11px] leading-snug text-[var(--color-text-muted)]">
          <span className="text-[var(--color-text-muted)]">Renamed from </span>
          <span className="text-[var(--color-text-secondary)]">{activeFile.oldPath}</span>
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
}: UnifiedDiffPanelProps) {
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

  return (
    <section className="flex h-full min-h-0 flex-col text-sm">
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
          {title}
        </h3>
      </div>

      {isLoading && <p className="text-[var(--color-text-secondary)]">Loading diff...</p>}

      {errorMessage && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/50 bg-[var(--color-danger-soft)] p-3 text-[var(--color-text)]">
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {!isLoading && !errorMessage && files.length === 0 && <p className="text-[var(--color-text-secondary)]">{emptyMessage}</p>}

      {!isLoading && !errorMessage && files.length > 0 && activeFile && (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {files.length > 1 && (
            <div className="flex gap-2 overflow-auto pb-1">
              {files.map((file) => {
                const isSelected =
                  normalizedSelected !== null &&
                  normalizeWorkingTreeFilePath(file.path) === normalizedSelected;
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => onSelectFilePath(file.path)}
                    className={`shrink-0 rounded-md border px-2 py-1 text-xs transition-colors ${
                      isSelected
                        ? "ui-row-selected border-l-2 border-l-[var(--color-primary)] font-medium"
                        : "ui-tab border-l-2 border-l-transparent"
                    }`}
                  >
                    {file.path}
                  </button>
                );
              })}
            </div>
          )}

          <div className="ui-card min-h-0 flex-1 overflow-hidden">
            <DiffFileHeader activeFile={activeFile} workingTreeScope={workingTreeScope} />

            {!isContentLoading && activeFile.isBinary && (
              <p className="px-3 py-2 text-xs text-[var(--color-text-secondary)]">Binary file diff is not shown.</p>
            )}

            {isContentLoading && (
              <p className="px-3 py-2 text-xs text-[var(--color-text-secondary)]">Loading file diff...</p>
            )}

            {!isContentLoading && !activeFile.isBinary && activeFile.hunks.length === 0 && (
              <p className="px-3 py-2 text-xs text-[var(--color-text-secondary)]">No textual hunks found.</p>
            )}

            {!isContentLoading && !activeFile.isBinary && activeFile.hunks.length > 0 && (
              <div className="h-full overflow-auto font-mono text-xs">
                {activeFile.hunks.map((hunk) => (
                  <div key={`${activeFile.path}:${hunk.header}`} className="border-b border-[var(--color-divider)]">
                    <div className="bg-[rgba(17,24,39,0.92)] px-3 py-1 text-[var(--color-text-secondary)]">{hunk.header}</div>
                    <div>
                      {hunk.lines.map((line, index) => (
                        <div
                          key={`${hunk.header}:${index}`}
                          className={`whitespace-pre-wrap px-3 py-0.5 ${LINE_CLASS[line.type]}`}
                        >
                          {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
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

