import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createCommit } from "../api/create-commit";

type UseCreateCommitInput = {
  repositoryPath: string | null;
};

export function useCreateCommit(input: UseCreateCommitInput) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: string) =>
      createCommit({
        repositoryPath: input.repositoryPath ?? "",
        message,
      }),
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["repository-status", input.repositoryPath],
      });
    },
  });
}
