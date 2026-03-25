import { useEffect, useState } from "react";

import { normalizeAppError } from "../../../shared/errors/normalize-app-error";
import { AppError } from "../../../shared/types/app-error";
import { useRevertCommit } from "../hooks/use-revert-commit";
import { Commit } from "../entities/commit";

type SelectedCommitDetailPanelProps = {
  commit: Commit | null;
  repositoryPath: string | null;
  requestedRevertCommitHash?: string | null;
  onRevertRequestHandled?: () => void;
};

export function SelectedCommitDetailPanel({
  commit,
  repositoryPath,
  requestedRevertCommitHash = null,
  onRevertRequestHandled,
}: SelectedCommitDetailPanelProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [revertError, setRevertError] = useState<AppError | null>(null);
  const [revertSuccessMessage, setRevertSuccessMessage] = useState<string | null>(null);
  const revertCommitMutation = useRevertCommit({ repositoryPath });
  const hasSelectedCommit = Boolean(commit);
  const isReverting = revertCommitMutation.isPending;

  useEffect(() => {
    setIsConfirmOpen(false);
    setRevertError(null);
    setRevertSuccessMessage(null);
  }, [repositoryPath]);

  useEffect(() => {
    if (!isConfirmOpen || isReverting) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      setIsConfirmOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isConfirmOpen, isReverting]);

  useEffect(() => {
    if (!requestedRevertCommitHash) {
      return;
    }
    if (!commit || commit.hash !== requestedRevertCommitHash) {
      onRevertRequestHandled?.();
      return;
    }
    if (isReverting) {
      onRevertRequestHandled?.();
      return;
    }
    setRevertError(null);
    setRevertSuccessMessage(null);
    setIsConfirmOpen(true);
    onRevertRequestHandled?.();
  }, [requestedRevertCommitHash, commit, isReverting, onRevertRequestHandled]);

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
    <section className="rounded-md border border-subtle bg-elevated p-4 text-sm">
      <h2 className="ui-section-title">
        Commit Detail
      </h2>

      {!commit && (
        <div
          className="mt-3 rounded border border-dashed border-subtle bg-base/50 px-3 py-6 text-center"
          aria-live="polite"
        >
          <p className="text-sm font-medium text-secondary">No commit selected</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
            Select a row in <span className="text-secondary">Commit History</span> to view hash, author,
            parents, and metadata here.
          </p>
        </div>
      )}

      {commit && (
        <div className="mt-3 space-y-2.5 text-sm">
          <dl className="space-y-2.5">
            <div className="rounded border border-subtle bg-elevated px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Short hash
              </dt>
              <dd className="mt-0.5 font-mono text-xs text-primary">{commit.shortHash}</dd>
            </div>
            <div className="rounded border border-subtle bg-elevated px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Full hash
              </dt>
              <dd className="mt-0.5 break-all font-mono text-[11px] leading-snug text-secondary">
                {commit.hash}
              </dd>
            </div>
            <div className="rounded border border-subtle bg-elevated px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Subject
              </dt>
              <dd className="mt-0.5 font-medium text-primary">{commit.subject}</dd>
            </div>
            <div className="rounded border border-subtle bg-elevated px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Author name
              </dt>
              <dd className="mt-0.5 text-sm text-secondary/90">{commit.authorName}</dd>
            </div>
            <div className="rounded border border-subtle bg-elevated px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Author email
              </dt>
              <dd className="mt-0.5 break-all text-xs text-secondary">{commit.authorEmail}</dd>
            </div>
            <div className="rounded border border-subtle bg-elevated px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Authored date
              </dt>
              <dd className="mt-0.5 text-xs text-secondary">
                {new Date(commit.authoredAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </dd>
            </div>
            <div className="rounded border border-subtle bg-elevated px-2.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Parents ({commit.parentHashes.length})
              </dt>
              <dd className="mt-0.5">
                {commit.parentHashes.length === 0 ? (
                  <p className="text-xs text-muted">None — root commit</p>
                ) : (
                  <ul className="space-y-1">
                    {commit.parentHashes.map((parentHash) => (
                      <li key={parentHash}>
                        <span
                          className="break-all font-mono text-[11px] text-secondary"
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

          <div className="rounded-md border border-danger-border bg-danger-bg p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-danger-fg">
              Advanced Action
            </p>
            <p className="mt-1 text-xs text-danger-fg/90">
              Revert creates a new commit that reverses this selected commit.
            </p>
            <button
              type="button"
              onClick={handleOpenConfirmation}
              disabled={!hasSelectedCommit || isReverting}
              className="mt-3 w-full rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-sm font-medium text-danger-fg transition-colors duration-150 ease-out hover:bg-danger-bg/70 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
            >
              {isReverting ? "Reverting..." : "Revert Commit"}
            </button>
          </div>
        </div>
      )}

      {revertSuccessMessage && (
        <div className="mt-3 rounded-md border border-success-border bg-success-bg p-3 text-xs text-success-fg">
          {revertSuccessMessage}
        </div>
      )}

      {revertError && (
        <div className="mt-3 rounded-md border border-danger-border bg-danger-bg p-3 text-xs text-danger-fg">
          <p className="font-medium">{revertError.message}</p>
          <p className="mt-1 text-danger-fg/90">Code: {revertError.code}</p>
        </div>
      )}

      {isConfirmOpen && commit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="revert-commit-title"
        >
          <div className="w-full max-w-md rounded border border-subtle bg-panel p-4 shadow-xl">
            <h3 id="revert-commit-title" className="text-sm font-semibold text-primary">
              Revert Commit
            </h3>
            <p className="mt-2 text-sm text-secondary">
              This will create a new commit that reverses commit{" "}
              <span className="font-medium text-primary">{commit.shortHash}</span>.
            </p>
            <p className="mt-2 text-xs text-muted">
              Continue only if you want to keep history intact and undo this change safely.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isReverting}
                className="flex-1 rounded border border-subtle bg-elevated px-3 py-2 text-sm font-medium text-primary transition hover:bg-panel disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleConfirmRevert();
                }}
                disabled={isReverting}
                className="flex-1 rounded border border-danger-border bg-danger-bg px-3 py-2 text-sm font-medium text-danger-fg transition hover:bg-danger-bg/70 disabled:cursor-not-allowed disabled:opacity-50"
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
