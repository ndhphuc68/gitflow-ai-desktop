import { useMutation, useQueryClient } from "@tanstack/react-query";

import { removeRecentRepository } from "../api/remove-recent-repository";

import { recentRepositoriesQueryKey } from "./use-recent-repositories";

export function useRemoveRecentRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeRecentRepository,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recentRepositoriesQueryKey });
    },
  });
}
