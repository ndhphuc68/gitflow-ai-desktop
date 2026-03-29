import { FormEvent, useState } from "react";

import { AppError } from "../../../shared/types/app-error";
import { BranchDto } from "../types/branch-dto";

type BranchPanelProps = {
  branches: BranchDto[];
  isLoading: boolean;
  loadErrorMessage: string | null;
  branchError: AppError | null;
  newBranchName: string;
  isBranchMutating: boolean;
  isCreateBranchPending: boolean;
  canCreateBranch: boolean;
  onNewBranchNameChange: (value: string) => void;
  onCheckoutBranch: (branchName: string) => void;
  onCreateBranch: () => void;
};

export function BranchPanel({
  branches,
  isLoading,
  loadErrorMessage,
  branchError,
  newBranchName,
  isBranchMutating,
  isCreateBranchPending,
  canCreateBranch,
  onNewBranchNameChange,
  onCheckoutBranch,
  onCreateBranch,
}: BranchPanelProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCreateBranch();
  };

  return (
    <section className="mt-5 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
          Branches
        </h2>
        {isLoading && <span className="text-xs text-[var(--color-text-secondary)]">Loading...</span>}
      </div>

      {loadErrorMessage && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/50 bg-[var(--color-danger-soft)] p-2 text-xs text-[var(--color-text)]">
          {loadErrorMessage}
        </div>
      )}

      {branchError && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/50 bg-[var(--color-danger-soft)] p-2 text-xs text-[var(--color-text)]">
          <p className="font-medium">{branchError.message}</p>
          <p className="mt-1 text-[var(--color-text-secondary)]">Code: {branchError.code}</p>
        </div>
      )}

      {!isLoading && !loadErrorMessage && branches.length === 0 && (
        <p className="text-xs text-[var(--color-text-muted)]">No local branches found.</p>
      )}

      {!isLoading && !loadErrorMessage && branches.length > 0 && (
        <ul className="max-h-72 space-y-1 overflow-auto">
          {branches.map((branch) => (
            <li key={branch.name}>
              <button
                type="button"
                disabled={branch.isCurrent || isBranchMutating}
                onClick={() => onCheckoutBranch(branch.name)}
                className={`flex w-full items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-2 text-left text-xs transition ${
                  branch.isCurrent
                  ? "ui-row-selected text-[var(--color-text)]"
                    : "ui-sidebar-item text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-60"
                }`}
                title={branch.isCurrent ? "Current branch" : "Checkout branch"}
              >
                <span className="truncate">{branch.name}</span>
                {branch.isCurrent && (
                  <span className="ml-auto rounded-full border border-[var(--color-branch-current)]/60 bg-[color-mix(in_srgb,var(--color-branch-current)_18%,transparent)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-primary-soft)]">
                    Current
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-[var(--color-divider)] pt-3">
        {!isCreateOpen ? (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="ui-button-secondary w-full px-2.5 py-2 text-xs font-medium"
          >
            New branch
          </button>
        ) : (
          <form className="space-y-2" onSubmit={handleCreateSubmit}>
            <label
              className="block text-xs font-medium text-[var(--color-text-secondary)]"
              htmlFor="create-branch-input"
            >
              Create branch
            </label>
            <div className="flex gap-2">
              <input
                id="create-branch-input"
                type="text"
                value={newBranchName}
                onChange={(event) => onNewBranchNameChange(event.target.value)}
                placeholder="feature/branch-name"
                className="ui-input min-w-0 flex-1 px-2 py-1.5 text-xs"
                autoFocus
              />
              <button
                type="submit"
                disabled={!canCreateBranch}
                className="ui-button-primary px-2.5 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreateBranchPending ? "Creating..." : "Create"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                onNewBranchNameChange("");
              }}
              className="ui-button-ghost px-2 py-1 text-[11px] font-medium"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
