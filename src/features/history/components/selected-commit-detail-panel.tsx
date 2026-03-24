import { useEffect, useState } from "react";

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

  useEffect(() => {
    setIsConfirmOpen(false);
    setRevertError(null);
    setRevertSuccessMessage(null);
  }, [repositoryPath]);

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
        <div
          className="mt-3 rounded border border-dashed border-zinc-700/80 bg-zinc-950/50 px-3 py-6 text-center"
          aria-live="polite"
        >
          <p className="text-xs font-medium text-zinc-400">No commit selected</p>
          <p className="mt-1 text-xs text-zinc-500">
            Choose a row in Commit History to inspect hash, author, parents, and metadata.
          </p>
        </div>
      )}

      {commit && (
        <div className="mt-3 space-y-2.5 text-sm">
          <dl className="space-y-2.5">
            <div className="rounded border border-zinc-800/80 bg-zinc-950/40 px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Short hash
              </dt>
              <dd className="mt-0.5 font-mono text-xs text-zinc-100">{commit.shortHash}</dd>
            </div>
            <div className="rounded border border-zinc-800/80 bg-zinc-950/40 px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Full hash
              </dt>
              <dd className="mt-0.5 break-all font-mono text-[11px] leading-snug text-zinc-200">
                {commit.hash}
              </dd>
            </div>
            <div className="rounded border border-zinc-800/80 bg-zinc-950/40 px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Subject
              </dt>
              <dd className="mt-0.5 text-zinc-100">{commit.subject}</dd>
            </div>
            <div className="rounded border border-zinc-800/80 bg-zinc-950/40 px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Author name
              </dt>
              <dd className="mt-0.5 text-zinc-100">{commit.authorName}</dd>
            </div>
            <div className="rounded border border-zinc-800/80 bg-zinc-950/40 px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Author email
              </dt>
              <dd className="mt-0.5 break-all text-xs text-zinc-200">{commit.authorEmail}</dd>
            </div>
            <div className="rounded border border-zinc-800/80 bg-zinc-950/40 px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Authored date
              </dt>
              <dd className="mt-0.5 text-xs text-zinc-200">
                {new Date(commit.authoredAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </dd>
            </div>
            <div className="rounded border border-zinc-800/80 bg-zinc-950/40 px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Parents ({commit.parentHashes.length})
              </dt>
              <dd className="mt-0.5">
                {commit.parentHashes.length === 0 ? (
                  <p className="text-xs text-zinc-500">None — root commit</p>
                ) : (
                  <ul className="space-y-1">
                    {commit.parentHashes.map((parentHash) => (
                      <li key={parentHash}>
                        <span
                          className="break-all font-mono text-[11px] text-zinc-200"
                          title={parentHash}
                        >
                          {parentHash}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
          </dl>

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
