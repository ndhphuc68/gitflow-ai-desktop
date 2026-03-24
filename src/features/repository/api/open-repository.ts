import { callTauri } from "../../../shared/api/tauri";
import { normalizeAppError } from "../../../shared/errors/normalize-app-error";
import {
  openRepositoryResponseDtoSchema,
  type RepositoryDto,
} from "../types/repository-dto";

type OpenRepositoryInput = {
  folderPath: string;
};

export async function openRepository(
  input: OpenRepositoryInput
): Promise<RepositoryDto> {
  const response = await callTauri("open_repository", { input });
  const parsedResponse = openRepositoryResponseDtoSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw normalizeAppError({
      code: "INVALID_RESPONSE",
      message: "Received invalid repository response",
      recoverable: false,
    }, {
      message: "Unexpected error while opening repository",
    });
  }

  if (parsedResponse.data.error) {
    throw normalizeAppError(parsedResponse.data.error, {
      message: "Unexpected error while opening repository",
    });
  }

  if (!parsedResponse.data.repository) {
    throw normalizeAppError({
      code: "MISSING_REPOSITORY_DATA",
      message: "Repository metadata is missing from response",
      recoverable: false,
    }, {
      message: "Unexpected error while opening repository",
    });
  }

  return parsedResponse.data.repository;
}
