import { callTauri } from "../../../shared/api/tauri";
import { normalizeAppError } from "../../../shared/errors/normalize-app-error";
import { stageFilesResponseDtoSchema } from "../types/stage-files-dto";

type StageFilesInput = {
  repositoryPath: string;
  filePaths: string[];
};

export async function stageFiles(input: StageFilesInput): Promise<void> {
  const response = await callTauri("stage_files", { input });
  const parsedResponse = stageFilesResponseDtoSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw normalizeAppError(
      {
        code: "INVALID_RESPONSE",
        message: "Received invalid stage files response",
        recoverable: false,
        details: null,
      },
      {
        message: "Unexpected error while staging files",
      }
    );
  }

  if (!parsedResponse.data.success || parsedResponse.data.error) {
    throw normalizeAppError(
      parsedResponse.data.error ?? {
        code: "STAGE_FILES_FAILED",
        message: "Failed to stage files",
        recoverable: true,
        details: null,
      },
      {
        message: "Unexpected error while staging files",
      }
    );
  }
}
