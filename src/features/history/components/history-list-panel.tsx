import { Commit } from "../entities/commit";

type HistoryListPanelProps = {
  isLoading: boolean;
  errorMessage: string | null;
  commits: Commit[];
  selectedCommitHash: string | null;
  onSelectCommit: (commit: Commit) => void;
  onClearSelection?: () => void;
};

export function HistoryListPanel({
  isLoading,
  errorMessage,
  commits,
  selectedCommitHash,
  onSelectCommit,
  onClearSelection,
}: HistoryListPanelProps) {
  return (
    <section className="rounded border border-zinc-800 bg-zinc-900 p-4 text-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Commit History
        </h3>
        <div className="flex items-center gap-2">
          {selectedCommitHash && onClearSelection ? (
            <button
              type="button"
              onClick={onClearSelection}
              className="rounded border border-zinc-600 bg-zinc-950 px-2 py-0.5 text-[11px] font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
            >
              Clear selection
            </button>
          ) : null}
          <span className="text-xs text-zinc-500">{commits.length} commits</span>
        </div>
      </div>

      {isLoading && <p className="text-zinc-300">Loading commit history...</p>}

      {errorMessage && (
        <div className="rounded border border-red-700/50 bg-red-950/40 p-3 text-red-200">
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {!isLoading && !errorMessage && commits.length === 0 && (
        <p className="text-zinc-300">No commits found for this branch.</p>
      )}

      {!isLoading && !errorMessage && commits.length > 0 && (
        <ul className="max-h-80 space-y-1 overflow-auto">
          {commits.map((commit) => {
            const isSelected = selectedCommitHash === commit.hash;
            return (
              <li key={commit.hash}>
                <button
                  type="button"
                  onClick={() => onSelectCommit(commit)}
                  aria-current={isSelected ? "true" : undefined}
                  className={`w-full rounded border py-2 pr-3 text-left transition ${
                    isSelected
                      ? "border-sky-500/80 border-l-4 border-l-sky-500 bg-sky-950/55 pl-2 ring-2 ring-sky-500/35 ring-offset-2 ring-offset-zinc-900"
                      : "border-zinc-800 bg-zinc-950 pl-3 hover:border-zinc-600"
                  }`}
                  title={commit.hash}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                        isSelected
                          ? "border-sky-600/60 bg-sky-950/80 text-sky-200"
                          : "border-zinc-700 text-zinc-300"
                      }`}
                    >
                      {commit.shortHash}
                    </span>
                    <span
                      className={`truncate ${isSelected ? "font-medium text-sky-50" : "text-zinc-100"}`}
                    >
                      {commit.subject}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    {commit.authorName} • {new Date(commit.authoredAt).toLocaleString()}
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
