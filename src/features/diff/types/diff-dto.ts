import { z } from "zod";

import { appErrorSchema } from "../../../shared/types/app-error";

export const diffChangeTypeDtoSchema = z.enum([
  "modified",
  "added",
  "deleted",
  "renamed",
  "binary",
]);

export const diffLineTypeDtoSchema = z.enum(["context", "added", "removed"]);

export const diffLineDtoSchema = z.object({
  type: diffLineTypeDtoSchema,
  content: z.string(),
});

export const diffHunkDtoSchema = z.object({
  header: z.string(),
  lines: z.array(diffLineDtoSchema),
});

export const diffFileDtoSchema = z.object({
  path: z.string(),
  oldPath: z.string().nullable().optional(),
  changeType: diffChangeTypeDtoSchema,
  isBinary: z.boolean(),
  hunks: z.array(diffHunkDtoSchema),
});

export type DiffFileDto = z.infer<typeof diffFileDtoSchema>;

export const getDiffResponseDtoSchema = z.object({
  files: z.array(diffFileDtoSchema).nullable(),
  error: appErrorSchema.nullable(),
});
