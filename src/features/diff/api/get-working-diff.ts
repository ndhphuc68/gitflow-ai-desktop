import { callTauri } from "../../../shared/api/tauri";
import { normalizeAppError } from "../../../shared/errors/normalize-app-error";
import { DiffFile, toDiffFile } from "../entities/diff";
import { getDiffResponseDtoSchema } from "../types/diff-dto";
import {
  normalizeWorkingTreeFilePath,
  type WorkingDiffScope,
} from "../types/working-diff-selection";

type GetWorkingDiffInput = {
  repositoryPath: string;
  filePath: string;
  scope: WorkingDiffScope;
};

export async function getWorkingDiff(input: GetWorkingDiffInput): Promise<DiffFile[]> {
  const response = await callTauri("get_working_diff", {
    input: {
      ...input,
      filePath: normalizeWorkingTreeFilePath(input.filePath),
    },
  });
  const parsedResponse = getDiffResponseDtoSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw normalizeAppError(
      {
        code: "INVALID_RESPONSE",
        message: "Received invalid working diff response",
        recoverable: false,
        details: null,
      },
      {
        message: "Unexpected error while loading working diff",
      }
    );
  }

  if (parsedResponse.data.error) {
    throw normalizeAppError(parsedResponse.data.error, {
      message: "Unexpected error while loading working diff",
    });
  }

  return (parsedResponse.data.files ?? []).map(toDiffFile);
}
