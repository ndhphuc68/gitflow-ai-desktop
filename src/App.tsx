import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { open } from "@tauri-apps/plugin-dialog";

import { openRepository as openRepositoryApi } from "./features/repository/api/open-repository";
import { RecentRepositoriesList } from "./features/repository/components/recent-repositories-list";
import { RepositoryTabBar } from "./features/repository/components/repository-tab-bar";
import { useOpenRepository } from "./features/repository/hooks/use-open-repository";
import { useRecentRepositories } from "./features/repository/hooks/use-recent-repositories";
import { useRemoveRecentRepository } from "./features/repository/hooks/use-remove-recent-repository";
import { recentRepositoriesQueryKey } from "./features/repository/hooks/use-recent-repositories";
import { useBranchList } from "./features/branch/hooks/use-branch-list";
import { useCheckoutBranch } from "./features/branch/hooks/use-checkout-branch";
import { useCreateBranch } from "./features/branch/hooks/use-create-branch";
import { useRepositoryStatus } from "./features/status/hooks/use-repository-status";
import { useDiscardChanges } from "./features/status/hooks/use-discard-changes";
import { useUnstageFiles } from "./features/status/hooks/use-unstage-files";
import {
  repositoryTabToDto,
  useWorkspaceStore,
} from "./store/workspace-store";
import { AppError } from "./shared/types/app-error";
import { normalizeAppError } from "./shared/errors/normalize-app-error";
import { LoadingSpinner } from "./shared/ui/loading-spinner";
import { RepositoryDto } from "./features/repository/types/repository-dto";
import { BranchPanel } from "./features/branch/components/branch-panel";
import { useCommitHistory } from "./features/history/hooks/use-commit-history";
import { HistoryListPanel } from "./features/history/components/history-list-panel";
import { SelectedCommitDetailPanel } from "./features/history/components/selected-commit-detail-panel";
import { Commit } from "./features/history/entities/commit";
import { useWorkingDiff } from "./features/diff/hooks/use-working-diff";
import { useCommitChangedFiles } from "./features/diff/hooks/use-commit-changed-files";
import { useCommitDiff } from "./features/diff/hooks/use-commit-diff";
import { WorkingChangesPanel } from "./features/diff/components/working-changes-panel";
import { UnifiedDiffPanel } from "./features/diff/components/unified-diff-panel";
import type { WorkingDiffSelection } from "./features/diff/types/working-diff-selection";
import {
  normalizeWorkingTreeFilePath,
  workingDiffSelectionKey,
} from "./features/diff/types/working-diff-selection";
import type { RepositoryStatusEntry } from "./features/status/entities/repository-status";
import { CommitPanel } from "./features/commit/components/commit-panel";
import { useCreateCommit } from "./features/commit/hooks/use-create-commit";
import { useGenerateCommitMessage } from "./features/commit/hooks/use-generate-commit-message";
import { CommitMessageSuggestionDto } from "./features/commit/types/generate-commit-message-dto";
import { CommandPalette } from "./features/command-palette/components/command-palette";
import {
  buildCommandRegistry,
  type CommandPaletteContext,
} from "./features/command-palette/command-registry";

const HISTORY_LIMIT = 50;

const EMPTY_REPOSITORY_STATUS_ENTRIES: RepositoryStatusEntry[] = [];
type KeyboardFocusZone = "history" | "workingChanges" | "diff" | "commit" | null;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT"
  );
}

function isCommitFormSubmittable(
  stagedCount: number,
  commitMessage: string,
  isCommitPending: boolean
): boolean {
  return stagedCount > 0 && commitMessage.trim().length > 0 && !isCommitPending;
}

function commitRowMatchesStored(a: Commit, b: Commit): boolean {
  return (
    a.shortHash === b.shortHash &&
    a.subject === b.subject &&
    a.authorName === b.authorName &&
    a.authorEmail === b.authorEmail &&
    a.authoredAt === b.authoredAt &&
    a.parentHashes.length === b.parentHashes.length &&
    a.parentHashes.every((hash, index) => hash === b.parentHashes[index])
  );
}

export default function App() {
  const [folderPathInput, setFolderPathInput] = useState("");
  const [openRepositoryError, setOpenRepositoryError] = useState<AppError | null>(
    null
  );
  const [branchError, setBranchError] = useState<AppError | null>(null);
  const [newBranchName, setNewBranchName] = useState("");
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [selectedWorkingDiff, setSelectedWorkingDiff] = useState<WorkingDiffSelection | null>(
    null
  );
  const [selectedCommitDiffFilePath, setSelectedCommitDiffFilePath] = useState<string | null>(null);
  const [discardError, setDiscardError] = useState<AppError | null>(null);
  const [discardSuccessMessage, setDiscardSuccessMessage] = useState<string | null>(null);
  const [unstageError, setUnstageError] = useState<AppError | null>(null);
  const [commitMessage, setCommitMessage] = useState("");
  const [commitError, setCommitError] = useState<AppError | null>(null);
  const [commitSuccessMessage, setCommitSuccessMessage] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<CommitMessageSuggestionDto[]>([]);
  const [aiGenerateError, setAiGenerateError] = useState<AppError | null>(null);
  const [aiTruncatedDiff, setAiTruncatedDiff] = useState(false);
  const [allowStagedDiffForAi, setAllowStagedDiffForAi] = useState(false);
  const [recentsPersistWarning, setRecentsPersistWarning] = useState<AppError | null>(null);
  const [keyboardFocusZone, setKeyboardFocusZone] = useState<KeyboardFocusZone>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [requestedDiscardPath, setRequestedDiscardPath] = useState<string | null>(null);
  const [requestedRevertCommitHash, setRequestedRevertCommitHash] = useState<string | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  const queryClient = useQueryClient();
  const openRepositoryTabs = useWorkspaceStore((state) => state.openRepositoryTabs);
  const activeRepositoryId = useWorkspaceStore((state) => state.activeRepositoryId);
  const openOrActivateTabFromRepository = useWorkspaceStore(
    (state) => state.openOrActivateTabFromRepository
  );
  const setActiveRepositoryId = useWorkspaceStore((state) => state.setActiveRepositoryId);
  const closeRepositoryTab = useWorkspaceStore((state) => state.closeRepositoryTab);
  const syncTabFromRepository = useWorkspaceStore((state) => state.syncTabFromRepository);

  const activeRepositoryTab = useMemo(
    () => openRepositoryTabs.find((tab) => tab.id === activeRepositoryId) ?? null,
    [openRepositoryTabs, activeRepositoryId]
  );
  const selectedRepository = useMemo(
    () => (activeRepositoryTab ? repositoryTabToDto(activeRepositoryTab) : null),
    [activeRepositoryTab]
  );

  const openRepositoryMutation = useOpenRepository();
  const recentRepositoriesQuery = useRecentRepositories();
  const removeRecentRepositoryMutation = useRemoveRecentRepository();
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
  const discardChangesMutation = useDiscardChanges({
    repositoryPath: selectedRepository?.rootPath ?? null,
  });
  const unstageFilesMutation = useUnstageFiles({
    repositoryPath: selectedRepository?.rootPath ?? null,
  });
  const createCommitMutation = useCreateCommit({
    repositoryPath: selectedRepository?.rootPath ?? null,
  });
  const generateCommitMessageMutation = useGenerateCommitMessage({
    repositoryPath: selectedRepository?.rootPath ?? null,
  });
  const workingDiffQuery = useWorkingDiff({
    repositoryPath: selectedRepository?.rootPath ?? null,
    selection: selectedWorkingDiff,
  });
  const commitChangedFilesQuery = useCommitChangedFiles({
    repositoryPath: selectedRepository?.rootPath ?? null,
    commitHash: selectedCommit?.hash ?? null,
  });
  const commitDiffQuery = useCommitDiff({
    repositoryPath: selectedRepository?.rootPath ?? null,
    commitHash: selectedCommit?.hash ?? null,
    filePath: selectedCommitDiffFilePath,
    enabled: commitChangedFilesQuery.isSuccess,
  });

  const statusEntries =
    repositoryStatusQuery.data ?? EMPTY_REPOSITORY_STATUS_ENTRIES;
  const stagedCount = useMemo(() => {
    const paths = new Set(
      statusEntries.filter((entry) => entry.group === "staged").map((entry) => entry.path)
    );
    return paths.size;
  }, [statusEntries]);
  const branchEntries = branchListQuery.data ?? [];
  const historyEntries = commitHistoryQuery.data ?? [];
  const commitDiffFiles = useMemo(() => {
    const summaries = commitChangedFilesQuery.data ?? [];
    const selectedPath = selectedCommitDiffFilePath;
    const batch = commitDiffQuery.data ?? [];
    const loaded =
      batch.find((file) => file.path === selectedPath) ??
      (batch.length === 1 ? batch[0] : null);

    return summaries.map((summary) => {
      if (loaded && loaded.path === summary.path) {
        return loaded;
      }
      return summary;
    });
  }, [commitChangedFilesQuery.data, selectedCommitDiffFilePath, commitDiffQuery.data]);

  const commitDiffPanelLoading = commitChangedFilesQuery.isLoading;
  const commitDiffContentLoading = Boolean(
    selectedCommitDiffFilePath &&
      commitChangedFilesQuery.isSuccess &&
      commitDiffQuery.isPending
  );
  const workingDiffFiles = workingDiffQuery.data ?? [];
  const workingDiffScopeForFileList = selectedWorkingDiff?.scope ?? "unstaged";
  const hasValidBranchName = newBranchName.trim().length > 0;
  const isBranchMutating = checkoutBranchMutation.isPending || createBranchMutation.isPending;
  const canCreateBranch = hasValidBranchName && !isBranchMutating;
  const canCreateCommit = isCommitFormSubmittable(
    stagedCount,
    commitMessage,
    createCommitMutation.isPending
  );

  const commitFooterHint = useMemo(() => {
    if (stagedCount === 0) {
      return "Stage changes in the working tree to create a commit.";
    }
    if (commitMessage.trim().length === 0) {
      return "Message required.";
    }
    if (createCommitMutation.isPending) {
      return "Creating commit…";
    }
    return "Ready to commit staged changes.";
  }, [stagedCount, commitMessage, createCommitMutation.isPending]);

  const applyOpenedRepository = (repository: RepositoryDto) => {
    setBranchError(null);
    setNewBranchName("");
    setSelectedCommit(null);
    setSelectedWorkingDiff(null);
    setSelectedCommitDiffFilePath(null);
    setCommitMessage("");
    setCommitError(null);
    setCommitSuccessMessage(null);
    setAiSuggestions([]);
    setAiGenerateError(null);
    setAiTruncatedDiff(false);
    setAllowStagedDiffForAi(false);
    setDiscardError(null);
    setDiscardSuccessMessage(null);
    setUnstageError(null);
    openOrActivateTabFromRepository(repository);
  };

  const refreshRepositoryMetadata = async (repositoryPath: string) => {
    const { repository: refreshedRepository, recentsPersistError } = await openRepositoryApi({
      folderPath: repositoryPath,
    });
    syncTabFromRepository(refreshedRepository);
    setRecentsPersistWarning(recentsPersistError ?? null);
    void queryClient.invalidateQueries({ queryKey: recentRepositoriesQueryKey });
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

      const fresh = historyEntries.find((entry) => entry.hash === current.hash);
      if (!fresh) {
        return null;
      }
      return commitRowMatchesStored(fresh, current) ? current : fresh;
    });
  }, [selectedRepository, commitHistoryQuery.isSuccess, historyEntries]);

  useEffect(() => {
    setBranchError(null);
    setNewBranchName("");
    setSelectedCommit(null);
    setSelectedWorkingDiff(null);
    setSelectedCommitDiffFilePath(null);
    setCommitMessage("");
    setCommitError(null);
    setCommitSuccessMessage(null);
    setAiSuggestions([]);
    setAiGenerateError(null);
    setAiTruncatedDiff(false);
    setAllowStagedDiffForAi(false);
    setDiscardError(null);
    setDiscardSuccessMessage(null);
    setUnstageError(null);
    setOpenRepositoryError(null);
    setRecentsPersistWarning(null);
  }, [activeRepositoryId]);

  useEffect(() => {
    setFolderPathInput(activeRepositoryTab?.rootPath ?? "");
  }, [activeRepositoryTab?.rootPath]);

  useEffect(() => {
    if (!commitSuccessMessage) {
      return;
    }
    const timeoutId = window.setTimeout(() => setCommitSuccessMessage(null), 6000);
    return () => window.clearTimeout(timeoutId);
  }, [commitSuccessMessage]);

  useEffect(() => {
    if (!selectedRepository) {
      setSelectedWorkingDiff(null);
      return;
    }
    const inspectable = statusEntries.filter(
      (entry) => entry.group === "staged" || entry.group === "unstaged"
    );
    const toSelection = (entry: (typeof inspectable)[number]): WorkingDiffSelection => ({
      path: normalizeWorkingTreeFilePath(entry.path),
      scope: entry.group === "staged" ? "staged" : "unstaged",
    });
    setSelectedWorkingDiff((current) => {
      if (
        current &&
        inspectable.some(
          (entry) => workingDiffSelectionKey(toSelection(entry)) === workingDiffSelectionKey(current)
        )
      ) {
        return current;
      }
      const first = inspectable[0];
      return first ? toSelection(first) : null;
    });
  }, [selectedRepository, statusEntries]);

  useEffect(() => {
    if (!selectedCommit) {
      setSelectedCommitDiffFilePath(null);
      return;
    }
    if (!commitChangedFilesQuery.isSuccess) {
      return;
    }
    const list = commitChangedFilesQuery.data ?? [];
    setSelectedCommitDiffFilePath((current) => {
      if (current && list.some((file) => file.path === current)) {
        return current;
      }
      return list[0]?.path ?? null;
    });
  }, [selectedCommit, commitChangedFilesQuery.isSuccess, commitChangedFilesQuery.data]);

  useEffect(() => {
    const handleGlobalShortcuts = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      const isCtrlOrMeta = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;
      const key = event.key.toLowerCase();

      if (!isCommandPaletteOpen && isCtrlOrMeta && !isShift && key === "p" && !isTypingTarget(event.target)) {
        event.preventDefault();
        lastFocusedElementRef.current =
          event.target instanceof HTMLElement ? event.target : (document.activeElement instanceof HTMLElement ? document.activeElement : null);
        setIsCommandPaletteOpen(true);
        return;
      }

      if (isCommandPaletteOpen) {
        return;
      }

      if (isCtrlOrMeta && key === "tab" && openRepositoryTabs.length > 1) {
        event.preventDefault();
        const currentIndex = openRepositoryTabs.findIndex((tab) => tab.id === activeRepositoryId);
        if (currentIndex < 0) {
          return;
        }
        const delta = isShift ? -1 : 1;
        const nextIndex = (currentIndex + delta + openRepositoryTabs.length) % openRepositoryTabs.length;
        const nextTab = openRepositoryTabs[nextIndex];
        if (nextTab) {
          setActiveRepositoryId(nextTab.id);
        }
        return;
      }

      if (isCtrlOrMeta && !isShift && key === "w" && activeRepositoryId) {
        event.preventDefault();
        closeRepositoryTab(activeRepositoryId);
        return;
      }

      if (
        isCtrlOrMeta &&
        key === "enter" &&
        keyboardFocusZone === "commit" &&
        !createCommitMutation.isPending &&
        canCreateCommit
      ) {
        event.preventDefault();
        void handleSubmitCommit();
        return;
      }

      if (event.key === "Escape" && !isTypingTarget(event.target)) {
        if (selectedCommit) {
          event.preventDefault();
          setSelectedCommit(null);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [
    openRepositoryTabs,
    activeRepositoryId,
    closeRepositoryTab,
    setActiveRepositoryId,
    keyboardFocusZone,
    createCommitMutation.isPending,
    canCreateCommit,
    selectedCommit,
    isCommandPaletteOpen,
  ]);

  const openRepositoryAtPath = async (folderPath: string) => {
    setOpenRepositoryError(null);
    setRecentsPersistWarning(null);
    try {
      const { repository, recentsPersistError } = await openRepositoryMutation.mutateAsync({
        folderPath,
      });
      applyOpenedRepository(repository);
      setRecentsPersistWarning(recentsPersistError ?? null);
    } catch (error) {
      setOpenRepositoryError(
        normalizeAppError(error, {
          message: "Unexpected error while opening repository",
        })
      );
    }
  };

  const handleSelectFolderAndOpenRepository = async () => {
    setOpenRepositoryError(null);
    try {
      const selectedPath: unknown = await open({
        directory: true,
        multiple: false,
        title: "Open Repository",
      });

      let path: string | null = null;
      if (typeof selectedPath === "string") {
        path = selectedPath;
      } else if (Array.isArray(selectedPath)) {
        const first = selectedPath[0];
        if (typeof first === "string") {
          path = first;
        }
      }

      if (path) {
        setFolderPathInput(path);
        await openRepositoryAtPath(path);
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
    const trimmed = folderPathInput.trim();
    if (trimmed.length === 0) {
      return;
    }
    await openRepositoryAtPath(trimmed);
  };

  const handleOpenRecentRepository = async (rootPath: string) => {
    setOpenRepositoryError(null);
    setRecentsPersistWarning(null);
    setFolderPathInput(rootPath);

    try {
      const { repository, recentsPersistError } = await openRepositoryMutation.mutateAsync({
        folderPath: rootPath,
      });
      applyOpenedRepository(repository);
      setRecentsPersistWarning(recentsPersistError ?? null);
    } catch (error) {
      setOpenRepositoryError(
        normalizeAppError(error, {
          message:
            "Could not open this recent repository. It may have moved, been removed, or is no longer a Git repository.",
        })
      );
    }
  };

  const handleRemoveRecentRepository = (rootPath: string) => {
    removeRecentRepositoryMutation.reset();
    void removeRecentRepositoryMutation.mutateAsync({ rootPath });
  };

  const recentRepositoriesLoadErrorMessage =
    recentRepositoriesQuery.isError && recentRepositoriesQuery.error
      ? normalizeAppError(recentRepositoriesQuery.error, {
          message: "Failed to load recent repositories",
        }).message
      : null;

  const recentRepositoriesRemoveErrorMessage =
    removeRecentRepositoryMutation.isError && removeRecentRepositoryMutation.error
      ? normalizeAppError(removeRecentRepositoryMutation.error, {
          message: "Failed to remove recent repository",
        }).message
      : null;

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

  const handleGenerateCommitMessage = async () => {
    if (!selectedRepository) {
      return;
    }

    setAiGenerateError(null);
    try {
      const result = await generateCommitMessageMutation.mutateAsync();
      setAiSuggestions(result.suggestions);
      setAiTruncatedDiff(result.truncatedDiff);
    } catch (error) {
      setAiSuggestions([]);
      setAiTruncatedDiff(false);
      setAiGenerateError(
        normalizeAppError(error, {
          message: "Failed to generate commit message",
        })
      );
    }
  };

  const handleSelectCommitMessageSuggestion = (suggestion: CommitMessageSuggestionDto) => {
    const body = suggestion.description?.trim();
    setCommitError(null);
    setCommitMessage(
      body ? `${suggestion.title.trim()}\n\n${body}` : suggestion.title.trim()
    );
  };

  const handleSubmitCommit = async () => {
    if (!selectedRepository) {
      return;
    }
    if (!isCommitFormSubmittable(stagedCount, commitMessage, createCommitMutation.isPending)) {
      return;
    }

    setCommitError(null);
    setCommitSuccessMessage(null);
    try {
      await createCommitMutation.mutateAsync(commitMessage.trim());
      setCommitMessage("");
      setAiSuggestions([]);
      setAiTruncatedDiff(false);
      setCommitSuccessMessage("Commit created successfully.");
    } catch (error) {
      setCommitError(
        normalizeAppError(error, {
          message: "Failed to create commit",
        })
      );
    }
  };

  const commandPaletteContext: CommandPaletteContext = useMemo(
    () => ({
      hasRepositoryOpen: Boolean(selectedRepository),
      openRepositoryTabs,
      activeRepositoryId,
      recentRepositories: recentRepositoriesQuery.data ?? [],
      branches: branchEntries,
      commits: historyEntries,
      selectedCommitHash: selectedCommit?.hash ?? null,
      selectedWorkingDiff,
      openRepositoryDialog: () => {
        void handleSelectFolderAndOpenRepository();
      },
      refreshAll: () => {
        void queryClient.invalidateQueries();
      },
      focusPanel: (zone) => setKeyboardFocusZone(zone),
      switchRepositoryTab: (repositoryId) => setActiveRepositoryId(repositoryId),
      openRecentRepository: (rootPath) => {
        void handleOpenRecentRepository(rootPath);
      },
      checkoutBranch: (branchName) => {
        void handleCheckoutBranch(branchName);
      },
      selectCommit: (hash) => {
        const commit = historyEntries.find((entry) => entry.hash === hash);
        if (commit) {
          setSelectedCommit(commit);
        }
      },
      commitNow: () => {
        if (!createCommitMutation.isPending && canCreateCommit) {
          void handleSubmitCommit();
        }
      },
      requestRevertSelectedCommit: () => {
        if (selectedCommit?.hash) {
          setRequestedRevertCommitHash(selectedCommit.hash);
        }
      },
      requestDiscardSelectedUnstagedFile: () => {
        if (selectedWorkingDiff?.scope === "unstaged" && selectedWorkingDiff.path) {
          setRequestedDiscardPath(selectedWorkingDiff.path);
        }
      },
    }),
    [
      selectedRepository,
      openRepositoryTabs,
      activeRepositoryId,
      recentRepositoriesQuery.data,
      branchEntries,
      historyEntries,
      selectedCommit,
      selectedWorkingDiff,
      queryClient,
      createCommitMutation.isPending,
      canCreateCommit,
      setActiveRepositoryId,
    ]
  );

  const commandPaletteCommands = useMemo(
    () => buildCommandRegistry(commandPaletteContext),
    [commandPaletteContext]
  );

  const handleDiscardFile = async (filePath: string): Promise<boolean> => {
    if (!selectedRepository) {
      return false;
    }

    setDiscardError(null);
    setDiscardSuccessMessage(null);

    try {
      const message = await discardChangesMutation.mutateAsync([filePath]);
      setDiscardSuccessMessage(message ?? "Discarded local unstaged changes.");
      return true;
    } catch (error) {
      setDiscardError(
        normalizeAppError(error, {
          message: "Failed to discard local changes",
        })
      );
      return false;
    }
  };

  const handleUnstageFile = async (filePath: string) => {
    if (!selectedRepository) {
      return;
    }

    const normalizedPath = normalizeWorkingTreeFilePath(filePath);
    setUnstageError(null);
    try {
      await unstageFilesMutation.mutateAsync([normalizedPath]);
    } catch (error) {
      setUnstageError(
        normalizeAppError(error, {
          message: "Failed to unstage file",
        })
      );
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-base font-sans text-primary">
      <header className="flex shrink-0 items-stretch gap-2 border-b border-subtle bg-base pr-2">
        <RepositoryTabBar
          tabs={openRepositoryTabs}
          activeRepositoryId={activeRepositoryId}
          onSelectTab={setActiveRepositoryId}
          onCloseTab={closeRepositoryTab}
        />
        <div className="flex shrink-0 items-center py-1">
          <button
            type="button"
            onClick={() => {
              void handleSelectFolderAndOpenRepository();
            }}
            disabled={openRepositoryMutation.isPending}
            className="rounded border border-subtle bg-elevated px-3 py-1.5 text-xs font-medium text-primary transition-colors duration-150 ease-out hover:bg-panel active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
          >
            {openRepositoryMutation.isPending ? "Opening…" : "Open Repository"}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside className="min-h-0 w-72 shrink-0 overflow-y-auto border-r border-glass-border ui-glass p-4 text-secondary">
        <h1 className="mb-4 ui-section-title">
          Repositories
        </h1>
        <RecentRepositoriesList
          entries={recentRepositoriesQuery.data ?? []}
          isLoading={recentRepositoriesQuery.isLoading}
          loadErrorMessage={recentRepositoriesLoadErrorMessage}
          removeErrorMessage={recentRepositoriesRemoveErrorMessage}
          currentRootPath={selectedRepository?.rootPath ?? null}
          isOpenPending={openRepositoryMutation.isPending}
          onOpenRecent={(rootPath) => {
            void handleOpenRecentRepository(rootPath);
          }}
          onRemoveRecent={handleRemoveRecentRepository}
          removePendingRootPath={
            removeRecentRepositoryMutation.isPending
              ? removeRecentRepositoryMutation.variables?.rootPath ?? null
              : null
          }
        />
        <details className="mt-3 rounded border border-subtle bg-base/50">
          <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-medium text-muted transition-colors hover:text-secondary [&::-webkit-details-marker]:hidden">
            Open by folder path (advanced)
          </summary>
          <div className="space-y-2 border-t border-subtle px-3 pb-3 pt-2">
            <p className="text-[10px] leading-relaxed text-muted">
              Paste a local folder path if the picker is not available. Primary flow:{" "}
              <span className="text-muted">Open Repository</span> in the tab bar or Recents.
            </p>
            <form className="space-y-2" onSubmit={handleOpenRepository}>
              <label className="sr-only" htmlFor="repo-path-input">
                Repository folder path
              </label>
              <input
                id="repo-path-input"
                type="text"
                value={folderPathInput}
                onChange={(event) => setFolderPathInput(event.target.value)}
                placeholder="e.g. C:\\Users\\you\\project"
                className="w-full rounded border border-subtle bg-panel px-3 py-1.5 text-xs text-primary outline-none transition focus:border-accent"
              />
              <button
                type="submit"
                disabled={openRepositoryMutation.isPending || folderPathInput.trim().length === 0}
                className="w-full rounded border border-subtle bg-panel px-3 py-1.5 text-xs font-medium text-secondary transition hover:bg-panel disabled:cursor-not-allowed disabled:opacity-50"
              >
                {openRepositoryMutation.isPending ? "Opening…" : "Open this path"}
              </button>
            </form>
          </div>
        </details>

        {recentsPersistWarning && (
          <p className="mb-3 text-xs text-warning-fg/90" role="status">
            Repository opened, but recent list was not updated: {recentsPersistWarning.message}
          </p>
        )}

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

      <main className="relative min-h-0 min-w-0 flex-1 overflow-auto bg-panel p-5 ui-inset-border">
        <h2 className="mb-4 text-[13px] font-bold uppercase tracking-wide text-primary">
          Workspace
        </h2>

        {openRepositoryMutation.isPending && (
          <div className="flex min-h-[100px] items-center gap-3 rounded border border-subtle bg-panel p-4 text-sm text-secondary">
            <LoadingSpinner variant="workspace" />
            <span>Loading repository metadata…</span>
          </div>
        )}

        {!openRepositoryMutation.isPending && openRepositoryError && (
          <div className="rounded-md border border-danger-border bg-danger-bg p-4 text-sm text-danger-fg">
            <p className="font-medium">{openRepositoryError.message}</p>
            <p className="mt-1 text-xs text-danger-fg/90">Code: {openRepositoryError.code}</p>
          </div>
        )}

        {!openRepositoryMutation.isPending && !openRepositoryError && selectedRepository && (
          <div className="space-y-5">
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
              onClearSelection={() => setSelectedCommit(null)}
              isKeyboardFocused={keyboardFocusZone === "history"}
              onActivateKeyboardZone={() => setKeyboardFocusZone("history")}
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
              selectedDiff={selectedWorkingDiff}
              onSelectDiff={setSelectedWorkingDiff}
              onDiscardFile={handleDiscardFile}
              isDiscardPending={(filePath) =>
                discardChangesMutation.isPending &&
                discardChangesMutation.variables?.includes(filePath) === true
              }
              onUnstageFile={(filePath) => {
                void handleUnstageFile(filePath);
              }}
              isUnstagePending={(filePath) => {
                const normalized = normalizeWorkingTreeFilePath(filePath);
                return (
                  unstageFilesMutation.isPending &&
                  (unstageFilesMutation.variables?.some(
                    (p) => normalizeWorkingTreeFilePath(p) === normalized
                  ) ??
                    false)
                );
              }}
              discardError={discardError}
              discardSuccessMessage={discardSuccessMessage}
              unstageError={unstageError}
              onDiscardFlowOpen={() => {
                setDiscardError(null);
                setDiscardSuccessMessage(null);
                setUnstageError(null);
              }}
              requestedDiscardPath={requestedDiscardPath}
              onDiscardRequestHandled={() => setRequestedDiscardPath(null)}
              isKeyboardFocused={keyboardFocusZone === "workingChanges"}
              onActivateKeyboardZone={() => setKeyboardFocusZone("workingChanges")}
            />

            {!selectedCommit && (
              <UnifiedDiffPanel
                title={
                  selectedWorkingDiff?.scope === "staged"
                    ? "Staged Diff (index vs HEAD)"
                    : "Working Tree Diff (unstaged vs index)"
                }
                isLoading={workingDiffQuery.isLoading}
                errorMessage={
                  workingDiffQuery.isError
                    ? normalizeAppError(workingDiffQuery.error, {
                        message: "Failed to load working diff",
                      }).message
                    : null
                }
                files={workingDiffFiles}
                selectedFilePath={selectedWorkingDiff?.path ?? null}
                onSelectFilePath={(path) =>
                  setSelectedWorkingDiff({
                    path: normalizeWorkingTreeFilePath(path),
                    scope: workingDiffScopeForFileList,
                  })
                }
                emptyMessage="Select a file in Working Changes to view its diff. Files appear after you modify the tree or stage changes."
                workingTreeScope={selectedWorkingDiff?.scope}
                isKeyboardFocused={keyboardFocusZone === "diff"}
                onActivateKeyboardZone={() => setKeyboardFocusZone("diff")}
              />
            )}

            {selectedCommit && (
              <UnifiedDiffPanel
                title={`Commit Diff (${selectedCommit.shortHash})`}
                isLoading={commitDiffPanelLoading}
                isContentLoading={commitDiffContentLoading}
                errorMessage={
                  commitChangedFilesQuery.isError
                    ? normalizeAppError(commitChangedFilesQuery.error, {
                        message: "Failed to load commit file list",
                      }).message
                    : commitDiffQuery.isError
                      ? normalizeAppError(commitDiffQuery.error, {
                          message: "Failed to load commit diff",
                        }).message
                      : null
                }
                files={commitDiffFiles}
                selectedFilePath={selectedCommitDiffFilePath}
                onSelectFilePath={setSelectedCommitDiffFilePath}
                emptyMessage="No file changes in this commit. Choose another revision or clear selection to return to the working tree diff."
                isKeyboardFocused={keyboardFocusZone === "diff"}
                onActivateKeyboardZone={() => setKeyboardFocusZone("diff")}
              />
            )}
          </div>
        )}

        {!openRepositoryMutation.isPending &&
          !openRepositoryError &&
          !selectedRepository && (
            <div className="rounded-md border border-dashed border-subtle bg-base/50 p-4 text-sm">
              <p className="font-semibold text-primary">No repository open</p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                Use <span className="text-secondary">Open Repository</span> in the tab bar or pick a
                folder from <span className="text-secondary">Recent</span> in the sidebar.
              </p>
            </div>
          )}
      </main>

      <aside className="min-h-0 w-80 shrink-0 overflow-y-auto border-l border-subtle bg-sidebar p-4">
        <div className="flex min-h-0 flex-col gap-4">
          <SelectedCommitDetailPanel
            commit={selectedCommit}
            repositoryPath={selectedRepository?.rootPath ?? null}
            requestedRevertCommitHash={requestedRevertCommitHash}
            onRevertRequestHandled={() => setRequestedRevertCommitHash(null)}
          />
          {selectedRepository && (
            <CommitPanel
              stagedCount={stagedCount}
              commitMessage={commitMessage}
              commitError={commitError}
              commitSuccessMessage={commitSuccessMessage}
              commitFooterHint={commitFooterHint}
              isSubmitting={createCommitMutation.isPending}
              canCreateCommit={canCreateCommit}
              onCommitMessageChange={(value) => {
                setCommitSuccessMessage(null);
                setCommitError(null);
                setCommitMessage(value);
              }}
              onDismissCommitSuccess={() => setCommitSuccessMessage(null)}
              onSubmit={() => {
                void handleSubmitCommit();
              }}
              aiSuggestions={aiSuggestions}
              isGeneratingCommitMessage={generateCommitMessageMutation.isPending}
              generateCommitMessageError={aiGenerateError}
              showTruncatedDiffNotice={aiTruncatedDiff}
              allowSendStagedDiffToAi={allowStagedDiffForAi}
              onAllowSendStagedDiffToAiChange={setAllowStagedDiffForAi}
              onGenerateCommitMessage={() => {
                void handleGenerateCommitMessage();
              }}
              onSelectCommitMessageSuggestion={handleSelectCommitMessageSuggestion}
              isKeyboardFocused={keyboardFocusZone === "commit"}
              onActivateKeyboardZone={() => setKeyboardFocusZone("commit")}
            />
          )}
        </div>
      </aside>
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        commands={commandPaletteCommands}
        onClose={() => setIsCommandPaletteOpen(false)}
        onRestoreFocus={() => {
          const element = lastFocusedElementRef.current;
          if (element && document.contains(element)) {
            element.focus();
          }
        }}
      />
    </div>
  );
}