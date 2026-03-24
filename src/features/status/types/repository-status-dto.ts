import { z } from "zod";

import { appErrorSchema } from "../../../shared/types/app-error";

export const repositoryFileStatusDtoSchema = z.enum([
  "Modified",
  "Added",
  "Deleted",
  "Untracked",
  "Conflicted",
]);

export type RepositoryFileStatusDto = z.infer<typeof repositoryFileStatusDtoSchema>;

export const repositoryStatusEntryDtoSchema = z.object({
  path: z.string(),
  status: repositoryFileStatusDtoSchema,
  staged: z.boolean(),
});

export type RepositoryStatusEntryDto = z.infer<typeof repositoryStatusEntryDtoSchema>;

export const getRepositoryStatusResponseDtoSchema = z.object({
  entries: z.array(repositoryStatusEntryDtoSchema).nullable(),
  error: appErrorSchema.nullable(),
});

export type GetRepositoryStatusResponseDto = z.infer<
  typeof getRepositoryStatusResponseDtoSchema
>;
