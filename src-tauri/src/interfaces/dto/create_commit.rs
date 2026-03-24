use serde::{Deserialize, Serialize};

use super::app_error::AppErrorDto;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCommitInputDto {
    pub repository_path: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCommitResponseDto {
    pub success: bool,
    pub error: Option<AppErrorDto>,
}
