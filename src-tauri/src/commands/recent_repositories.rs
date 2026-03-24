use tauri::AppHandle;

use crate::application::recent_repositories;
use crate::interfaces::dto::recent_repositories::{
    AddRecentRepositoryInputDto, AddRecentRepositoryResponseDto, GetRecentRepositoriesResponseDto,
    RemoveRecentRepositoryInputDto, RemoveRecentRepositoryResponseDto,
};

#[tauri::command]
pub fn get_recent_repositories(app: AppHandle) -> GetRecentRepositoriesResponseDto {
    match recent_repositories::list_recent(&app) {
        Ok(repositories) => GetRecentRepositoriesResponseDto {
            repositories: Some(repositories),
            error: None,
        },
        Err(error) => GetRecentRepositoriesResponseDto {
            repositories: None,
            error: Some(error),
        },
    }
}

#[tauri::command]
pub fn add_recent_repository(
    app: AppHandle,
    input: AddRecentRepositoryInputDto,
) -> AddRecentRepositoryResponseDto {
    match recent_repositories::add_recent(&app, input.name, input.root_path) {
        Ok(()) => AddRecentRepositoryResponseDto {
            success: true,
            error: None,
        },
        Err(error) => AddRecentRepositoryResponseDto {
            success: false,
            error: Some(error),
        },
    }
}

#[tauri::command]
pub fn remove_recent_repository(
    app: AppHandle,
    input: RemoveRecentRepositoryInputDto,
) -> RemoveRecentRepositoryResponseDto {
    match recent_repositories::remove_recent(&app, input.root_path) {
        Ok(()) => RemoveRecentRepositoryResponseDto {
            success: true,
            error: None,
        },
        Err(error) => RemoveRecentRepositoryResponseDto {
            success: false,
            error: Some(error),
        },
    }
}
