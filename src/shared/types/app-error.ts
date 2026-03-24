import { z } from "zod";

export const appErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.string().nullable().optional(),
  recoverable: z.boolean(),
});

export type AppError = z.infer<typeof appErrorSchema>;
