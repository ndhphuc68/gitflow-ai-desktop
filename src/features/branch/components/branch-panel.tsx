import { FormEvent } from "react";

import { LoadingSpinner } from "../../../shared/ui/loading-spinner";
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
  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCreateBranch();
  };

  return (
    <section className="mt-4 space-y-3 rounded-md border border-subtle bg-panel p-3 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="ui-section-title">Branches</h2>
        {isLoading && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <LoadingSpinner variant="branch" />
            Loading…
          </span>
        )}
      </div>

      {loadErrorMessage && (
        <div className="rounded-md border border-danger-border bg-danger-bg p-2 text-xs text-danger-fg">
          {loadErrorMessage}
        </div>
      )}

      {branchError && (
        <div className="rounded-md border border-danger-border bg-danger-bg p-2 text-xs text-danger-fg">
          <p className="font-medium">{branchError.message}</p>
          <p className="mt-1 text-danger-fg/90">Code: {branchError.code}</p>
        </div>
      )}

      {!isLoading && !loadErrorMessage && branches.length === 0 && (
        <p className="text-xs text-muted">No local branches found.</p>
      )}

      {!isLoading && !loadErrorMessage && branches.length > 0 && (
        <ul className="max-h-60 space-y-1 overflow-auto">
          {branches.map((branch) => (
            <li key={branch.name}>
              <button
                type="button"
                disabled={branch.isCurrent || isBranchMutating}
                onClick={() => onCheckoutBranch(branch.name)}
                className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-colors duration-150 ease-out ${
                  branch.isCurrent
                    ? "border-success-border bg-success-bg text-success-fg"
                    : "border-subtle bg-elevated text-secondary hover:border-strong hover:bg-panel hover:text-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
                }`}
                title={branch.isCurrent ? "Current branch" : "Checkout branch"}
              >
                <span className="truncate">{branch.name}</span>
                {branch.isCurrent && (
                  <span className="ml-auto rounded border border-success-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-success-fg">
                    Current
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="space-y-2 pt-1" onSubmit={handleCreateSubmit}>
        <label className="block text-xs font-medium text-secondary" htmlFor="create-branch-input">
          Create branch
        </label>
        <div className="flex gap-2">
          <input
            id="create-branch-input"
            type="text"
            value={newBranchName}
            onChange={(event) => onNewBranchNameChange(event.target.value)}
            placeholder="feature/branch-name"
            className="min-w-0 flex-1 rounded border border-subtle bg-base px-2 py-1.5 text-xs text-primary outline-none transition focus:border-accent"
          />
          <button
            type="submit"
            disabled={!canCreateBranch}
            className="rounded border border-subtle px-2 py-1.5 text-xs font-medium text-primary transition-colors duration-150 ease-out hover:border-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
          >
            {isCreateBranchPending ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </section>
  );
}
