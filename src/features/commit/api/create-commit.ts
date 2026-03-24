import { callTauri } from "../../../shared/api/tauri";
import { normalizeAppError } from "../../../shared/errors/normalize-app-error";
import { createCommitResponseDtoSchema } from "../types/create-commit-dto";

type CreateCommitInput = {
  repositoryPath: string;
  message: string;
};

export async function createCommit(input: CreateCommitInput): Promise<void> {
  const response = await callTauri("create_commit", { input });
  const parsedResponse = createCommitResponseDtoSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw normalizeAppError(
      {
        code: "INVALID_RESPONSE",
        message: "Received invalid create commit response",
        recoverable: false,
        details: null,
      },
      {
        message: "Unexpected error while creating commit",
      }
    );
  }

  if (!parsedResponse.data.success || parsedResponse.data.error) {
    throw normalizeAppError(
      parsedResponse.data.error ?? {
        code: "CREATE_COMMIT_FAILED",
        message: "Failed to create commit",
        recoverable: true,
        details: null,
      },
      {
        message: "Unexpected error while creating commit",
      }
    );
  }
}
