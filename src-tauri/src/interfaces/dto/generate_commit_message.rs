use serde::{Deserialize, Serialize};

use super::app_error::AppErrorDto;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateCommitMessageInputDto {
    pub repository_path: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommitMessageSuggestionDto {
    pub title: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateCommitMessageResponseDto {
    pub success: bool,
    pub suggestions: Option<Vec<CommitMessageSuggestionDto>>,
    pub truncated_diff: bool,
    pub error: Option<AppErrorDto>,
}
