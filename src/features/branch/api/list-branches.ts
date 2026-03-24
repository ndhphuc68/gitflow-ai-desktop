import { callTauri } from "../../../shared/api/tauri";
import { normalizeAppError } from "../../../shared/errors/normalize-app-error";
import { BranchDto, listBranchesResponseDtoSchema } from "../types/branch-dto";

type ListBranchesInput = {
  repositoryPath: string;
};

export async function listBranches(input: ListBranchesInput): Promise<BranchDto[]> {
  const response = await callTauri("list_branches", { input });
  const parsedResponse = listBranchesResponseDtoSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw normalizeAppError(
      {
        code: "INVALID_RESPONSE",
        message: "Received invalid list branches response",
        recoverable: false,
        details: null,
      },
      {
        message: "Unexpected error while loading branches",
      }
    );
  }

  if (parsedResponse.data.error) {
    throw normalizeAppError(parsedResponse.data.error, {
      message: "Unexpected error while loading branches",
    });
  }

  return parsedResponse.data.branches ?? [];
}
