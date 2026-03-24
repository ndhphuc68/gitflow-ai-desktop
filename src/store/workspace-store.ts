import { create } from "zustand";

type WorkspaceState = {
  selectedRepositoryPath: string | null;
  setSelectedRepositoryPath: (path: string | null) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedRepositoryPath: null,
  setSelectedRepositoryPath: (path) => set({ selectedRepositoryPath: path }),
}));