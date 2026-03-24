import { useQuery } from "@tanstack/react-query";

import { getWorkingDiff } from "../api/get-working-diff";
import type { WorkingDiffSelection } from "../types/working-diff-selection";
import { workingDiffSelectionKey } from "../types/working-diff-selection";

type UseWorkingDiffInput = {
  repositoryPath: string | null;
  selection: WorkingDiffSelection | null;
};

export function useWorkingDiff(input: UseWorkingDiffInput) {
  return useQuery({
    queryKey: [
      "working-diff",
      input.repositoryPath,
      input.selection ? workingDiffSelectionKey(input.selection) : null,
    ],
    queryFn: () =>
      getWorkingDiff({
        repositoryPath: input.repositoryPath ?? "",
        filePath: input.selection?.path ?? "",
        scope: input.selection?.scope ?? "unstaged",
      }),
    enabled: Boolean(input.repositoryPath && input.selection?.path),
  });
}
