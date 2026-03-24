use serde::{Deserialize, Serialize};

use super::app_error::AppErrorDto;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscardChangesInputDto {
    pub repository_path: String,
    pub file_paths: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscardChangesResponseDto {
    pub success: bool,
    pub message: Option<String>,
    pub error: Option<AppErrorDto>,
}
