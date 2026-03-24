import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createBranch } from "../api/create-branch";

type UseCreateBranchInput = {
  repositoryPath: string | null;
};

export function useCreateBranch(input: UseCreateBranchInput) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (branchName: string) =>
      createBranch({
        repositoryPath: input.repositoryPath ?? "",
        branchName,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["repository-branches", input.repositoryPath],
        }),
        queryClient.invalidateQueries({
          queryKey: ["repository-status", input.repositoryPath],
        }),
      ]);
    },
  });
}
