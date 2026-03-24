import { useQuery } from "@tanstack/react-query";

import { getRepositoryStatus } from "../api/get-repository-status";

export function useRepositoryStatus(repositoryPath: string | null) {
  return useQuery({
    queryKey: ["repository-status", repositoryPath],
    queryFn: () => getRepositoryStatus({ repositoryPath: repositoryPath ?? "" }),
    enabled: Boolean(repositoryPath),
  });
}
