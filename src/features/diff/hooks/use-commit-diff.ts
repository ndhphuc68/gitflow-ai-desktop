import { useQuery } from "@tanstack/react-query";

import { getCommitDiff } from "../api/get-commit-diff";

type UseCommitDiffInput = {
  repositoryPath: string | null;
  commitHash: string | null;
  filePath?: string | null;
};

export function useCommitDiff(input: UseCommitDiffInput) {
  return useQuery({
    queryKey: ["commit-diff", input.repositoryPath, input.commitHash],
    queryFn: () =>
      getCommitDiff({
        repositoryPath: input.repositoryPath ?? "",
        commitHash: input.commitHash ?? "",
        filePath: input.filePath ?? undefined,
      }),
    enabled: Boolean(input.repositoryPath && input.commitHash),
  });
}
