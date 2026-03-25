import type { Commit } from "../history/entities/commit";
import type { BranchDto } from "../branch/types/branch-dto";
import type { RecentRepositoryDto } from "../repository/types/recent-repository-dto";
import type { RepositoryTab } from "../../store/workspace-store";
import type { WorkingDiffSelection } from "../diff/types/working-diff-selection";

import type { CommandItem } from "./types/command";

export type CommandPaletteContext = {
  hasRepositoryOpen: boolean;

  // Data for dynamic navigation/search items
  openRepositoryTabs: RepositoryTab[];
  activeRepositoryId: string | null;
  recentRepositories: RecentRepositoryDto[];
  branches: BranchDto[];
  commits: Commit[];

  selectedCommitHash: string | null;
  selectedWorkingDiff: WorkingDiffSelection | null;

  // Core handlers (wired from App)
  openRepositoryDialog: () => void;
  refreshAll: () => void;
  focusPanel: (zone: "history" | "workingChanges" | "diff" | "commit") => void;

  switchRepositoryTab: (repositoryId: string) => void;
  openRecentRepository: (rootPath: string) => void;
  checkoutBranch: (branchName: string) => void;
  selectCommit: (hash: string) => void;

  commitNow: () => void;
  requestRevertSelectedCommit: () => void;
  requestDiscardSelectedUnstagedFile: () => void;
};

export function buildCommandRegistry(ctx: CommandPaletteContext): CommandItem[] {
  const commands: CommandItem[] = [];

  // Actions
  commands.push({
    id: "action.openRepository",
    title: "Open Repository",
    subtitle: "Choose a folder and open it as a Git repository",
    category: "action",
    handler: ctx.openRepositoryDialog,
  });

  commands.push({
    id: "action.refreshStatus",
    title: "Refresh Status",
    subtitle: ctx.hasRepositoryOpen ? "Reload repository queries" : "No repository open",
    category: "action",
    handler: ctx.refreshAll,
  });

  commands.push({
    id: "action.commit",
    title: "Commit",
    subtitle: "Commit staged changes (focus Commit panel)",
    category: "action",
    handler: () => {
      ctx.focusPanel("commit");
      ctx.commitNow();
    },
  });

  commands.push({
    id: "action.revertCommit",
    title: "Revert Commit",
    subtitle: ctx.selectedCommitHash ? "Open confirmation for selected commit" : "Select a commit first",
    category: "action",
    handler: () => {
      ctx.focusPanel("history");
      ctx.requestRevertSelectedCommit();
    },
  });

  commands.push({
    id: "action.discardChanges",
    title: "Discard Changes",
    subtitle:
      ctx.selectedWorkingDiff?.scope === "unstaged"
        ? "Open confirmation for selected unstaged file"
        : "Select an unstaged file first",
    category: "action",
    handler: () => {
      ctx.focusPanel("workingChanges");
      ctx.requestDiscardSelectedUnstagedFile();
    },
  });

  // Navigation: focus panels
  commands.push(
    {
      id: "nav.focus.history",
      title: "Focus: Commit History",
      category: "navigation",
      handler: () => ctx.focusPanel("history"),
    },
    {
      id: "nav.focus.workingChanges",
      title: "Focus: Working Changes",
      category: "navigation",
      handler: () => ctx.focusPanel("workingChanges"),
    },
    {
      id: "nav.focus.diff",
      title: "Focus: Diff",
      category: "navigation",
      handler: () => ctx.focusPanel("diff"),
    },
    {
      id: "nav.focus.commit",
      title: "Focus: Commit",
      category: "navigation",
      handler: () => ctx.focusPanel("commit"),
    }
  );

  // Navigation: repositories
  for (const tab of ctx.openRepositoryTabs) {
    commands.push({
      id: `nav.switchRepositoryTab.${tab.id}`,
      title: `Switch Repository: ${tab.name}`,
      subtitle: tab.rootPath,
      category: "navigation",
      handler: () => ctx.switchRepositoryTab(tab.id),
    });
  }

  for (const recent of ctx.recentRepositories) {
    commands.push({
      id: `search.repository.recent.${recent.rootPath}`,
      title: `Open Recent: ${recent.name}`,
      subtitle: recent.rootPath,
      category: "search",
      handler: () => ctx.openRecentRepository(recent.rootPath),
    });
  }

  // Navigation: branches
  for (const branch of ctx.branches) {
    commands.push({
      id: `nav.switchBranch.${branch.name}`,
      title: `Switch Branch: ${branch.name}`,
      subtitle: branch.isCurrent ? "Current branch" : undefined,
      category: "navigation",
      handler: () => ctx.checkoutBranch(branch.name),
    });
  }

  // Search: commits (basic message search)
  for (const commit of ctx.commits) {
    commands.push({
      id: `search.commit.${commit.hash}`,
      title: commit.subject,
      subtitle: `${commit.shortHash} · ${commit.authorName}`,
      category: "search",
      handler: () => ctx.selectCommit(commit.hash),
    });
  }

  return commands;
}

