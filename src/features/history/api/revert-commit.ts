import { callTauri } from "../../../shared/api/tauri";
import { normalizeAppError } from "../../../shared/errors/normalize-app-error";
import { revertCommitResponseDtoSchema } from "../types/revert-commit-dto";

type RevertCommitInput = {
  repositoryPath: string;
  commitHash: string;
};

export async function revertCommit(input: RevertCommitInput): Promise<string | null> {
  const response = await callTauri("revert_commit", { input });
  const parsedResponse = revertCommitResponseDtoSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw normalizeAppError(
      {
        code: "INVALID_RESPONSE",
        message: "Received invalid revert commit response",
        recoverable: false,
        details: null,
      },
      {
        message: "Unexpected error while reverting commit",
      }
    );
  }

  if (!parsedResponse.data.success || parsedResponse.data.error) {
    throw normalizeAppError(
      parsedResponse.data.error ?? {
        code: "REVERT_COMMIT_FAILED",
        message: "Failed to revert commit",
        recoverable: true,
        details: null,
      },
      {
        message: "Unexpected error while reverting commit",
      }
    );
  }

  return parsedResponse.data.message ?? null;
}
