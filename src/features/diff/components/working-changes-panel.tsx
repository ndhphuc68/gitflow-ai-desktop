import { RepositoryStatusEntry } from "../../status/entities/repository-status";

type WorkingChangesPanelProps = {
  isLoading: boolean;
  errorMessage: string | null;
  entries: RepositoryStatusEntry[];
  selectedFilePath: string | null;
  onSelectFilePath: (filePath: string) => void;
};

export function WorkingChangesPanel({
  isLoading,
  errorMessage,
  entries,
  selectedFilePath,
  onSelectFilePath,
}: WorkingChangesPanelProps) {
  const selectableEntries = entries.filter((entry) => entry.group === "unstaged");

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

      {!isLoading && !errorMessage && selectableEntries.length === 0 && (
        <p className="text-zinc-300">No changed files to inspect.</p>
      )}

      {!isLoading && !errorMessage && selectableEntries.length > 0 && (
        <ul className="max-h-48 space-y-1 overflow-auto">
          {selectableEntries.map((entry) => {
            const isSelected = selectedFilePath === entry.path;
            return (
              <li key={`${entry.path}:${entry.status}:${entry.staged ? "1" : "0"}`}>
                <button
                  type="button"
                  onClick={() => onSelectFilePath(entry.path)}
                  className={`w-full rounded border px-2 py-1.5 text-left text-xs transition ${
                    isSelected
                      ? "border-sky-600/70 bg-sky-950/40 text-sky-100"
                      : "border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-zinc-600 hover:text-zinc-100"
                  }`}
                  title={entry.path}
                >
                  <span className="truncate">{entry.path}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
