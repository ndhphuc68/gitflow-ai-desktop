import { z } from "zod";

import { appErrorSchema } from "../../../shared/types/app-error";

export const stageFilesResponseDtoSchema = z.object({
  success: z.boolean(),
  error: appErrorSchema.nullable(),
});

export const unstageFilesResponseDtoSchema = z.object({
  success: z.boolean(),
  error: appErrorSchema.nullable(),
});
