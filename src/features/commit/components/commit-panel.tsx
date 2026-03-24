import { FormEvent } from "react";

import { AppError } from "../../../shared/types/app-error";

type CommitPanelProps = {
  stagedCount: number;
  commitMessage: string;
  commitError: AppError | null;
  isSubmitting: boolean;
  canCreateCommit: boolean;
  onCommitMessageChange: (value: string) => void;
  onSubmit: () => void;
};

export function CommitPanel({
  stagedCount,
  commitMessage,
  commitError,
  isSubmitting,
  canCreateCommit,
  onCommitMessageChange,
  onSubmit,
}: CommitPanelProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <section className="rounded border border-zinc-800 bg-zinc-900 p-4 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Commit</h3>
        <span className="text-xs text-zinc-500">
          {stagedCount > 0 ? `${stagedCount} staged` : "No staged files"}
        </span>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-400" htmlFor="commit-message-input">
            Commit message
          </label>
          <textarea
            id="commit-message-input"
            value={commitMessage}
            onChange={(event) => onCommitMessageChange(event.target.value)}
            placeholder="Describe your changes"
            rows={3}
            className="w-full resize-none rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
          />
          {commitMessage.trim().length === 0 && (
            <p className="text-xs text-zinc-500">Commit message cannot be empty.</p>
          )}
        </div>

        {commitError && (
          <div className="rounded border border-red-700/50 bg-red-950/40 p-3 text-red-200">
            <p className="font-medium">{commitError.message}</p>
            <p className="mt-1 text-xs text-red-300/90">Code: {commitError.code}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!canCreateCommit}
            className="rounded bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Committing..." : "Commit"}
          </button>
        </div>
      </form>
    </section>
  );
}
