use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentRepositoryDto {
    pub name: String,
    pub root_path: String,
    pub last_opened_at: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddRecentRepositoryInputDto {
    pub name: String,
    pub root_path: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoveRecentRepositoryInputDto {
    pub root_path: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GetRecentRepositoriesResponseDto {
    pub repositories: Option<Vec<RecentRepositoryDto>>,
    pub error: Option<crate::interfaces::dto::app_error::AppErrorDto>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AddRecentRepositoryResponseDto {
    pub success: bool,
    pub error: Option<crate::interfaces::dto::app_error::AppErrorDto>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoveRecentRepositoryResponseDto {
    pub success: bool,
    pub error: Option<crate::interfaces::dto::app_error::AppErrorDto>,
}
