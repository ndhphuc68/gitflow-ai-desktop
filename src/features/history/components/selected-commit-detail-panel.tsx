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
    <section className="text-sm">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
        Commit Inspector
      </h2>

      {!commit && (
        <div
          className="ui-empty-state mt-3 px-3 py-5 text-center"
          aria-live="polite"
        >
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">No commit selected</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Choose a row in Commit History to inspect hash, author, parents, and metadata.
          </p>
        </div>
      )}

      {commit && (
        <div className="mt-3 space-y-2.5 text-sm">
          <dl className="space-y-2.5">
            <div className="ui-card px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Short hash
              </dt>
              <dd className="mt-0.5 font-mono text-xs text-[var(--color-text)]">{commit.shortHash}</dd>
            </div>
            <div className="ui-card px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Full hash
              </dt>
              <dd className="mt-0.5 break-all font-mono text-[11px] leading-snug text-[var(--color-text)]">
                {commit.hash}
              </dd>
            </div>
            <div className="ui-card px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Subject
              </dt>
              <dd className="mt-0.5 text-[var(--color-text)]">{commit.subject}</dd>
            </div>
            <div className="ui-card px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Author name
              </dt>
              <dd className="mt-0.5 text-[var(--color-text)]">{commit.authorName}</dd>
            </div>
            <div className="ui-card px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Author email
              </dt>
              <dd className="mt-0.5 break-all text-xs text-[var(--color-text-secondary)]">{commit.authorEmail}</dd>
            </div>
            <div className="ui-card px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Authored date
              </dt>
              <dd className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                {new Date(commit.authoredAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </dd>
            </div>
            <div className="ui-card px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Parents ({commit.parentHashes.length})
              </dt>
              <dd className="mt-0.5">
                {commit.parentHashes.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)]">None - root commit</p>
                ) : (
                  <ul className="space-y-1">
                    {commit.parentHashes.map((parentHash) => (
                      <li key={parentHash}>
                        <span
                          className="break-all font-mono text-[11px] text-[var(--color-text-secondary)]"
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

          <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/45 bg-[var(--color-danger-soft)] p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-danger)]">
              Advanced Action
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              Revert creates a new commit that reverses this selected commit.
            </p>
            <button
              type="button"
              onClick={handleOpenConfirmation}
              disabled={!hasSelectedCommit || isReverting}
              className="ui-button-danger mt-3 w-full px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isReverting ? "Reverting..." : "Revert Commit"}
            </button>
          </div>
        </div>
      )}

      {revertSuccessMessage && (
        <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-success)]/50 bg-[var(--color-success-soft)] p-3 text-xs text-[var(--color-text)]">
          {revertSuccessMessage}
        </div>
      )}

      {revertError && (
        <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-danger)]/50 bg-[var(--color-danger-soft)] p-3 text-xs text-[var(--color-text)]">
          <p className="font-medium">{revertError.message}</p>
          <p className="mt-1 text-[var(--color-text-secondary)]">Code: {revertError.code}</p>
        </div>
      )}

      {isConfirmOpen && commit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(11,18,32,0.82)] p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="revert-commit-title"
        >
          <div className="ui-modal w-full max-w-md p-4">
            <h3 id="revert-commit-title" className="text-sm font-semibold text-[var(--color-text)]">
              Revert Commit
            </h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              This will create a new commit that reverses commit{" "}
              <span className="font-medium text-[var(--color-text)]">{commit.shortHash}</span>.
            </p>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Continue only if you want to keep history intact and undo this change safely.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isReverting}
                className="ui-button-secondary flex-1 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleConfirmRevert();
                }}
                disabled={isReverting}
                className="ui-button-danger flex-1 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
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

