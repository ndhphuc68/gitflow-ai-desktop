import { callTauri } from "../../../shared/api/tauri";
import { normalizeAppError } from "../../../shared/errors/normalize-app-error";
import { Commit, toCommit } from "../entities/commit";
import { getCommitHistoryResponseDtoSchema } from "../types/commit-history-dto";

type GetCommitHistoryInput = {
  repositoryPath: string;
  limit?: number;
};

export async function getCommitHistory(input: GetCommitHistoryInput): Promise<Commit[]> {
  const response = await callTauri("get_commit_history", { input });
  const parsedResponse = getCommitHistoryResponseDtoSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw normalizeAppError(
      {
        code: "INVALID_RESPONSE",
        message: "Received invalid commit history response",
        recoverable: false,
        details: null,
      },
      {
        message: "Unexpected error while loading commit history",
      }
    );
  }

  if (parsedResponse.data.error) {
    throw normalizeAppError(parsedResponse.data.error, {
      message: "Unexpected error while loading commit history",
    });
  }

  return (parsedResponse.data.commits ?? []).map(toCommit);
}
