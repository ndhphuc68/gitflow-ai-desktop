import { z } from "zod";

import { appErrorSchema } from "../../../shared/types/app-error";

export const commitMessageSuggestionDtoSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
});

export type CommitMessageSuggestionDto = z.infer<typeof commitMessageSuggestionDtoSchema>;

const generateCommitMessageSuccessDtoSchema = z.object({
  success: z.literal(true),
  suggestions: z.array(commitMessageSuggestionDtoSchema).min(1),
  truncatedDiff: z.boolean(),
  error: z.null(),
});

const generateCommitMessageFailureDtoSchema = z.object({
  success: z.literal(false),
  suggestions: z.null(),
  truncatedDiff: z.boolean(),
  error: appErrorSchema,
});

export const generateCommitMessageResponseDtoSchema = z.discriminatedUnion("success", [
  generateCommitMessageSuccessDtoSchema,
  generateCommitMessageFailureDtoSchema,
]);

export type GenerateCommitMessageResponseDto = z.infer<typeof generateCommitMessageResponseDtoSchema>;
