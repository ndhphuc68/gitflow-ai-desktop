import { callTauri } from "../../../shared/api/tauri";
import { normalizeAppError } from "../../../shared/errors/normalize-app-error";
import { toRepositoryStatusEntry, RepositoryStatusEntry } from "../entities/repository-status";
import { getRepositoryStatusResponseDtoSchema } from "../types/repository-status-dto";

type GetRepositoryStatusInput = {
  repositoryPath: string;
};

export async function getRepositoryStatus(
  input: GetRepositoryStatusInput
): Promise<RepositoryStatusEntry[]> {
  const response = await callTauri("get_repository_status", { input });
  const parsedResponse = getRepositoryStatusResponseDtoSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw normalizeAppError(
      {
        code: "INVALID_RESPONSE",
        message: "Received invalid repository status response",
        recoverable: false,
        details: null,
      },
      {
        message: "Unexpected error while loading repository status",
      }
    );
  }

  if (parsedResponse.data.error) {
    throw normalizeAppError(parsedResponse.data.error, {
      message: "Unexpected error while loading repository status",
    });
  }

  return (parsedResponse.data.entries ?? []).map(toRepositoryStatusEntry);
}
