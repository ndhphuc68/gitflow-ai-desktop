import { useMutation, useQueryClient } from "@tanstack/react-query";

import { revertCommit } from "../api/revert-commit";

type UseRevertCommitInput = {
  repositoryPath: string | null;
};

export function useRevertCommit(input: UseRevertCommitInput) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commitHash: string) =>
      revertCommit({
        repositoryPath: input.repositoryPath ?? "",
        commitHash,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["repository-history", input.repositoryPath],
        }),
        queryClient.invalidateQueries({
          queryKey: ["repository-status", input.repositoryPath],
        }),
      ]);
    },
  });
}
