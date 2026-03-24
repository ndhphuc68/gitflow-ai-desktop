import { z } from "zod";

import { appErrorSchema } from "../../../shared/types/app-error";

export const recentRepositoryDtoSchema = z.object({
  name: z.string(),
  rootPath: z.string(),
  lastOpenedAt: z.string().optional(),
});

export type RecentRepositoryDto = z.infer<typeof recentRepositoryDtoSchema>;

export const getRecentRepositoriesResponseDtoSchema = z.object({
  repositories: z.array(recentRepositoryDtoSchema).nullable(),
  error: appErrorSchema.nullable(),
});

export const removeRecentRepositoryResponseDtoSchema = z.object({
  success: z.boolean(),
  error: appErrorSchema.nullable(),
});
