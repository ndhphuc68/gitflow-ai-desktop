import { callTauri } from "../../../shared/api/tauri";
import { normalizeAppError } from "../../../shared/errors/normalize-app-error";
import { discardChangesResponseDtoSchema } from "../types/discard-changes-dto";

type DiscardChangesInput = {
  repositoryPath: string;
  filePaths: string[];
};

export async function discardChanges(input: DiscardChangesInput): Promise<string | null> {
  const response = await callTauri("discard_changes", { input });
  const parsedResponse = discardChangesResponseDtoSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw normalizeAppError(
      {
        code: "INVALID_RESPONSE",
        message: "Received invalid discard changes response",
        recoverable: false,
        details: null,
      },
      {
        message: "Unexpected error while discarding changes",
      }
    );
  }

  if (!parsedResponse.data.success || parsedResponse.data.error) {
    throw normalizeAppError(
      parsedResponse.data.error ?? {
        code: "DISCARD_CHANGES_FAILED",
        message: "Failed to discard changes",
        recoverable: true,
        details: null,
      },
      {
        message: "Unexpected error while discarding changes",
      }
    );
  }

  return parsedResponse.data.message ?? null;
}
