use serde::{Deserialize, Serialize};

use super::app_error::AppErrorDto;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum DiffChangeTypeDto {
    Modified,
    Added,
    Deleted,
    Renamed,
    Binary,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum DiffLineTypeDto {
    Context,
    Added,
    Removed,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffLineDto {
    pub r#type: DiffLineTypeDto,
    pub content: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffHunkDto {
    pub header: String,
    pub lines: Vec<DiffLineDto>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffFileDto {
    pub path: String,
    pub old_path: Option<String>,
    pub change_type: DiffChangeTypeDto,
    pub is_binary: bool,
    pub hunks: Vec<DiffHunkDto>,
}

#[derive(Debug, Clone, Copy, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub enum WorkingDiffScopeDto {
    #[default]
    Unstaged,
    Staged,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetWorkingDiffInputDto {
    pub repository_path: String,
    pub file_path: String,
    /// When omitted, defaults to unstaged (`git diff`).
    #[serde(default)]
    pub scope: WorkingDiffScopeDto,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GetWorkingDiffResponseDto {
    pub files: Option<Vec<DiffFileDto>>,
    pub error: Option<AppErrorDto>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetCommitDiffInputDto {
    pub repository_path: String,
    pub commit_hash: String,
    pub file_path: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GetCommitDiffResponseDto {
    pub files: Option<Vec<DiffFileDto>>,
    pub error: Option<AppErrorDto>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListCommitChangedFilesInputDto {
    pub repository_path: String,
    pub commit_hash: String,
}

/// Paths touched by a commit without unified-diff hunks (for lazy per-file loading).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommitChangedFileSummaryDto {
    pub path: String,
    pub old_path: Option<String>,
    pub change_type: DiffChangeTypeDto,
    pub is_binary: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ListCommitChangedFilesResponseDto {
    pub files: Option<Vec<CommitChangedFileSummaryDto>>,
    pub error: Option<AppErrorDto>,
}
