import { z } from "zod";

import { appErrorSchema } from "../../../shared/types/app-error";

export const repositoryDtoSchema = z.object({
  name: z.string(),
  rootPath: z.string(),
  currentBranch: z.string(),
});

export type RepositoryDto = z.infer<typeof repositoryDtoSchema>;

export const openRepositoryResponseDtoSchema = z.object({
  repository: repositoryDtoSchema.nullable(),
  error: appErrorSchema.nullable(),
});

export type OpenRepositoryResponseDto = z.infer<
  typeof openRepositoryResponseDtoSchema
>;
