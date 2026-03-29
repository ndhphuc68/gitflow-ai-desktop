import { FormEvent } from "react";

import { AppError } from "../../../shared/types/app-error";
import { CommitMessageSuggestionDto } from "../types/generate-commit-message-dto";

type CommitPanelProps = {
  stagedCount: number;
  commitMessage: string;
  commitError: AppError | null;
  commitSuccessMessage: string | null;
  commitFooterHint: string;
  isSubmitting: boolean;
  canCreateCommit: boolean;
  onCommitMessageChange: (value: string) => void;
  onDismissCommitSuccess: () => void;
  onSubmit: () => void;
  aiSuggestions: CommitMessageSuggestionDto[];
  isGeneratingCommitMessage: boolean;
  generateCommitMessageError: AppError | null;
  showTruncatedDiffNotice: boolean;
  allowSendStagedDiffToAi: boolean;
  onAllowSendStagedDiffToAiChange: (allowed: boolean) => void;
  onGenerateCommitMessage: () => void;
  onSelectCommitMessageSuggestion: (suggestion: CommitMessageSuggestionDto) => void;
};

export function CommitPanel({
  stagedCount,
  commitMessage,
  commitError,
  commitSuccessMessage,
  commitFooterHint,
  isSubmitting,
  canCreateCommit,
  onCommitMessageChange,
  onDismissCommitSuccess,
  onSubmit,
  aiSuggestions,
  isGeneratingCommitMessage,
  generateCommitMessageError,
  showTruncatedDiffNotice,
  allowSendStagedDiffToAi,
  onAllowSendStagedDiffToAiChange,
  onGenerateCommitMessage,
  onSelectCommitMessageSuggestion,
}: CommitPanelProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const canGenerateAi =
    stagedCount > 0 && allowSendStagedDiffToAi && !isGeneratingCommitMessage && !isSubmitting;

  const isCommitMessageInputDisabled = isSubmitting || stagedCount === 0;

  const stagedLabel =
    stagedCount === 0
      ? "No files staged"
      : stagedCount === 1
        ? "1 file staged"
        : `${stagedCount} files staged`;

  return (
    <section className="text-sm">
      <form className="space-y-3" onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex min-w-[120px] items-center gap-2 pt-1">
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                stagedCount > 0
                  ? "border-[var(--color-success)]/50 bg-[var(--color-success-soft)] text-[var(--color-text)]"
                  : "border-[var(--color-border)] bg-[rgba(11,18,32,0.82)] text-[var(--color-text-muted)]"
              }`}
              title={stagedLabel}
            >
              {stagedLabel}
            </span>
          </div>

          <div className="min-w-[260px] flex-1">
            <label className="sr-only" htmlFor="commit-message-input">
              Commit message
            </label>
            <textarea
              id="commit-message-input"
              value={commitMessage}
              onChange={(event) => onCommitMessageChange(event.target.value)}
              placeholder={
                stagedCount === 0
                  ? "Stage files first, then write a commit message"
                  : "Write a commit message"
              }
              rows={2}
              disabled={isCommitMessageInputDisabled}
              aria-invalid={commitMessage.trim().length === 0 && stagedCount > 0}
              className="ui-input min-h-[74px] w-full resize-none px-3 py-2 text-sm disabled:cursor-not-allowed disabled:border-[var(--color-divider)] disabled:bg-[rgba(17,24,39,0.9)] disabled:text-[var(--color-text-muted)] disabled:placeholder:text-[var(--color-text-muted)]"
            />
          </div>

          <div className="flex min-w-[220px] flex-col gap-2">
            <button
              type="submit"
              disabled={!canCreateCommit}
              aria-disabled={!canCreateCommit}
              className={`rounded px-4 py-2 text-sm font-medium transition ${
                canCreateCommit
                  ? "ui-button-primary"
                  : "ui-button-secondary border-[var(--color-divider)] bg-[rgba(17,24,39,0.7)] text-[var(--color-text-muted)] hover:bg-[rgba(17,24,39,0.7)]"
              } disabled:cursor-not-allowed disabled:opacity-100`}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--color-surface-4)] border-t-[var(--color-bg)]"
                    aria-hidden
                  />
                  Committing...
                </span>
              ) : (
                "Commit"
              )}
            </button>
            <button
              type="button"
              onClick={onGenerateCommitMessage}
              disabled={!canGenerateAi}
              className="ui-button-secondary px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
              title="Generate suggestions from staged diff (AI)"
            >
              {isGeneratingCommitMessage ? "Generating..." : "Generate Message (AI)"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <label
              className={`flex items-start gap-2 text-xs ${
                stagedCount === 0
                  ? "cursor-not-allowed text-[var(--color-text-muted)]"
                  : "cursor-pointer text-[var(--color-text-secondary)]"
              }`}
            >
              <input
                type="checkbox"
                checked={allowSendStagedDiffToAi}
                onChange={(event) => onAllowSendStagedDiffToAiChange(event.target.checked)}
                disabled={stagedCount === 0 || isGeneratingCommitMessage || isSubmitting}
                className="mt-0.5 rounded border-[var(--color-border)] bg-[rgba(11,18,32,0.88)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              />
              <span>Allow sending staged diff to AI for this action.</span>
            </label>
            <p
              className={`text-[11px] ${
                stagedCount === 0
                  ? "font-medium text-[var(--color-warning)]"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              {commitFooterHint}
            </p>
          </div>

          {commitSuccessMessage && (
            <div className="flex gap-2 rounded-[var(--radius-md)] border border-[var(--color-success)]/50 bg-[var(--color-success-soft)] p-2.5 text-[var(--color-text)]">
              <p className="min-w-0 flex-1 text-xs">{commitSuccessMessage}</p>
              <button
                type="button"
                onClick={onDismissCommitSuccess}
                className="ui-button-ghost shrink-0 px-2 py-0.5 text-[11px] font-medium"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {showTruncatedDiffNotice && (
          <p className="text-xs text-[var(--color-warning)]">
            Staged diff was truncated before sending to AI. Review suggestions carefully.
          </p>
        )}

        {generateCommitMessageError && (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/50 bg-[var(--color-danger-soft)] p-3 text-[var(--color-text)]">
            <p className="font-medium">{generateCommitMessageError.message}</p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Code: {generateCommitMessageError.code}</p>
            {generateCommitMessageError.details ? (
              <p className="mt-1 break-all text-xs text-[var(--color-text-secondary)]">
                {generateCommitMessageError.details}
              </p>
            ) : null}
          </div>
        )}

        {commitError && (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/50 bg-[var(--color-danger-soft)] p-3 text-[var(--color-text)]">
            <p className="font-medium">{commitError.message}</p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Code: {commitError.code}</p>
            {commitError.details ? (
              <p className="mt-1 break-all text-xs text-[var(--color-text-secondary)]">{commitError.details}</p>
            ) : null}
          </div>
        )}

        {aiSuggestions.length > 0 && (
          <div className="ui-card p-2.5">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              Suggestions
            </p>
            <ul className="space-y-1.5">
              {aiSuggestions.map((suggestion, index) => (
                <li key={`${suggestion.title}:${index}`}>
                  <button
                    type="button"
                    onClick={() => onSelectCommitMessageSuggestion(suggestion)}
                    disabled={isGeneratingCommitMessage || isSubmitting}
                    className="ui-table-row w-full px-2.5 py-2 text-left text-xs text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="font-medium text-[var(--color-text)]">{suggestion.title}</span>
                    {suggestion.description ? (
                      <span className="mt-0.5 block line-clamp-2 text-[var(--color-text-secondary)]">
                        {suggestion.description}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </section>
  );
}
