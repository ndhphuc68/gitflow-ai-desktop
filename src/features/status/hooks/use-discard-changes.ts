import { useMutation, useQueryClient } from "@tanstack/react-query";

import { discardChanges } from "../api/discard-changes";

type UseDiscardChangesInput = {
  repositoryPath: string | null;
};

export function useDiscardChanges(input: UseDiscardChangesInput) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filePaths: string[]) =>
      discardChanges({
        repositoryPath: input.repositoryPath ?? "",
        filePaths,
      }),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["repository-status", input.repositoryPath],
        }),
        queryClient.invalidateQueries({
          queryKey: ["working-diff", input.repositoryPath],
        }),
      ]);
    },
  });
}
