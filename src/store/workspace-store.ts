import { create } from "zustand";

import { repositoryRootPathsEqual } from "../shared/utils/repository-path";

export type RepositoryTab = {
  id: string;
  name: string;
  rootPath: string;
  currentBranch?: string;
};

/** Snapshot from `open_repository` — avoids coupling the store to feature DTO types. */
export type OpenRepositorySnapshot = {
  name: string;
  rootPath: string;
  currentBranch: string;
};

type WorkspaceState = {
  openRepositoryTabs: RepositoryTab[];
  activeRepositoryId: string | null;
  openOrActivateTabFromRepository: (repository: OpenRepositorySnapshot) => void;
  setActiveRepositoryId: (id: string | null) => void;
  closeRepositoryTab: (id: string) => void;
  syncTabFromRepository: (repository: OpenRepositorySnapshot) => void;
};

function findTabIndexByRootPath(tabs: RepositoryTab[], rootPath: string): number {
  return tabs.findIndex((tab) => repositoryRootPathsEqual(tab.rootPath, rootPath));
}

function nextActiveIdAfterClose(tabs: RepositoryTab[], closedId: string): string | null {
  const idx = tabs.findIndex((tab) => tab.id === closedId);
  if (idx < 0) {
    return null;
  }
  const right = tabs[idx + 1];
  const left = tabs[idx - 1];
  return right?.id ?? left?.id ?? null;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  openRepositoryTabs: [],
  activeRepositoryId: null,

  openOrActivateTabFromRepository: (repository) => {
    set((state) => {
      const idx = findTabIndexByRootPath(state.openRepositoryTabs, repository.rootPath);
      const nextTab: RepositoryTab = {
        id: idx >= 0 ? state.openRepositoryTabs[idx].id : repository.rootPath,
        name: repository.name,
        rootPath: repository.rootPath,
        currentBranch: repository.currentBranch,
      };

      if (idx >= 0) {
        const openRepositoryTabs = [...state.openRepositoryTabs];
        openRepositoryTabs[idx] = nextTab;
        return {
          openRepositoryTabs,
          activeRepositoryId: nextTab.id,
        };
      }

      return {
        openRepositoryTabs: [...state.openRepositoryTabs, nextTab],
        activeRepositoryId: nextTab.id,
      };
    });
  },

  setActiveRepositoryId: (id) => {
    set((state) => {
      if (id === null) {
        return { activeRepositoryId: null };
      }
      const exists = state.openRepositoryTabs.some((tab) => tab.id === id);
      return { activeRepositoryId: exists ? id : state.activeRepositoryId };
    });
  },

  closeRepositoryTab: (id) => {
    set((state) => {
      const openRepositoryTabs = state.openRepositoryTabs.filter((tab) => tab.id !== id);
      if (openRepositoryTabs.length === 0) {
        return { openRepositoryTabs, activeRepositoryId: null };
      }
      if (state.activeRepositoryId !== id) {
        return { openRepositoryTabs, activeRepositoryId: state.activeRepositoryId };
      }
      const nextActiveId = nextActiveIdAfterClose(state.openRepositoryTabs, id);
      const resolvedNext =
        nextActiveId && openRepositoryTabs.some((tab) => tab.id === nextActiveId)
          ? nextActiveId
          : openRepositoryTabs[0]?.id ?? null;
      return { openRepositoryTabs, activeRepositoryId: resolvedNext };
    });
  },

  syncTabFromRepository: (repository) => {
    set((state) => {
      const idx = findTabIndexByRootPath(state.openRepositoryTabs, repository.rootPath);
      if (idx < 0) {
        return state;
      }
      const openRepositoryTabs = [...state.openRepositoryTabs];
      const prev = openRepositoryTabs[idx];
      openRepositoryTabs[idx] = {
        ...prev,
        name: repository.name,
        rootPath: repository.rootPath,
        currentBranch: repository.currentBranch,
      };
      return { openRepositoryTabs };
    });
  },
}));

export function repositoryTabToDto(tab: RepositoryTab): OpenRepositorySnapshot {
  return {
    name: tab.name,
    rootPath: tab.rootPath,
    currentBranch: tab.currentBranch ?? "",
  };
}
