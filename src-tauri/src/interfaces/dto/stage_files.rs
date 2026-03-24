use serde::{Deserialize, Serialize};

use super::app_error::AppErrorDto;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StageFilesInputDto {
    pub repository_path: String,
    pub file_paths: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StageFilesResponseDto {
    pub success: bool,
    pub error: Option<AppErrorDto>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnstageFilesInputDto {
    pub repository_path: String,
    pub file_paths: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UnstageFilesResponseDto {
    pub success: bool,
    pub error: Option<AppErrorDto>,
}
