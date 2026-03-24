import { useQuery } from "@tanstack/react-query";

import { getCommitHistory } from "../api/get-commit-history";

type UseCommitHistoryInput = {
  repositoryPath: string | null;
  limit?: number;
};

export function useCommitHistory(input: UseCommitHistoryInput) {
  return useQuery({
    queryKey: ["repository-history", input.repositoryPath, input.limit ?? 50],
    queryFn: () =>
      getCommitHistory({
        repositoryPath: input.repositoryPath ?? "",
        limit: input.limit ?? 50,
      }),
    enabled: Boolean(input.repositoryPath),
  });
}
