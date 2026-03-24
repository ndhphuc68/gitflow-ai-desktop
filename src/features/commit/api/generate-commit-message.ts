import { callTauri } from "../../../shared/api/tauri";
import { normalizeAppError } from "../../../shared/errors/normalize-app-error";
import {
  generateCommitMessageResponseDtoSchema,
  CommitMessageSuggestionDto,
} from "../types/generate-commit-message-dto";

type GenerateCommitMessageInput = {
  repositoryPath: string;
};

export type GenerateCommitMessageResult = {
  suggestions: CommitMessageSuggestionDto[];
  truncatedDiff: boolean;
};

export async function generateCommitMessage(
  input: GenerateCommitMessageInput
): Promise<GenerateCommitMessageResult> {
  const response = await callTauri("generate_commit_message", { input });
  const parsedResponse = generateCommitMessageResponseDtoSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw normalizeAppError(
      {
        code: "INVALID_RESPONSE",
        message: "Received invalid generate commit message response",
        recoverable: false,
        details: null,
      },
      {
        message: "Unexpected error while generating commit message",
      }
    );
  }

  const data = parsedResponse.data;
  if (!data.success) {
    throw normalizeAppError(data.error, {
      message: "Unexpected error while generating commit message",
    });
  }

  return {
    suggestions: data.suggestions,
    truncatedDiff: data.truncatedDiff,
  };
}
