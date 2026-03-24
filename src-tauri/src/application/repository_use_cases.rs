use crate::domain::repository::Repository;
use crate::infrastructure::git::repository_service::GitRepositoryService;
use crate::interfaces::dto::app_error::AppErrorDto;

pub fn open_repository(folder_path: String) -> Result<Repository, AppErrorDto> {
    let service = GitRepositoryService::new();
    service.open_repository(folder_path)
}
