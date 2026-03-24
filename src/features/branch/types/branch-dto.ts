import { z } from "zod";

import { appErrorSchema } from "../../../shared/types/app-error";

export const branchDtoSchema = z.object({
  name: z.string(),
  isCurrent: z.boolean(),
});

export type BranchDto = z.infer<typeof branchDtoSchema>;

export const listBranchesResponseDtoSchema = z.object({
  branches: z.array(branchDtoSchema).nullable(),
  error: appErrorSchema.nullable(),
});

export const checkoutBranchResponseDtoSchema = z.object({
  success: z.boolean(),
  error: appErrorSchema.nullable(),
});

export const createBranchResponseDtoSchema = z.object({
  success: z.boolean(),
  error: appErrorSchema.nullable(),
});
