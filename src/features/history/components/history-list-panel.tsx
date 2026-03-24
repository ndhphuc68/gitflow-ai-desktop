import { Commit } from "../entities/commit";

type HistoryListPanelProps = {
  isLoading: boolean;
  errorMessage: string | null;
  commits: Commit[];
  selectedCommitHash: string | null;
  onSelectCommit: (commit: Commit) => void;
};

export function HistoryListPanel({
  isLoading,
  errorMessage,
  commits,
  selectedCommitHash,
  onSelectCommit,
}: HistoryListPanelProps) {
  return (
    <section className="rounded border border-zinc-800 bg-zinc-900 p-4 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Commit History
        </h3>
        <span className="text-xs text-zinc-500">{commits.length} commits</span>
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
                  className={`w-full rounded border px-3 py-2 text-left transition ${
                    isSelected
                      ? "border-sky-600/70 bg-sky-950/40"
                      : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                  }`}
                  title={commit.hash}
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-300">
                      {commit.shortHash}
                    </span>
                    <span className="truncate text-zinc-100">{commit.subject}</span>
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
