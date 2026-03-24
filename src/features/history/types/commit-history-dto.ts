import { z } from "zod";

import { appErrorSchema } from "../../../shared/types/app-error";

export const commitDtoSchema = z.object({
  hash: z.string(),
  shortHash: z.string(),
  subject: z.string(),
  authorName: z.string(),
  authorEmail: z.string(),
  authoredAt: z.string(),
  parentHashes: z.array(z.string()),
});

export type CommitDto = z.infer<typeof commitDtoSchema>;

export const getCommitHistoryResponseDtoSchema = z.object({
  commits: z.array(commitDtoSchema).nullable(),
  error: appErrorSchema.nullable(),
});
