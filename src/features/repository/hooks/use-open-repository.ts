import { useMutation, useQueryClient } from "@tanstack/react-query";

import { openRepository, type OpenRepositoryResult } from "../api/open-repository";

import { recentRepositoriesQueryKey } from "./use-recent-repositories";

export function useOpenRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { folderPath: string }): Promise<OpenRepositoryResult> =>
      openRepository(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recentRepositoriesQueryKey });
    },
  });
}
