import { useMutation } from "@tanstack/react-query";

import { generateCommitMessage } from "../api/generate-commit-message";

type UseGenerateCommitMessageInput = {
  repositoryPath: string | null;
};

export function useGenerateCommitMessage(input: UseGenerateCommitMessageInput) {
  return useMutation({
    mutationFn: () =>
      generateCommitMessage({
        repositoryPath: input.repositoryPath ?? "",
      }),
  });
}
