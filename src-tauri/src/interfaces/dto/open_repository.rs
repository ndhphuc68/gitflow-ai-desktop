use serde::{Deserialize, Serialize};

use crate::domain::repository::Repository;

use super::app_error::AppErrorDto;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenRepositoryInputDto {
    pub folder_path: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RepositoryDto {
    pub name: String,
    pub root_path: String,
    pub current_branch: String,
}

impl From<Repository> for RepositoryDto {
    fn from(value: Repository) -> Self {
        Self {
            name: value.name,
            root_path: value.root_path,
            current_branch: value.current_branch,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenRepositoryResponseDto {
    pub repository: Option<RepositoryDto>,
    pub error: Option<AppErrorDto>,
    /// Present when the repository opened successfully but saving to recent list failed.
    pub recents_persist_error: Option<AppErrorDto>,
}
