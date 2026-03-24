import { useState } from "react";

import { normalizeAppError } from "../../../shared/errors/normalize-app-error";
import { AppError } from "../../../shared/types/app-error";
import { useRevertCommit } from "../hooks/use-revert-commit";
import { Commit } from "../entities/commit";

type SelectedCommitDetailPanelProps = {
  commit: Commit | null;
  repositoryPath: string | null;
};

export function SelectedCommitDetailPanel({
  commit,
  repositoryPath,
}: SelectedCommitDetailPanelProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [revertError, setRevertError] = useState<AppError | null>(null);
  const [revertSuccessMessage, setRevertSuccessMessage] = useState<string | null>(null);
  const revertCommitMutation = useRevertCommit({ repositoryPath });

  const hasSelectedCommit = Boolean(commit);
  const isReverting = revertCommitMutation.isPending;

  const handleOpenConfirmation = () => {
    if (!hasSelectedCommit || isReverting) {
      return;
    }
    setRevertError(null);
    setRevertSuccessMessage(null);
    setIsConfirmOpen(true);
  };

  const handleConfirmRevert = async () => {
    if (!commit || !repositoryPath) {
      return;
    }

    setRevertError(null);

    try {
      const responseMessage = await revertCommitMutation.mutateAsync(commit.hash);
      setRevertSuccessMessage(responseMessage ?? `Reverted commit ${commit.shortHash}.`);
      setIsConfirmOpen(false);
    } catch (error) {
      setRevertError(
        normalizeAppError(error, {
          message: "Failed to revert commit",
        })
      );
    }
  };

  return (
    <section className="rounded border border-zinc-800 bg-zinc-900 p-4 text-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Commit Detail
      </h2>

      {!commit && (
        <p className="mt-3 text-sm text-zinc-500">
          Select a commit from the history list to view details.
        </p>
      )}

      {commit && (
        <div className="mt-3 space-y-3 text-sm">
          <div>
            <p className="text-xs text-zinc-400">Short Hash</p>
            <p className="text-zinc-100">{commit.shortHash}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Full Hash</p>
            <p className="break-all text-zinc-100">{commit.hash}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Subject</p>
            <p className="text-zinc-100">{commit.subject}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Author</p>
            <p className="text-zinc-100">
              {commit.authorName} ({commit.authorEmail})
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Authored Date</p>
            <p className="text-zinc-100">{new Date(commit.authoredAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Parent Hashes ({commit.parentHashes.length})</p>
            {commit.parentHashes.length === 0 ? (
              <p className="text-zinc-500">None (root commit)</p>
            ) : (
              <ul className="space-y-1">
                {commit.parentHashes.map((parentHash) => (
                  <li key={parentHash} className="break-all text-zinc-100">
                    {parentHash}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded border border-red-700/50 bg-red-950/30 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-red-300">
              Advanced Action
            </p>
            <p className="mt-1 text-xs text-red-200/90">
              Revert creates a new commit that reverses this selected commit.
            </p>
            <button
              type="button"
              onClick={handleOpenConfirmation}
              disabled={!hasSelectedCommit || isReverting}
              className="mt-3 w-full rounded border border-red-700 bg-red-900/40 px-3 py-2 text-sm font-medium text-red-100 transition hover:bg-red-900/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isReverting ? "Reverting..." : "Revert Commit"}
            </button>
          </div>
        </div>
      )}

      {revertSuccessMessage && (
        <div className="mt-3 rounded border border-emerald-700/50 bg-emerald-950/40 p-3 text-xs text-emerald-200">
          {revertSuccessMessage}
        </div>
      )}

      {revertError && (
        <div className="mt-3 rounded border border-red-700/50 bg-red-950/40 p-3 text-xs text-red-200">
          <p className="font-medium">{revertError.message}</p>
          <p className="mt-1 text-red-300/90">Code: {revertError.code}</p>
        </div>
      )}

      {isConfirmOpen && commit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="revert-commit-title"
        >
          <div className="w-full max-w-md rounded border border-zinc-700 bg-zinc-900 p-4 shadow-xl">
            <h3 id="revert-commit-title" className="text-sm font-semibold text-zinc-100">
              Revert Commit
            </h3>
            <p className="mt-2 text-sm text-zinc-300">
              This will create a new commit that reverses commit{" "}
              <span className="font-medium text-zinc-100">{commit.shortHash}</span>.
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              Continue only if you want to keep history intact and undo this change safely.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isReverting}
                className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleConfirmRevert();
                }}
                disabled={isReverting}
                className="flex-1 rounded border border-red-700 bg-red-900/40 px-3 py-2 text-sm font-medium text-red-100 transition hover:bg-red-900/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isReverting ? "Reverting..." : "Confirm Revert"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
