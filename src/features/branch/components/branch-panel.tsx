import { FormEvent } from "react";

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
    <section className="mt-5 space-y-3 rounded border border-zinc-800 bg-zinc-900 p-3 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Branches</h2>
        {isLoading && <span className="text-xs text-zinc-500">Loading...</span>}
      </div>

      {loadErrorMessage && (
        <div className="rounded border border-red-700/50 bg-red-950/40 p-2 text-xs text-red-200">
          {loadErrorMessage}
        </div>
      )}

      {branchError && (
        <div className="rounded border border-red-700/50 bg-red-950/40 p-2 text-xs text-red-200">
          <p className="font-medium">{branchError.message}</p>
          <p className="mt-1 text-red-300/90">Code: {branchError.code}</p>
        </div>
      )}

      {!isLoading && !loadErrorMessage && branches.length === 0 && (
        <p className="text-xs text-zinc-500">No local branches found.</p>
      )}

      {!isLoading && !loadErrorMessage && branches.length > 0 && (
        <ul className="max-h-60 space-y-1 overflow-auto">
          {branches.map((branch) => (
            <li key={branch.name}>
              <button
                type="button"
                disabled={branch.isCurrent || isBranchMutating}
                onClick={() => onCheckoutBranch(branch.name)}
                className={`flex w-full items-center gap-2 rounded border px-2 py-1.5 text-left text-xs transition ${
                  branch.isCurrent
                    ? "border-emerald-700/60 bg-emerald-950/30 text-emerald-200"
                    : "border-zinc-700 bg-zinc-950 text-zinc-200 hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                }`}
                title={branch.isCurrent ? "Current branch" : "Checkout branch"}
              >
                <span className="truncate">{branch.name}</span>
                {branch.isCurrent && (
                  <span className="ml-auto rounded border border-emerald-600/50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
                    Current
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="space-y-2 pt-1" onSubmit={handleCreateSubmit}>
        <label className="block text-xs font-medium text-zinc-400" htmlFor="create-branch-input">
          Create branch
        </label>
        <div className="flex gap-2">
          <input
            id="create-branch-input"
            type="text"
            value={newBranchName}
            onChange={(event) => onNewBranchNameChange(event.target.value)}
            placeholder="feature/branch-name"
            className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 outline-none transition focus:border-zinc-500"
          />
          <button
            type="submit"
            disabled={!canCreateBranch}
            className="rounded border border-zinc-600 px-2 py-1.5 text-xs font-medium text-zinc-100 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreateBranchPending ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </section>
  );
}
