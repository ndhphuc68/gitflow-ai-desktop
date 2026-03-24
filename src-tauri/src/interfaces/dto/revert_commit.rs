use serde::{Deserialize, Serialize};

use super::app_error::AppErrorDto;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RevertCommitInputDto {
    pub repository_path: String,
    pub commit_hash: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RevertCommitResponseDto {
    pub success: bool,
    pub message: Option<String>,
    pub error: Option<AppErrorDto>,
}
