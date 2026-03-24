import { callTauri } from "../../../shared/api/tauri";
import { normalizeAppError } from "../../../shared/errors/normalize-app-error";
import { commitChangedSummaryToDiffFile, DiffFile } from "../entities/diff";
import { listCommitChangedFilesResponseDtoSchema } from "../types/diff-dto";

type GetCommitChangedFilesInput = {
  repositoryPath: string;
  commitHash: string;
};

export async function getCommitChangedFiles(
  input: GetCommitChangedFilesInput
): Promise<DiffFile[]> {
  const response = await callTauri("list_commit_changed_files", { input });
  const parsedResponse = listCommitChangedFilesResponseDtoSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw normalizeAppError(
      {
        code: "INVALID_RESPONSE",
        message: "Received invalid commit changed-files response",
        recoverable: false,
        details: null,
      },
      {
        message: "Unexpected error while loading commit file list",
      }
    );
  }

  if (parsedResponse.data.error) {
    throw normalizeAppError(parsedResponse.data.error, {
      message: "Unexpected error while loading commit file list",
    });
  }

  const files = parsedResponse.data.files ?? [];
  return files.map((row) => commitChangedSummaryToDiffFile(row));
}
