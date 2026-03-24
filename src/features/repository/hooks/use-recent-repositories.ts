import { useQuery } from "@tanstack/react-query";

import { getRecentRepositories } from "../api/get-recent-repositories";

export const recentRepositoriesQueryKey = ["recent-repositories"] as const;

export function useRecentRepositories() {
  return useQuery({
    queryKey: recentRepositoriesQueryKey,
    queryFn: getRecentRepositories,
    staleTime: 60_000,
  });
}
