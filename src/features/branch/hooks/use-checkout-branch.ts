import { useMutation, useQueryClient } from "@tanstack/react-query";

import { checkoutBranch } from "../api/checkout-branch";

type UseCheckoutBranchInput = {
  repositoryPath: string | null;
};

export function useCheckoutBranch(input: UseCheckoutBranchInput) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (branchName: string) =>
      checkoutBranch({
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
