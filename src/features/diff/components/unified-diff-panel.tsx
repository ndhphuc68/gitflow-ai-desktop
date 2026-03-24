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
  context: "text-zinc-300",
  added: "bg-emerald-950/40 text-emerald-200",
  removed: "bg-rose-950/40 text-rose-200",
};

const SCOPE_BADGE: Record<"staged" | "unstaged", { label: string; className: string }> = {
  staged: {
    label: "Staged",
    className: "border-emerald-600/45 bg-emerald-950/50 text-emerald-200/95",
  },
  unstaged: {
    label: "Unstaged",
    className: "border-amber-600/40 bg-amber-950/35 text-amber-100/90",
  },
};

const CHANGE_BADGE: Record<
  DiffFile["changeType"],
  { label: string; className: string }
> = {
  modified: {
    label: diffChangeTypeLabel("modified"),
    className: "border-sky-600/40 bg-sky-950/40 text-sky-100/95",
  },
  added: {
    label: diffChangeTypeLabel("added"),
    className: "border-emerald-600/40 bg-emerald-950/45 text-emerald-100/95",
  },
  deleted: {
    label: diffChangeTypeLabel("deleted"),
    className: "border-rose-600/40 bg-rose-950/45 text-rose-100/95",
  },
  renamed: {
    label: diffChangeTypeLabel("renamed"),
    className: "border-violet-600/40 bg-violet-950/45 text-violet-100/95",
  },
  binary: {
    label: diffChangeTypeLabel("binary"),
    className: "border-zinc-600/50 bg-zinc-900/80 text-zinc-300",
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
    <div className="border-b border-zinc-800 px-3 py-2">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className="truncate font-mono text-[13px] font-semibold leading-snug text-zinc-100"
            title={activeFile.path}
          >
            {basename}
          </p>
          {parentPath ? (
            <p className="mt-0.5 truncate font-mono text-[11px] leading-snug text-zinc-500" title={activeFile.path}>
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
        <p className="mt-1.5 font-mono text-[11px] leading-snug text-zinc-500">
          <span className="text-zinc-600">Renamed from </span>
          <span className="text-zinc-400">{activeFile.oldPath}</span>
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
    <section className="rounded border border-zinc-800 bg-zinc-900 p-4 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</h3>
      </div>

      {isLoading && <p className="text-zinc-300">Loading diff...</p>}

      {errorMessage && (
        <div className="rounded border border-red-700/50 bg-red-950/40 p-3 text-red-200">
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {!isLoading && !errorMessage && files.length === 0 && <p className="text-zinc-300">{emptyMessage}</p>}

      {!isLoading && !errorMessage && files.length > 0 && activeFile && (
        <div className="space-y-3">
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
                        ? "border-sky-500/75 border-l-2 border-l-sky-400 bg-sky-950/50 font-medium text-sky-50 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.1)]"
                        : "border-zinc-700 border-l-2 border-l-transparent bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800/50 hover:text-zinc-200"
                    }`}
                  >
                    {file.path}
                  </button>
                );
              })}
            </div>
          )}

          <div className="rounded border border-zinc-800 bg-zinc-950">
            <DiffFileHeader activeFile={activeFile} workingTreeScope={workingTreeScope} />

            {!isContentLoading && activeFile.isBinary && (
              <p className="px-3 py-2 text-xs text-zinc-400">Binary file diff is not shown.</p>
            )}

            {isContentLoading && (
              <p className="px-3 py-2 text-xs text-zinc-400">Loading file diff…</p>
            )}

            {!isContentLoading && !activeFile.isBinary && activeFile.hunks.length === 0 && (
              <p className="px-3 py-2 text-xs text-zinc-400">No textual hunks found.</p>
            )}

            {!isContentLoading && !activeFile.isBinary && activeFile.hunks.length > 0 && (
              <div className="max-h-[440px] overflow-auto font-mono text-xs">
                {activeFile.hunks.map((hunk) => (
                  <div key={`${activeFile.path}:${hunk.header}`} className="border-b border-zinc-800/80">
                    <div className="bg-zinc-900 px-3 py-1 text-zinc-400">{hunk.header}</div>
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
