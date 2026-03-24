use serde::{Deserialize, Serialize};

use super::app_error::AppErrorDto;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetCommitHistoryInputDto {
    pub repository_path: String,
    pub limit: Option<u32>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommitDto {
    pub hash: String,
    pub short_hash: String,
    pub subject: String,
    pub author_name: String,
    pub author_email: String,
    pub authored_at: String,
    pub parent_hashes: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GetCommitHistoryResponseDto {
    pub commits: Option<Vec<CommitDto>>,
    pub error: Option<AppErrorDto>,
}
