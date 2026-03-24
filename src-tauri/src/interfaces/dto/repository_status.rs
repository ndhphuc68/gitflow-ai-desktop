use serde::{Deserialize, Serialize};

use crate::domain::repository_status::{RepositoryFileStatus, RepositoryStatusEntry};

use super::app_error::AppErrorDto;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetRepositoryStatusInputDto {
    pub repository_path: String,
}

#[derive(Debug, Clone, Serialize)]
pub enum RepositoryFileStatusDto {
    Modified,
    Added,
    Deleted,
    Untracked,
    Conflicted,
}

impl From<RepositoryFileStatus> for RepositoryFileStatusDto {
    fn from(value: RepositoryFileStatus) -> Self {
        match value {
            RepositoryFileStatus::Modified => Self::Modified,
            RepositoryFileStatus::Added => Self::Added,
            RepositoryFileStatus::Deleted => Self::Deleted,
            RepositoryFileStatus::Untracked => Self::Untracked,
            RepositoryFileStatus::Conflicted => Self::Conflicted,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RepositoryStatusEntryDto {
    pub path: String,
    pub status: RepositoryFileStatusDto,
    pub staged: bool,
}

impl From<RepositoryStatusEntry> for RepositoryStatusEntryDto {
    fn from(value: RepositoryStatusEntry) -> Self {
        Self {
            path: value.path,
            status: value.status.into(),
            staged: value.staged,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GetRepositoryStatusResponseDto {
    pub entries: Option<Vec<RepositoryStatusEntryDto>>,
    pub error: Option<AppErrorDto>,
}
