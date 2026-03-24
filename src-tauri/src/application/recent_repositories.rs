use tauri::AppHandle;

use crate::application::repository_use_cases;
use crate::domain::repository::Repository;
use crate::infrastructure::storage::{RecentRepositoriesStore, RecentRepositoryRecord};
use crate::interfaces::dto::app_error::AppErrorDto;
use crate::interfaces::dto::recent_repositories::RecentRepositoryDto;

fn record_to_dto(record: RecentRepositoryRecord) -> RecentRepositoryDto {
    RecentRepositoryDto {
        name: record.name,
        root_path: record.root_path,
        last_opened_at: record.last_opened_at,
    }
}

pub fn list_recent(app: &AppHandle) -> Result<Vec<RecentRepositoryDto>, AppErrorDto> {
    let store = RecentRepositoriesStore::for_app(app)?;
    store
        .list_sorted()
        .map(|records| records.into_iter().map(record_to_dto).collect())
}

pub fn open_repository_for_app(
    app: &AppHandle,
    folder_path: String,
) -> Result<(Repository, Option<AppErrorDto>), AppErrorDto> {
    let repository = repository_use_cases::open_repository(folder_path)?;
    let recents_persist_error = try_record_opened(app, &repository).err();
    Ok((repository, recents_persist_error))
}

fn try_record_opened(app: &AppHandle, repository: &Repository) -> Result<(), AppErrorDto> {
    let store = RecentRepositoriesStore::for_app(app)?;
    store.upsert(repository.name.clone(), repository.root_path.clone())
}

pub fn add_recent(app: &AppHandle, name: String, root_path: String) -> Result<(), AppErrorDto> {
    let store = RecentRepositoriesStore::for_app(app)?;
    store.upsert(name, root_path)
}

pub fn remove_recent(app: &AppHandle, root_path: String) -> Result<(), AppErrorDto> {
    let store = RecentRepositoriesStore::for_app(app)?;
    store.remove(&root_path)
}
