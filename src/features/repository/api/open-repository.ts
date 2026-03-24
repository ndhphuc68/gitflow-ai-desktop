import { callTauri } from "../../../shared/api/tauri";
import { normalizeAppError } from "../../../shared/errors/normalize-app-error";
import type { AppError } from "../../../shared/types/app-error";
import {
  openRepositoryResponseDtoSchema,
  type RepositoryDto,
} from "../types/repository-dto";

type OpenRepositoryInput = {
  folderPath: string;
};

export type OpenRepositoryResult = {
  repository: RepositoryDto;
  recentsPersistError: AppError | null;
};

export async function openRepository(
  input: OpenRepositoryInput
): Promise<OpenRepositoryResult> {
  const response = await callTauri("open_repository", { input });
  const parsedResponse = openRepositoryResponseDtoSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw normalizeAppError(
      {
        code: "INVALID_RESPONSE",
        message: "Received invalid repository response",
        recoverable: false,
        details: null,
      },
      {
        message: "Unexpected error while opening repository",
      }
    );
  }

  if (parsedResponse.data.error) {
    throw normalizeAppError(parsedResponse.data.error, {
      message: "Unexpected error while opening repository",
    });
  }

  if (!parsedResponse.data.repository) {
    throw normalizeAppError(
      {
        code: "MISSING_REPOSITORY_DATA",
        message: "Repository metadata is missing from response",
        recoverable: false,
        details: null,
      },
      {
        message: "Unexpected error while opening repository",
      }
    );
  }

  const rawPersist = parsedResponse.data.recentsPersistError;
  const recentsPersistError = rawPersist
    ? normalizeAppError(rawPersist, {
        message: "Could not update recent repositories list",
      })
    : null;

  return {
    repository: parsedResponse.data.repository,
    recentsPersistError,
  };
}
