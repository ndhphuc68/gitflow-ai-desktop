import { useQuery } from "@tanstack/react-query";

import { getCommitChangedFiles } from "../api/get-commit-changed-files";

type UseCommitChangedFilesInput = {
  repositoryPath: string | null;
  commitHash: string | null;
};

export function useCommitChangedFiles(input: UseCommitChangedFilesInput) {
  return useQuery({
    queryKey: ["commit-changed-files", input.repositoryPath, input.commitHash],
    queryFn: () =>
      getCommitChangedFiles({
        repositoryPath: input.repositoryPath ?? "",
        commitHash: input.commitHash ?? "",
      }),
    enabled: Boolean(input.repositoryPath && input.commitHash),
  });
}
