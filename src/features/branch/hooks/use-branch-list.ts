import { useQuery } from "@tanstack/react-query";

import { listBranches } from "../api/list-branches";

export function useBranchList(repositoryPath: string | null) {
  return useQuery({
    queryKey: ["repository-branches", repositoryPath],
    queryFn: () => listBranches({ repositoryPath: repositoryPath ?? "" }),
    enabled: Boolean(repositoryPath),
  });
}
