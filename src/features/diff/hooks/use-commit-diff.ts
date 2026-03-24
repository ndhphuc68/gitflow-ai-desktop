import { useQuery } from "@tanstack/react-query";

import { getCommitDiff } from "../api/get-commit-diff";

type UseCommitDiffInput = {
  repositoryPath: string | null;
  commitHash: string | null;
  filePath: string | null;
  /** When false, skips the query (e.g. until the changed-file list has loaded). */
  enabled?: boolean;
};

export function useCommitDiff(input: UseCommitDiffInput) {
  const filePathTrimmed = input.filePath?.trim() ?? "";
  const baseEnabled =
    Boolean(input.repositoryPath && input.commitHash) && filePathTrimmed.length > 0;
  const enabled = (input.enabled ?? true) && baseEnabled;

  return useQuery({
    queryKey: ["commit-diff", input.repositoryPath, input.commitHash, filePathTrimmed],
    queryFn: () =>
      getCommitDiff({
        repositoryPath: input.repositoryPath ?? "",
        commitHash: input.commitHash ?? "",
        filePath: filePathTrimmed,
      }),
    enabled,
  });
}
