import { callTauri } from "../../../shared/api/tauri";
import { normalizeAppError } from "../../../shared/errors/normalize-app-error";
import { checkoutBranchResponseDtoSchema } from "../types/branch-dto";

type CheckoutBranchInput = {
  repositoryPath: string;
  branchName: string;
};

export async function checkoutBranch(input: CheckoutBranchInput): Promise<void> {
  const response = await callTauri("checkout_branch", { input });
  const parsedResponse = checkoutBranchResponseDtoSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw normalizeAppError(
      {
        code: "INVALID_RESPONSE",
        message: "Received invalid checkout branch response",
        recoverable: false,
        details: null,
      },
      {
        message: "Unexpected error while checking out branch",
      }
    );
  }

  if (!parsedResponse.data.success || parsedResponse.data.error) {
    throw normalizeAppError(
      parsedResponse.data.error ?? {
        code: "CHECKOUT_BRANCH_FAILED",
        message: "Failed to checkout branch",
        recoverable: true,
        details: null,
      },
      {
        message: "Unexpected error while checking out branch",
      }
    );
  }
}
