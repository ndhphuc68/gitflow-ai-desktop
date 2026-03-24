import { RepositoryFileStatusDto, RepositoryStatusEntryDto } from "../types/repository-status-dto";

export type RepositoryFileStatus =
  | "modified"
  | "added"
  | "deleted"
  | "untracked"
  | "conflicted";

export type RepositoryStatusGroup = "staged" | "unstaged" | "untracked" | "conflicted";

export type RepositoryStatusEntry = {
  path: string;
  status: RepositoryFileStatus;
  staged: boolean;
  group: RepositoryStatusGroup;
};

export function toRepositoryStatusEntry(
  entryDto: RepositoryStatusEntryDto
): RepositoryStatusEntry {
  const status = mapStatus(entryDto.status);
  return {
    path: entryDto.path,
    status,
    staged: entryDto.staged,
    group: resolveGroup(status, entryDto.staged),
  };
}

function mapStatus(statusDto: RepositoryFileStatusDto): RepositoryFileStatus {
  switch (statusDto) {
    case "Modified":
      return "modified";
    case "Added":
      return "added";
    case "Deleted":
      return "deleted";
    case "Untracked":
      return "untracked";
    case "Conflicted":
      return "conflicted";
    default:
      return "modified";
  }
}

function resolveGroup(
  status: RepositoryFileStatus,
  staged: boolean
): RepositoryStatusGroup {
  if (status === "conflicted") {
    return "conflicted";
  }
  if (status === "untracked") {
    return "untracked";
  }
  return staged ? "staged" : "unstaged";
}
