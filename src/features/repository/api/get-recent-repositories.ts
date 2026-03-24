import { callTauri } from "../../../shared/api/tauri";
import { normalizeAppError } from "../../../shared/errors/normalize-app-error";
import {
  getRecentRepositoriesResponseDtoSchema,
  type RecentRepositoryDto,
} from "../types/recent-repository-dto";

export async function getRecentRepositories(): Promise<RecentRepositoryDto[]> {
  const response = await callTauri("get_recent_repositories", {});
  const parsedResponse = getRecentRepositoriesResponseDtoSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw normalizeAppError(
      {
        code: "INVALID_RESPONSE",
        message: "Received invalid recent repositories response",
        recoverable: false,
        details: null,
      },
      {
        message: "Unexpected error while loading recent repositories",
      }
    );
  }

  if (parsedResponse.data.error) {
    throw normalizeAppError(parsedResponse.data.error, {
      message: "Unexpected error while loading recent repositories",
    });
  }

  return parsedResponse.data.repositories ?? [];
}
