import { z } from "zod";

import { appErrorSchema } from "../../../shared/types/app-error";

export const createCommitResponseDtoSchema = z.object({
  success: z.boolean(),
  error: appErrorSchema.nullable(),
});
