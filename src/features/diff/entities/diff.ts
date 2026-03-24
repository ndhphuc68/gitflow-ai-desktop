import { CommitChangedFileSummaryDto, DiffFileDto } from "../types/diff-dto";

export type DiffChangeType = "modified" | "added" | "deleted" | "renamed" | "binary";
export type DiffLineType = "context" | "added" | "removed";

export type DiffLine = {
  type: DiffLineType;
  content: string;
};

export type DiffHunk = {
  header: string;
  lines: DiffLine[];
};

export type DiffFile = {
  path: string;
  oldPath: string | null;
  changeType: DiffChangeType;
  isBinary: boolean;
  hunks: DiffHunk[];
};

export function toDiffFile(diffFileDto: DiffFileDto): DiffFile {
  return {
    path: diffFileDto.path,
    oldPath: diffFileDto.oldPath ?? null,
    changeType: mapChangeType(diffFileDto.changeType),
    isBinary: diffFileDto.isBinary,
    hunks: diffFileDto.hunks.map((hunk) => ({
      header: hunk.header,
      lines: hunk.lines.map((line) => ({
        type: mapLineType(line.type),
        content: line.content,
      })),
    })),
  };
}

/** Summary row from `list_commit_changed_files` (no hunks until per-file diff loads). */
export function commitChangedSummaryToDiffFile(summary: CommitChangedFileSummaryDto): DiffFile {
  return {
    path: summary.path,
    oldPath: summary.oldPath ?? null,
    changeType: mapChangeType(summary.changeType),
    isBinary: summary.isBinary,
    hunks: [],
  };
}

function mapChangeType(changeType: DiffFileDto["changeType"]): DiffChangeType {
  switch (changeType) {
    case "added":
      return "added";
    case "deleted":
      return "deleted";
    case "renamed":
      return "renamed";
    case "binary":
      return "binary";
    case "modified":
    default:
      return "modified";
  }
}

function mapLineType(lineType: "context" | "added" | "removed"): DiffLineType {
  switch (lineType) {
    case "added":
      return "added";
    case "removed":
      return "removed";
    case "context":
    default:
      return "context";
  }
}
