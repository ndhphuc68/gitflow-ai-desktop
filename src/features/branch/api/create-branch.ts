import { callTauri } from "../../../shared/api/tauri";
import { normalizeAppError } from "../../../shared/errors/normalize-app-error";
import { createBranchResponseDtoSchema } from "../types/branch-dto";

type CreateBranchInput = {
  repositoryPath: string;
  branchName: string;
};

export async function createBranch(input: CreateBranchInput): Promise<void> {
  const response = await callTauri("create_branch", { input });
  const parsedResponse = createBranchResponseDtoSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw normalizeAppError(
      {
        code: "INVALID_RESPONSE",
        message: "Received invalid create branch response",
        recoverable: false,
        details: null,
      },
      {
        message: "Unexpected error while creating branch",
      }
    );
  }

  if (!parsedResponse.data.success || parsedResponse.data.error) {
    throw normalizeAppError(
      parsedResponse.data.error ?? {
        code: "CREATE_BRANCH_FAILED",
        message: "Failed to create branch",
        recoverable: true,
        details: null,
      },
      {
        message: "Unexpected error while creating branch",
      }
    );
  }
}
