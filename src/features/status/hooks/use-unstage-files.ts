import { useMutation, useQueryClient } from "@tanstack/react-query";

import { unstageFiles } from "../api/unstage-files";

type UseUnstageFilesInput = {
  repositoryPath: string | null;
};

export function useUnstageFiles(input: UseUnstageFilesInput) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filePaths: string[]) =>
      unstageFiles({
        repositoryPath: input.repositoryPath ?? "",
        filePaths,
      }),
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["repository-status", input.repositoryPath],
      });
    },
  });
}
