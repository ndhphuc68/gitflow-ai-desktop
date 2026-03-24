import { callTauri } from "../../../shared/api/tauri";
import { normalizeAppError } from "../../../shared/errors/normalize-app-error";
import { removeRecentRepositoryResponseDtoSchema } from "../types/recent-repository-dto";

type RemoveRecentRepositoryInput = {
  rootPath: string;
};

export async function removeRecentRepository(
  input: RemoveRecentRepositoryInput
): Promise<void> {
  const response = await callTauri("remove_recent_repository", { input });
  const parsedResponse = removeRecentRepositoryResponseDtoSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw normalizeAppError(
      {
        code: "INVALID_RESPONSE",
        message: "Received invalid remove recent repository response",
        recoverable: false,
        details: null,
      },
      {
        message: "Unexpected error while removing recent repository",
      }
    );
  }

  if (parsedResponse.data.error) {
    throw normalizeAppError(parsedResponse.data.error, {
      message: "Unexpected error while removing recent repository",
    });
  }

  if (!parsedResponse.data.success) {
    throw normalizeAppError(
      {
        code: "REMOVE_RECENT_FAILED",
        message: "Remove recent repository did not succeed",
        recoverable: true,
        details: null,
      },
      {
        message: "Unexpected error while removing recent repository",
      }
    );
  }
}
