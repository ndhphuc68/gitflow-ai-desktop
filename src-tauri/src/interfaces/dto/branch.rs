use serde::{Deserialize, Serialize};

use super::app_error::AppErrorDto;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BranchDto {
    pub name: String,
    pub is_current: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListBranchesInputDto {
    pub repository_path: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ListBranchesResponseDto {
    pub branches: Option<Vec<BranchDto>>,
    pub error: Option<AppErrorDto>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckoutBranchInputDto {
    pub repository_path: String,
    pub branch_name: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckoutBranchResponseDto {
    pub success: bool,
    pub error: Option<AppErrorDto>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBranchInputDto {
    pub repository_path: String,
    pub branch_name: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBranchResponseDto {
    pub success: bool,
    pub error: Option<AppErrorDto>,
}
