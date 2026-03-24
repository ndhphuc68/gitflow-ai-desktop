import { callTauri } from "../../../shared/api/tauri";
import { normalizeAppError } from "../../../shared/errors/normalize-app-error";
import { unstageFilesResponseDtoSchema } from "../types/stage-files-dto";

type UnstageFilesInput = {
  repositoryPath: string;
  filePaths: string[];
};

export async function unstageFiles(input: UnstageFilesInput): Promise<void> {
  const response = await callTauri("unstage_files", { input });
  const parsedResponse = unstageFilesResponseDtoSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw normalizeAppError(
      {
        code: "INVALID_RESPONSE",
        message: "Received invalid unstage files response",
        recoverable: false,
        details: null,
      },
      {
        message: "Unexpected error while unstaging files",
      }
    );
  }

  if (!parsedResponse.data.success || parsedResponse.data.error) {
    throw normalizeAppError(
      parsedResponse.data.error ?? {
        code: "UNSTAGE_FILES_FAILED",
        message: "Failed to unstage files",
        recoverable: true,
        details: null,
      },
      {
        message: "Unexpected error while unstaging files",
      }
    );
  }
}
