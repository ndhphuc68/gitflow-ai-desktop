import { useMutation, useQueryClient } from "@tanstack/react-query";

import { stageFiles } from "../api/stage-files";

type UseStageFilesInput = {
  repositoryPath: string | null;
};

export function useStageFiles(input: UseStageFilesInput) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filePaths: string[]) =>
      stageFiles({
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
