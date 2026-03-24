import { z } from "zod";

import { appErrorSchema } from "../../../shared/types/app-error";

export const revertCommitResponseDtoSchema = z.object({
  success: z.boolean(),
  message: z.string().nullable().optional(),
  error: appErrorSchema.nullable(),
});

export type RevertCommitResponseDto = z.infer<typeof revertCommitResponseDtoSchema>;
