use crate::application::recent_repositories;
use tauri::AppHandle;
use crate::infrastructure::git::repository_service::GitRepositoryService;
use crate::interfaces::dto::branch::{
    BranchDto, CheckoutBranchInputDto, CheckoutBranchResponseDto, CreateBranchInputDto,
    CreateBranchResponseDto, ListBranchesInputDto, ListBranchesResponseDto,
};
use crate::interfaces::dto::open_repository::{
    OpenRepositoryInputDto, OpenRepositoryResponseDto, RepositoryDto,
};
use crate::interfaces::dto::create_commit::{CreateCommitInputDto, CreateCommitResponseDto};
use crate::interfaces::dto::discard_changes::{
    DiscardChangesInputDto, DiscardChangesResponseDto,
};
use crate::interfaces::dto::revert_commit::{RevertCommitInputDto, RevertCommitResponseDto};
use crate::interfaces::dto::diff::{
    CommitChangedFileSummaryDto, DiffChangeTypeDto, DiffFileDto, DiffHunkDto, DiffLineDto,
    DiffLineTypeDto, GetCommitDiffInputDto, GetCommitDiffResponseDto, GetWorkingDiffInputDto,
    GetWorkingDiffResponseDto, ListCommitChangedFilesInputDto, ListCommitChangedFilesResponseDto,
};
use crate::interfaces::dto::history::{
    CommitDto, GetCommitHistoryInputDto, GetCommitHistoryResponseDto,
};
use crate::interfaces::dto::repository_status::{
    GetRepositoryStatusInputDto, GetRepositoryStatusResponseDto, RepositoryStatusEntryDto,
};
use crate::interfaces::dto::stage_files::{
    StageFilesInputDto, StageFilesResponseDto, UnstageFilesInputDto, UnstageFilesResponseDto,
};
use crate::infrastructure::git::diff_parser::{DiffChangeType, DiffLineType};
use crate::infrastructure::git::repository_service::RepositoryDiffFile;

#[tauri::command]
pub fn open_repository(app: AppHandle, input: OpenRepositoryInputDto) -> OpenRepositoryResponseDto {
    match recent_repositories::open_repository_for_app(&app, input.folder_path) {
        Ok((repository, recents_persist_error)) => OpenRepositoryResponseDto {
            repository: Some(RepositoryDto::from(repository)),
            recents_persist_error,
            error: None,
        },
        Err(error) => OpenRepositoryResponseDto {
            repository: None,
            recents_persist_error: None,
            error: Some(error.into()),
        },
    }
}

#[tauri::command]
pub fn get_repository_status(input: GetRepositoryStatusInputDto) -> GetRepositoryStatusResponseDto {
    let service = GitRepositoryService::new();
    match service.get_repository_status(input.repository_path) {
        Ok(entries) => GetRepositoryStatusResponseDto {
            entries: Some(entries.into_iter().map(RepositoryStatusEntryDto::from).collect()),
            error: None,
        },
        Err(error) => GetRepositoryStatusResponseDto {
            entries: None,
            error: Some(error.into()),
        },
    }
}

#[tauri::command]
pub fn stage_files(input: StageFilesInputDto) -> StageFilesResponseDto {
    let service = GitRepositoryService::new();
    match service.stage_files(input.repository_path, input.file_paths) {
        Ok(()) => StageFilesResponseDto {
            success: true,
            error: None,
        },
        Err(error) => StageFilesResponseDto {
            success: false,
            error: Some(error),
        },
    }
}

#[tauri::command]
pub fn unstage_files(input: UnstageFilesInputDto) -> UnstageFilesResponseDto {
    let service = GitRepositoryService::new();
    match service.unstage_files(input.repository_path, input.file_paths) {
        Ok(()) => UnstageFilesResponseDto {
            success: true,
            error: None,
        },
        Err(error) => UnstageFilesResponseDto {
            success: false,
            error: Some(error),
        },
    }
}

#[tauri::command]
pub fn discard_changes(input: DiscardChangesInputDto) -> DiscardChangesResponseDto {
    let service = GitRepositoryService::new();
    match service.discard_changes(input.repository_path, input.file_paths) {
        Ok(message) => DiscardChangesResponseDto {
            success: true,
            message: Some(message),
            error: None,
        },
        Err(error) => DiscardChangesResponseDto {
            success: false,
            message: None,
            error: Some(error),
        },
    }
}

#[tauri::command]
pub fn create_commit(input: CreateCommitInputDto) -> CreateCommitResponseDto {
    let service = GitRepositoryService::new();
    match service.create_commit(input.repository_path, input.message) {
        Ok(()) => CreateCommitResponseDto {
            success: true,
            error: None,
        },
        Err(error) => CreateCommitResponseDto {
            success: false,
            error: Some(error),
        },
    }
}

#[tauri::command]
pub fn revert_commit(input: RevertCommitInputDto) -> RevertCommitResponseDto {
    let service = GitRepositoryService::new();
    match service.revert_commit(input.repository_path, input.commit_hash) {
        Ok(()) => RevertCommitResponseDto {
            success: true,
            message: Some("Revert commit created successfully".to_string()),
            error: None,
        },
        Err(error) => RevertCommitResponseDto {
            success: false,
            message: None,
            error: Some(error),
        },
    }
}

#[tauri::command]
pub fn list_branches(input: ListBranchesInputDto) -> ListBranchesResponseDto {
    let service = GitRepositoryService::new();
    match service.list_branches(input.repository_path) {
        Ok(branches) => ListBranchesResponseDto {
            branches: Some(
                branches
                    .into_iter()
                    .map(|branch| BranchDto {
                        name: branch.name,
                        is_current: branch.is_current,
                    })
                    .collect(),
            ),
            error: None,
        },
        Err(error) => ListBranchesResponseDto {
            branches: None,
            error: Some(error),
        },
    }
}

#[tauri::command]
pub fn checkout_branch(input: CheckoutBranchInputDto) -> CheckoutBranchResponseDto {
    let service = GitRepositoryService::new();
    match service.checkout_branch(input.repository_path, input.branch_name) {
        Ok(()) => CheckoutBranchResponseDto {
            success: true,
            error: None,
        },
        Err(error) => CheckoutBranchResponseDto {
            success: false,
            error: Some(error),
        },
    }
}

#[tauri::command]
pub fn create_branch(input: CreateBranchInputDto) -> CreateBranchResponseDto {
    let service = GitRepositoryService::new();
    match service.create_branch(input.repository_path, input.branch_name) {
        Ok(()) => CreateBranchResponseDto {
            success: true,
            error: None,
        },
        Err(error) => CreateBranchResponseDto {
            success: false,
            error: Some(error),
        },
    }
}

#[tauri::command]
pub fn get_commit_history(input: GetCommitHistoryInputDto) -> GetCommitHistoryResponseDto {
    let service = GitRepositoryService::new();
    match service.get_commit_history(input.repository_path, input.limit) {
        Ok(commits) => GetCommitHistoryResponseDto {
            commits: Some(
                commits
                    .into_iter()
                    .map(|commit| CommitDto {
                        hash: commit.hash,
                        short_hash: commit.short_hash,
                        subject: commit.subject,
                        author_name: commit.author_name,
                        author_email: commit.author_email,
                        authored_at: commit.authored_at,
                        parent_hashes: commit.parent_hashes,
                    })
                    .collect(),
            ),
            error: None,
        },
        Err(error) => GetCommitHistoryResponseDto {
            commits: None,
            error: Some(error),
        },
    }
}

#[tauri::command]
pub fn get_working_diff(input: GetWorkingDiffInputDto) -> GetWorkingDiffResponseDto {
    let service = GitRepositoryService::new();
    match service.get_working_diff(input.repository_path, input.file_path, input.scope) {
        Ok(files) => GetWorkingDiffResponseDto {
            files: Some(files.into_iter().map(map_diff_file_dto).collect()),
            error: None,
        },
        Err(error) => GetWorkingDiffResponseDto {
            files: None,
            error: Some(error),
        },
    }
}

#[tauri::command]
pub fn get_commit_diff(input: GetCommitDiffInputDto) -> GetCommitDiffResponseDto {
    let service = GitRepositoryService::new();
    match service.get_commit_diff(input.repository_path, input.commit_hash, input.file_path) {
        Ok(files) => GetCommitDiffResponseDto {
            files: Some(files.into_iter().map(map_diff_file_dto).collect()),
            error: None,
        },
        Err(error) => GetCommitDiffResponseDto {
            files: None,
            error: Some(error),
        },
    }
}

#[tauri::command]
pub fn list_commit_changed_files(
    input: ListCommitChangedFilesInputDto,
) -> ListCommitChangedFilesResponseDto {
    let service = GitRepositoryService::new();
    match service.list_commit_changed_files(input.repository_path, input.commit_hash) {
        Ok(files) => ListCommitChangedFilesResponseDto {
            files: Some(
                files
                    .into_iter()
                    .map(map_commit_changed_file_summary_dto)
                    .collect(),
            ),
            error: None,
        },
        Err(error) => ListCommitChangedFilesResponseDto {
            files: None,
            error: Some(error),
        },
    }
}

fn map_commit_changed_file_summary_dto(file: RepositoryDiffFile) -> CommitChangedFileSummaryDto {
    CommitChangedFileSummaryDto {
        path: file.path,
        old_path: file.old_path,
        change_type: map_diff_change_type_dto(file.change_type),
        is_binary: file.is_binary,
    }
}

fn map_diff_change_type_dto(change_type: DiffChangeType) -> DiffChangeTypeDto {
    match change_type {
        DiffChangeType::Modified => DiffChangeTypeDto::Modified,
        DiffChangeType::Added => DiffChangeTypeDto::Added,
        DiffChangeType::Deleted => DiffChangeTypeDto::Deleted,
        DiffChangeType::Renamed => DiffChangeTypeDto::Renamed,
        DiffChangeType::Binary => DiffChangeTypeDto::Binary,
    }
}

fn map_diff_file_dto(file: RepositoryDiffFile) -> DiffFileDto {
    DiffFileDto {
        path: file.path,
        old_path: file.old_path,
        change_type: map_diff_change_type_dto(file.change_type),
        is_binary: file.is_binary,
        hunks: file
            .hunks
            .into_iter()
            .map(|hunk| DiffHunkDto {
                header: hunk.header,
                lines: hunk
                    .lines
                    .into_iter()
                    .map(|line| DiffLineDto {
                        r#type: match line.line_type {
                            DiffLineType::Context => DiffLineTypeDto::Context,
                            DiffLineType::Added => DiffLineTypeDto::Added,
                            DiffLineType::Removed => DiffLineTypeDto::Removed,
                        },
                        content: line.content,
                    })
                    .collect::<Vec<_>>(),
            })
            .collect::<Vec<_>>(),
    }
}
