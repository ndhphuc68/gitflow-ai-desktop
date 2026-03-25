import { FormEvent } from "react";

import { LoadingSpinner } from "../../../shared/ui/loading-spinner";
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
  isKeyboardFocused?: boolean;
  onActivateKeyboardZone?: () => void;
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
  isKeyboardFocused = false,
  onActivateKeyboardZone,
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
    <section
      tabIndex={0}
      onFocus={onActivateKeyboardZone}
      onMouseDownCapture={onActivateKeyboardZone}
      className={`rounded-md border bg-panel p-4 text-sm outline-none ${
        isKeyboardFocused ? "border-accent-border ring-1 ring-accent/35" : "border-subtle"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="ui-section-title">Commit</h3>
        <span
          className={`shrink-0 rounded border px-2 py-0.5 text-[11px] font-medium ${
            stagedCount > 0
              ? "border-success-border bg-success-bg text-success-fg"
              : "border-subtle bg-elevated text-muted"
          }`}
          title={stagedLabel}
        >
          {stagedLabel}
        </span>
      </div>

      <form
        className="space-y-3"
        onSubmit={handleSubmit}
        aria-busy={isSubmitting}
      >
        {stagedCount === 0 && (
          <div
            className="rounded-md border border-dashed border-subtle bg-base/50 px-3 py-3"
            role="status"
          >
            <p className="text-sm font-medium text-secondary">Nothing staged for commit</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
              Stage with Git or another tool (e.g.{" "}
              <span className="font-mono text-muted">git add</span>
              ); staged paths show under <span className="text-muted">Staged</span> in Working Changes.
              Commit stays disabled until something is staged.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-secondary" htmlFor="commit-message-input">
            Commit message
          </label>
          <textarea
            id="commit-message-input"
            value={commitMessage}
            onChange={(event) => onCommitMessageChange(event.target.value)}
            placeholder={
              stagedCount === 0
                ? "Stage files first — then describe your commit here"
                : "Describe your changes"
            }
            rows={3}
            disabled={isCommitMessageInputDisabled}
            aria-invalid={commitMessage.trim().length === 0 && stagedCount > 0}
            className="w-full resize-none rounded-md border border-subtle bg-base px-3 py-2 font-mono text-sm text-primary outline-none transition-colors duration-150 ease-out focus:border-accent disabled:cursor-not-allowed disabled:border-subtle disabled:bg-panel disabled:text-disabled disabled:placeholder:text-disabled"
          />
          {commitMessage.trim().length === 0 && stagedCount > 0 && (
            <p className="text-xs text-muted">Enter a commit message to enable Commit.</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            className={`flex items-start gap-2 text-xs ${
              stagedCount === 0 ? "cursor-not-allowed text-disabled" : "cursor-pointer text-secondary"
            }`}
          >
            <input
              type="checkbox"
              checked={allowSendStagedDiffToAi}
              onChange={(event) => onAllowSendStagedDiffToAiChange(event.target.checked)}
              disabled={stagedCount === 0 || isGeneratingCommitMessage || isSubmitting}
              className="mt-0.5 rounded border-subtle bg-base text-ai focus:ring-ai disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span>
              Allow sending the staged diff to your configured AI provider for this action only.
            </span>
          </label>

          <button
            type="button"
            onClick={onGenerateCommitMessage}
            disabled={!canGenerateAi}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-ai-border bg-ai-bg px-3 py-2 text-xs font-medium text-ai-fg transition-colors duration-150 ease-out hover:bg-ai-bg/70 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
            title="Generate suggestions from staged diff (AI)"
          >
            {isGeneratingCommitMessage ? (
              <>
                <LoadingSpinner variant="violet" />
                <span>Generating…</span>
              </>
            ) : (
              <span>Generate Commit Message (AI)</span>
            )}
          </button>

          {showTruncatedDiffNotice && (
            <p className="text-xs text-warning-fg/90">
              Staged diff was truncated (line and/or size limit) before sending to AI; review
              suggestions carefully.
            </p>
          )}

          {generateCommitMessageError && (
            <div className="rounded-md border border-danger-border bg-danger-bg p-3 text-danger-fg">
              <p className="font-medium">{generateCommitMessageError.message}</p>
              <p className="mt-1 text-xs text-danger-fg/90">
                Code: {generateCommitMessageError.code}
              </p>
              {generateCommitMessageError.details ? (
                <p className="mt-1 break-all text-xs text-danger-fg/80">
                  {generateCommitMessageError.details}
                </p>
              ) : null}
            </div>
          )}

          {aiSuggestions.length > 0 && (
            <div className="rounded-md border border-subtle bg-base p-2">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted">
                Suggestions (click to use)
              </p>
              <ul className="space-y-1.5">
                {aiSuggestions.map((suggestion, index) => (
                  <li key={`${suggestion.title}:${index}`}>
                    <button
                      type="button"
                      onClick={() => onSelectCommitMessageSuggestion(suggestion)}
                      disabled={isGeneratingCommitMessage || isSubmitting}
                      className="w-full rounded-md border border-subtle bg-elevated px-2 py-1.5 text-left text-xs text-secondary transition-colors duration-150 ease-out hover:border-strong hover:bg-panel hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="font-medium text-primary">{suggestion.title}</span>
                      {suggestion.description ? (
                        <span className="mt-0.5 block line-clamp-2 text-muted">
                          {suggestion.description}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {commitSuccessMessage && (
            <div className="flex gap-2 rounded-md border border-success-border bg-success-bg p-3 text-success-fg">
            <p className="min-w-0 flex-1 text-xs">{commitSuccessMessage}</p>
            <button
              type="button"
              onClick={onDismissCommitSuccess}
                className="shrink-0 rounded border border-success-border px-2 py-0.5 text-[11px] font-medium text-success-fg transition hover:bg-success-bg/70"
            >
              Dismiss
            </button>
          </div>
        )}

        {commitError && (
            <div className="rounded-md border border-danger-border bg-danger-bg p-3 text-danger-fg">
            <p className="font-medium">{commitError.message}</p>
              <p className="mt-1 text-xs text-danger-fg/90">Code: {commitError.code}</p>
            {commitError.details ? (
                <p className="mt-1 break-all text-xs text-danger-fg/80">{commitError.details}</p>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-subtle pt-3">
          <p
            className={`text-[11px] ${
              stagedCount === 0 ? "font-medium text-warning-fg/85" : "text-muted"
            }`}
          >
            {commitFooterHint}
          </p>
          <button
            type="submit"
            disabled={!canCreateCommit}
            aria-disabled={!canCreateCommit}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150 ease-out ${
              canCreateCommit
                ? "bg-action-primary text-action-primary-fg hover:bg-action-primary active:scale-[0.98]"
                : "border border-subtle bg-panel text-muted"
            } disabled:cursor-not-allowed disabled:opacity-100 disabled:active:scale-100`}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <LoadingSpinner variant="commit" />
                Committing…
              </span>
            ) : (
              "Commit"
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
