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
    <section className="rounded border border-zinc-800 bg-zinc-900 p-4 text-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Commit</h3>
        <span
          className={`shrink-0 rounded border px-2 py-0.5 text-[11px] font-medium ${
            stagedCount > 0
              ? "border-emerald-700/50 bg-emerald-950/40 text-emerald-200"
              : "border-zinc-700/80 bg-zinc-950 text-zinc-500"
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
            className="rounded-md border border-zinc-700/80 bg-zinc-950/80 px-3 py-2.5"
            role="status"
          >
            <p className="text-xs font-medium text-zinc-300">Nothing staged yet</p>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
              Stage files in <span className="text-zinc-400">Working Changes</span> (left: staged
              group, or stage from the file list). Then write a message and commit.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-400" htmlFor="commit-message-input">
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
            className="w-full resize-none rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900/90 disabled:text-zinc-600 disabled:placeholder:text-zinc-600"
          />
          {commitMessage.trim().length === 0 && stagedCount > 0 && (
            <p className="text-xs text-zinc-500">Enter a commit message to enable Commit.</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            className={`flex items-start gap-2 text-xs ${
              stagedCount === 0 ? "cursor-not-allowed text-zinc-600" : "cursor-pointer text-zinc-400"
            }`}
          >
            <input
              type="checkbox"
              checked={allowSendStagedDiffToAi}
              onChange={(event) => onAllowSendStagedDiffToAiChange(event.target.checked)}
              disabled={stagedCount === 0 || isGeneratingCommitMessage || isSubmitting}
              className="mt-0.5 rounded border-zinc-600 bg-zinc-950 text-violet-500 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span>
              Allow sending the staged diff to your configured AI provider for this action only.
            </span>
          </label>

          <button
            type="button"
            onClick={onGenerateCommitMessage}
            disabled={!canGenerateAi}
            className="flex w-full items-center justify-center gap-2 rounded border border-violet-700/60 bg-violet-950/40 px-3 py-2 text-xs font-medium text-violet-100 transition hover:bg-violet-900/50 disabled:cursor-not-allowed disabled:opacity-50"
            title="Generate suggestions from staged diff (AI)"
          >
            {isGeneratingCommitMessage ? (
              <>
                <span
                  className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-violet-400 border-t-transparent"
                  aria-hidden
                />
                <span>Generating…</span>
              </>
            ) : (
              <span>Generate Commit Message (AI)</span>
            )}
          </button>

          {showTruncatedDiffNotice && (
            <p className="text-xs text-amber-200/90">
              Staged diff was truncated (line and/or size limit) before sending to AI; review
              suggestions carefully.
            </p>
          )}

          {generateCommitMessageError && (
            <div className="rounded border border-red-700/50 bg-red-950/40 p-3 text-red-200">
              <p className="font-medium">{generateCommitMessageError.message}</p>
              <p className="mt-1 text-xs text-red-300/90">Code: {generateCommitMessageError.code}</p>
              {generateCommitMessageError.details ? (
                <p className="mt-1 break-all text-xs text-red-300/80">
                  {generateCommitMessageError.details}
                </p>
              ) : null}
            </div>
          )}

          {aiSuggestions.length > 0 && (
            <div className="rounded border border-zinc-700 bg-zinc-950 p-2">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                Suggestions (click to use)
              </p>
              <ul className="space-y-1.5">
                {aiSuggestions.map((suggestion, index) => (
                  <li key={`${suggestion.title}:${index}`}>
                    <button
                      type="button"
                      onClick={() => onSelectCommitMessageSuggestion(suggestion)}
                      disabled={isGeneratingCommitMessage || isSubmitting}
                      className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-left text-xs text-zinc-200 transition hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="font-medium text-zinc-100">{suggestion.title}</span>
                      {suggestion.description ? (
                        <span className="mt-0.5 block line-clamp-2 text-zinc-400">
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
          <div className="flex gap-2 rounded border border-emerald-700/50 bg-emerald-950/40 p-3 text-emerald-100">
            <p className="min-w-0 flex-1 text-xs">{commitSuccessMessage}</p>
            <button
              type="button"
              onClick={onDismissCommitSuccess}
              className="shrink-0 rounded border border-emerald-700/60 px-2 py-0.5 text-[11px] font-medium text-emerald-200 transition hover:bg-emerald-900/50"
            >
              Dismiss
            </button>
          </div>
        )}

        {commitError && (
          <div className="rounded border border-red-700/50 bg-red-950/40 p-3 text-red-200">
            <p className="font-medium">{commitError.message}</p>
            <p className="mt-1 text-xs text-red-300/90">Code: {commitError.code}</p>
            {commitError.details ? (
              <p className="mt-1 break-all text-xs text-red-300/80">{commitError.details}</p>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-3">
          <p
            className={`text-[11px] ${
              stagedCount === 0 ? "font-medium text-amber-200/85" : "text-zinc-500"
            }`}
          >
            {commitFooterHint}
          </p>
          <button
            type="submit"
            disabled={!canCreateCommit}
            aria-disabled={!canCreateCommit}
            className={`rounded px-4 py-2 text-sm font-medium transition ${
              canCreateCommit
                ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-300"
                : "border border-zinc-700 bg-zinc-900/80 text-zinc-500 hover:bg-zinc-900/80"
            } disabled:cursor-not-allowed disabled:opacity-100`}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-900"
                  aria-hidden
                />
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
