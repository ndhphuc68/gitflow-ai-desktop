import { FormEvent, useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";

import { openRepository as openRepositoryApi } from "./features/repository/api/open-repository";
import { useOpenRepository } from "./features/repository/hooks/use-open-repository";
import { useBranchList } from "./features/branch/hooks/use-branch-list";
import { useCheckoutBranch } from "./features/branch/hooks/use-checkout-branch";
import { useCreateBranch } from "./features/branch/hooks/use-create-branch";
import { useRepositoryStatus } from "./features/status/hooks/use-repository-status";
import { useWorkspaceStore } from "./store/workspace-store";
import { AppError } from "./shared/types/app-error";
import { normalizeAppError } from "./shared/errors/normalize-app-error";
import { RepositoryDto } from "./features/repository/types/repository-dto";
import { BranchPanel } from "./features/branch/components/branch-panel";
import { useCommitHistory } from "./features/history/hooks/use-commit-history";
import { HistoryListPanel } from "./features/history/components/history-list-panel";
import { SelectedCommitDetailPanel } from "./features/history/components/selected-commit-detail-panel";
import { Commit } from "./features/history/entities/commit";
import { useWorkingDiff } from "./features/diff/hooks/use-working-diff";
import { useCommitDiff } from "./features/diff/hooks/use-commit-diff";
import { WorkingChangesPanel } from "./features/diff/components/working-changes-panel";
import { UnifiedDiffPanel } from "./features/diff/components/unified-diff-panel";

const HISTORY_LIMIT = 50;

export default function App() {
  const [folderPathInput, setFolderPathInput] = useState("");
  const [selectedRepository, setSelectedRepository] = useState<RepositoryDto | null>(
    null
  );
  const [openRepositoryError, setOpenRepositoryError] = useState<AppError | null>(
    null
  );
  const [branchError, setBranchError] = useState<AppError | null>(null);
  const [newBranchName, setNewBranchName] = useState("");
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [selectedWorkingFilePath, setSelectedWorkingFilePath] = useState<string | null>(null);
  const [selectedCommitDiffFilePath, setSelectedCommitDiffFilePath] = useState<string | null>(null);

  const setSelectedRepositoryPath = useWorkspaceStore(
    (state) => state.setSelectedRepositoryPath
  );
  const openRepositoryMutation = useOpenRepository();
  const branchListQuery = useBranchList(selectedRepository?.rootPath ?? null);
  const checkoutBranchMutation = useCheckoutBranch({
    repositoryPath: selectedRepository?.rootPath ?? null,
  });
  const createBranchMutation = useCreateBranch({
    repositoryPath: selectedRepository?.rootPath ?? null,
  });
  const commitHistoryQuery = useCommitHistory({
    repositoryPath: selectedRepository?.rootPath ?? null,
    limit: HISTORY_LIMIT,
  });
  const repositoryStatusQuery = useRepositoryStatus(selectedRepository?.rootPath ?? null);
  const workingDiffQuery = useWorkingDiff({
    repositoryPath: selectedRepository?.rootPath ?? null,
    filePath: selectedWorkingFilePath,
  });
  const commitDiffQuery = useCommitDiff({
    repositoryPath: selectedRepository?.rootPath ?? null,
    commitHash: selectedCommit?.hash ?? null,
    filePath: undefined,
  });

  const statusEntries = repositoryStatusQuery.data ?? [];
  const branchEntries = branchListQuery.data ?? [];
  const historyEntries = commitHistoryQuery.data ?? [];
  const commitDiffFiles = commitDiffQuery.data ?? [];
  const workingDiffFiles = workingDiffQuery.data ?? [];
  const hasValidBranchName = newBranchName.trim().length > 0;
  const isBranchMutating = checkoutBranchMutation.isPending || createBranchMutation.isPending;
  const canCreateBranch = hasValidBranchName && !isBranchMutating;

  const refreshRepositoryMetadata = async (repositoryPath: string) => {
    const refreshedRepository = await openRepositoryApi({ folderPath: repositoryPath });
    setSelectedRepositoryPath(refreshedRepository.rootPath);
    setSelectedRepository(refreshedRepository);
  };

  useEffect(() => {
    if (!selectedRepository) {
      setSelectedCommit(null);
      return;
    }
    if (!commitHistoryQuery.isSuccess) {
      return;
    }

    setSelectedCommit((current) => {
      if (!current) {
        return current;
      }

      const hasSelectedCommit = historyEntries.some((entry) => entry.hash === current.hash);
      return hasSelectedCommit ? current : null;
    });
  }, [selectedRepository, commitHistoryQuery.isSuccess, historyEntries]);

  useEffect(() => {
    if (!selectedRepository) {
      setSelectedWorkingFilePath(null);
      return;
    }
    const selectableEntries = statusEntries.filter((entry) => entry.group === "unstaged");
    setSelectedWorkingFilePath((current) => {
      if (current && selectableEntries.some((entry) => entry.path === current)) {
        return current;
      }
      const firstEntry = selectableEntries[0];
      return firstEntry?.path ?? null;
    });
  }, [selectedRepository, statusEntries]);

  useEffect(() => {
    if (!selectedCommit) {
      setSelectedCommitDiffFilePath(null);
      return;
    }
    if (!commitDiffQuery.isSuccess) {
      return;
    }
    setSelectedCommitDiffFilePath((current) => {
      if (current && commitDiffFiles.some((file) => file.path === current)) {
        return current;
      }
      return commitDiffFiles[0]?.path ?? null;
    });
  }, [selectedCommit, commitDiffQuery.isSuccess, commitDiffFiles]);

  const handleSelectRepositoryFolder = async () => {
    try {
      const selectedPath = await open({
        directory: true,
        multiple: false,
        title: "Select Repository Folder",
      });

      if (typeof selectedPath === "string") {
        setFolderPathInput(selectedPath);
      }
    } catch (error) {
      setOpenRepositoryError(
        normalizeAppError(error, {
          message: "Failed to open folder picker",
        })
      );
    }
  };

  const handleOpenRepository = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOpenRepositoryError(null);

    try {
      const repository = await openRepositoryMutation.mutateAsync({
        folderPath: folderPathInput,
      });
      setBranchError(null);
      setNewBranchName("");
      setSelectedCommit(null);
      setSelectedWorkingFilePath(null);
      setSelectedCommitDiffFilePath(null);
      setSelectedRepositoryPath(repository.rootPath);
      setSelectedRepository(repository);
    } catch (error) {
      setSelectedRepository(null);
      setSelectedRepositoryPath(null);
      setOpenRepositoryError(
        normalizeAppError(error, {
          message: "Unexpected error while opening repository",
        })
      );
    }
  };

  const handleCheckoutBranch = async (branchName: string) => {
    if (!selectedRepository) {
      return;
    }

    setBranchError(null);
    try {
      await checkoutBranchMutation.mutateAsync(branchName);
      await refreshRepositoryMetadata(selectedRepository.rootPath);
    } catch (error) {
      setBranchError(
        normalizeAppError(error, {
          message: "Failed to checkout branch",
        })
      );
    }
  };

  const handleCreateBranch = async () => {
    setBranchError(null);

    if (!hasValidBranchName) {
      setBranchError({
        code: "INVALID_INPUT",
        message: "Branch name is required",
        details: null,
        recoverable: true,
      });
      return;
    }

    if (!selectedRepository) {
      return;
    }

    try {
      await createBranchMutation.mutateAsync(newBranchName.trim());
      setNewBranchName("");
      await refreshRepositoryMetadata(selectedRepository.rootPath);
    } catch (error) {
      setBranchError(
        normalizeAppError(error, {
          message: "Failed to create branch",
        })
      );
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <aside className="w-72 border-r border-zinc-800 p-4">
        <h1 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Repositories
        </h1>
        <form className="space-y-2" onSubmit={handleOpenRepository}>
          <label className="block text-xs font-medium text-zinc-400" htmlFor="repo-path-input">
            Open Repository
          </label>
          <input
            id="repo-path-input"
            type="text"
            value={folderPathInput}
            onChange={(event) => setFolderPathInput(event.target.value)}
            placeholder="Enter local folder path"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
          />
          <button
            type="button"
            onClick={handleSelectRepositoryFolder}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
          >
            Select Folder
          </button>
          <button
            type="submit"
            disabled={openRepositoryMutation.isPending || folderPathInput.trim().length === 0}
            className="w-full rounded bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {openRepositoryMutation.isPending ? "Opening..." : "Open Repository"}
          </button>
        </form>

        {selectedRepository && (
          <BranchPanel
            branches={branchEntries}
            isLoading={branchListQuery.isLoading}
            loadErrorMessage={
              branchListQuery.isError
                ? normalizeAppError(branchListQuery.error, {
                    message: "Failed to load branches",
                  }).message
                : null
            }
            branchError={branchError}
            newBranchName={newBranchName}
            isBranchMutating={isBranchMutating}
            isCreateBranchPending={createBranchMutation.isPending}
            canCreateBranch={canCreateBranch}
            onNewBranchNameChange={setNewBranchName}
            onCheckoutBranch={(branchName) => {
              void handleCheckoutBranch(branchName);
            }}
            onCreateBranch={() => {
              void handleCreateBranch();
            }}
          />
        )}
      </aside>

      <main className="flex-1 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Workspace
        </h2>

        {openRepositoryMutation.isPending && (
          <div className="rounded border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300">
            Loading repository metadata...
          </div>
        )}

        {!openRepositoryMutation.isPending && openRepositoryError && (
          <div className="rounded border border-red-700/50 bg-red-950/40 p-4 text-sm text-red-200">
            <p className="font-medium">{openRepositoryError.message}</p>
            <p className="mt-1 text-xs text-red-300/90">Code: {openRepositoryError.code}</p>
          </div>
        )}

        {!openRepositoryMutation.isPending && !openRepositoryError && selectedRepository && (
          <div className="space-y-4">
            <HistoryListPanel
              isLoading={commitHistoryQuery.isLoading}
              errorMessage={
                commitHistoryQuery.isError
                  ? normalizeAppError(commitHistoryQuery.error, {
                      message: "Failed to load commit history",
                    }).message
                  : null
              }
              commits={historyEntries}
              selectedCommitHash={selectedCommit?.hash ?? null}
              onSelectCommit={setSelectedCommit}
            />

            <WorkingChangesPanel
              isLoading={repositoryStatusQuery.isLoading}
              errorMessage={
                repositoryStatusQuery.isError
                  ? normalizeAppError(repositoryStatusQuery.error, {
                      message: "Failed to load changed files",
                    }).message
                  : null
              }
              entries={statusEntries}
              selectedFilePath={selectedWorkingFilePath}
              onSelectFilePath={setSelectedWorkingFilePath}
            />

            {!selectedCommit && (
              <UnifiedDiffPanel
                title="Working Tree Diff"
                isLoading={workingDiffQuery.isLoading}
                errorMessage={
                  workingDiffQuery.isError
                    ? normalizeAppError(workingDiffQuery.error, {
                        message: "Failed to load working diff",
                      }).message
                    : null
                }
                files={workingDiffFiles}
                selectedFilePath={selectedWorkingFilePath}
                onSelectFilePath={setSelectedWorkingFilePath}
                emptyMessage="Select a changed file to view its diff."
              />
            )}

            {selectedCommit && (
              <UnifiedDiffPanel
                title={`Commit Diff (${selectedCommit.shortHash})`}
                isLoading={commitDiffQuery.isLoading}
                errorMessage={
                  commitDiffQuery.isError
                    ? normalizeAppError(commitDiffQuery.error, {
                        message: "Failed to load commit diff",
                      }).message
                    : null
                }
                files={commitDiffFiles}
                selectedFilePath={selectedCommitDiffFilePath}
                onSelectFilePath={setSelectedCommitDiffFilePath}
                emptyMessage="No diff files found for this commit."
              />
            )}
          </div>
        )}

        {!openRepositoryMutation.isPending &&
          !openRepositoryError &&
          !selectedRepository && (
            <div className="rounded border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300">
              Open a local repository to load metadata.
            </div>
          )}
      </main>

      <aside className="w-80 border-l border-zinc-800 p-4">
        <SelectedCommitDetailPanel
          commit={selectedCommit}
          repositoryPath={selectedRepository?.rootPath ?? null}
        />
      </aside>
    </div>
  );
}