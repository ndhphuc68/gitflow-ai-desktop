import { CommitDto } from "../types/commit-history-dto";

export type Commit = {
  hash: string;
  shortHash: string;
  subject: string;
  authorName: string;
  authorEmail: string;
  authoredAt: string;
  parentHashes: string[];
};

export function toCommit(commitDto: CommitDto): Commit {
  return {
    hash: commitDto.hash,
    shortHash: commitDto.shortHash,
    subject: commitDto.subject,
    authorName: commitDto.authorName,
    authorEmail: commitDto.authorEmail,
    authoredAt: commitDto.authoredAt,
    parentHashes: commitDto.parentHashes,
  };
}
