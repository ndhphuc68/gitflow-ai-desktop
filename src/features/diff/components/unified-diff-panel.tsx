import { DiffFile, DiffLine } from "../entities/diff";

type UnifiedDiffPanelProps = {
  title: string;
  isLoading: boolean;
  errorMessage: string | null;
  files: DiffFile[];
  selectedFilePath: string | null;
  onSelectFilePath: (filePath: string) => void;
  emptyMessage: string;
};

const LINE_CLASS: Record<DiffLine["type"], string> = {
  context: "text-zinc-300",
  added: "bg-emerald-950/40 text-emerald-200",
  removed: "bg-rose-950/40 text-rose-200",
};

export function UnifiedDiffPanel({
  title,
  isLoading,
  errorMessage,
  files,
  selectedFilePath,
  onSelectFilePath,
  emptyMessage,
}: UnifiedDiffPanelProps) {
  const activeFile =
    files.find((file) => file.path === selectedFilePath) ??
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
                const isSelected = file.path === activeFile.path;
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => onSelectFilePath(file.path)}
                    className={`shrink-0 rounded border px-2 py-1 text-xs transition ${
                      isSelected
                        ? "border-sky-600/70 bg-sky-950/40 text-sky-100"
                        : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    {file.path}
                  </button>
                );
              })}
            </div>
          )}

          <div className="rounded border border-zinc-800 bg-zinc-950">
            <div className="border-b border-zinc-800 px-3 py-2 text-xs text-zinc-400">
              <p>
                {activeFile.path} ({activeFile.changeType})
              </p>
              {activeFile.oldPath && activeFile.oldPath !== activeFile.path && (
                <p>from: {activeFile.oldPath}</p>
              )}
            </div>

            {activeFile.isBinary && (
              <p className="px-3 py-2 text-xs text-zinc-400">Binary file diff is not shown.</p>
            )}

            {!activeFile.isBinary && activeFile.hunks.length === 0 && (
              <p className="px-3 py-2 text-xs text-zinc-400">No textual hunks found.</p>
            )}

            {!activeFile.isBinary && activeFile.hunks.length > 0 && (
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
