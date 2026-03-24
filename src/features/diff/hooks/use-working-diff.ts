import { useQuery } from "@tanstack/react-query";

import { getWorkingDiff } from "../api/get-working-diff";

type UseWorkingDiffInput = {
  repositoryPath: string | null;
  filePath: string | null;
};

export function useWorkingDiff(input: UseWorkingDiffInput) {
  return useQuery({
    queryKey: ["working-diff", input.repositoryPath, input.filePath],
    queryFn: () =>
      getWorkingDiff({
        repositoryPath: input.repositoryPath ?? "",
        filePath: input.filePath ?? "",
      }),
    enabled: Boolean(input.repositoryPath && input.filePath),
  });
}
