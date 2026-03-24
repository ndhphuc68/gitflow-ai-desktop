use std::path::{Path, PathBuf};
use std::time::Duration;

use crate::domain::repository::Repository;
use crate::domain::repository_status::{RepositoryFileStatus, RepositoryStatusEntry};
use crate::interfaces::dto::app_error::AppErrorDto;
use crate::interfaces::dto::diff::WorkingDiffScopeDto;

use super::diff_parser::{
    parse_git_show_name_status, parse_unified_diff, DiffChangeType, DiffFile, DiffLineType,
};
use super::git_executor::{GitExecutor, GitExecutorErrorKind};
use super::history_parser::parse_git_log_records;
use super::status_parser::parse_porcelain_v1_status;

pub struct GitRepositoryService;
const COMMIT_COMMAND_TIMEOUT_SECONDS: u64 = 900;
/// `git show` for a full commit can be slow on large merges; default `run()` is 10s.
const COMMIT_DIFF_COMMAND_TIMEOUT_SECONDS: u64 = 180;
const DEFAULT_HISTORY_LIMIT: u32 = 50;
const MAX_HISTORY_LIMIT: u32 = 200;

#[derive(Debug, Clone)]
pub struct Branch {
    pub name: String,
    pub is_current: bool,
}

#[derive(Debug, Clone)]
pub struct CommitHistoryEntry {
    pub hash: String,
    pub short_hash: String,
    pub subject: String,
    pub author_name: String,
    pub author_email: String,
    pub authored_at: String,
    pub parent_hashes: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct RepositoryDiffFile {
    pub path: String,
    pub old_path: Option<String>,
    pub change_type: DiffChangeType,
    pub is_binary: bool,
    pub hunks: Vec<RepositoryDiffHunk>,
}

#[derive(Debug, Clone)]
pub struct RepositoryDiffHunk {
    pub header: String,
    pub lines: Vec<RepositoryDiffLine>,
}

#[derive(Debug, Clone)]
pub struct RepositoryDiffLine {
    pub line_type: DiffLineType,
    pub content: String,
}

impl GitRepositoryService {
    pub fn new() -> Self {
        Self
    }

    pub fn open_repository(&self, folder_path: String) -> Result<Repository, AppErrorDto> {
        if folder_path.trim().is_empty() {
            return Err(AppErrorDto::new(
                "INVALID_PATH",
                "Repository path is required",
                None,
                true,
            ));
        }

        let path = PathBuf::from(folder_path.trim());
        if !path.exists() || !path.is_dir() {
            return Err(AppErrorDto::new(
                "INVALID_PATH",
                "Provided path does not exist or is not a directory",
                None,
                true,
            ));
        }

        let root_path = self.resolve_repository_root(&path)?;
        let root_path = root_path.canonicalize().unwrap_or(root_path);
        let current_branch = self.read_current_branch(&root_path)?;
        let repository_name = root_path
            .file_name()
            .and_then(|value| value.to_str())
            .map(str::to_string)
            .unwrap_or_else(|| root_path.display().to_string());

        Ok(Repository {
            name: repository_name,
            root_path: root_path.display().to_string(),
            current_branch: if current_branch.is_empty() {
                "Detached HEAD".to_string()
            } else {
                current_branch
            },
        })
    }

    pub fn get_repository_status(
        &self,
        repository_path: String,
    ) -> Result<Vec<RepositoryStatusEntry>, AppErrorDto> {
        if repository_path.trim().is_empty() {
            return Err(AppErrorDto::new(
                "INVALID_PATH",
                "Repository path is required",
                None,
                true,
            ));
        }

        let path = PathBuf::from(repository_path.trim());
        if !path.exists() || !path.is_dir() {
            return Err(AppErrorDto::new(
                "INVALID_PATH",
                "Provided repository path does not exist or is not a directory",
                None,
                true,
            ));
        }

        let repository_root = self.resolve_repository_root(&path)?;
        let status_output = GitExecutor::run(&repository_root, &["status", "--porcelain=v1", "-u"])
            .map_err(|error| match error.kind {
                GitExecutorErrorKind::GitNotAvailable => AppErrorDto::new(
                    "GIT_NOT_AVAILABLE",
                    "Git is not available on this system",
                    error.details,
                    false,
                ),
                GitExecutorErrorKind::TimedOut => AppErrorDto::new(
                    "GIT_COMMAND_TIMEOUT",
                    "Git command timed out while reading repository status",
                    error.details,
                    true,
                ),
                GitExecutorErrorKind::CommandFailed => AppErrorDto::new(
                    "GIT_COMMAND_FAILED",
                    "Failed to read repository status",
                    error.details,
                    true,
                ),
            })?;

        Ok(parse_porcelain_v1_status(&status_output))
    }

    pub fn get_staged_diff_text(&self, repository_path: String) -> Result<String, AppErrorDto> {
        let repository_root = self.validate_repository_path(&repository_path)?;
        GitExecutor::run_with_timeout_utf8_stdout(
            &repository_root,
            &["diff", "--cached"],
            Duration::from_secs(30),
        )
        .map_err(|error| {
            self.map_git_operation_error(error.kind, error.details, "read staged diff")
        })
    }

    pub fn stage_files(
        &self,
        repository_path: String,
        file_paths: Vec<String>,
    ) -> Result<(), AppErrorDto> {
        let repository_root = self.validate_repository_path(&repository_path)?;
        let normalized_file_paths = self.validate_file_paths(file_paths)?;

        for file_path in normalized_file_paths {
            GitExecutor::run(&repository_root, &["add", "--", file_path.as_str()])
                .map_err(|error| self.map_git_operation_error(error.kind, error.details, "stage files"))?;
        }

        Ok(())
    }

    pub fn unstage_files(
        &self,
        repository_path: String,
        file_paths: Vec<String>,
    ) -> Result<(), AppErrorDto> {
        let repository_root = self.validate_repository_path(&repository_path)?;
        let normalized_file_paths = self.validate_file_paths(file_paths)?;

        for file_path in normalized_file_paths {
            GitExecutor::run(
                &repository_root,
                &["restore", "--staged", "--", file_path.as_str()],
            )
            .map_err(|error| self.map_git_operation_error(error.kind, error.details, "unstage files"))?;
        }

        Ok(())
    }

    pub fn discard_changes(
        &self,
        repository_path: String,
        file_paths: Vec<String>,
    ) -> Result<String, AppErrorDto> {
        let repository_root = self.validate_repository_path(&repository_path)?;
        let normalized_file_paths = self.validate_file_paths(file_paths)?;
        let status_entries = self.get_repository_status(repository_path.clone())?;

        for file_path in &normalized_file_paths {
            self.validate_discard_candidate(file_path, &status_entries)?;
        }

        let refreshed_entries = self.get_repository_status(repository_path)?;
        for file_path in &normalized_file_paths {
            self.validate_discard_candidate(file_path, &refreshed_entries)?;
        }

        let mut restore_args: Vec<&str> = vec!["restore", "--"];
        restore_args.extend(normalized_file_paths.iter().map(|path| path.as_str()));

        GitExecutor::run(&repository_root, &restore_args)
            .map_err(|error| self.map_discard_error(error.kind, &error.details))?;

        let noun = if normalized_file_paths.len() == 1 {
            "file"
        } else {
            "files"
        };
        Ok(format!(
            "Discarded local unstaged changes for {} {}.",
            normalized_file_paths.len(),
            noun
        ))
    }

    pub fn create_commit(
        &self,
        repository_path: String,
        message: String,
    ) -> Result<(), AppErrorDto> {
        let repository_root = self.validate_repository_path(&repository_path)?;
        let trimmed_message = message.trim().to_string();

        if trimmed_message.is_empty() {
            return Err(AppErrorDto::new(
                "INVALID_INPUT",
                "Commit message is required",
                None,
                true,
            ));
        }

        if trimmed_message.contains('\n') || trimmed_message.contains('\r') {
            return Err(AppErrorDto::new(
                "INVALID_INPUT",
                "Multi-line commit messages are not supported yet",
                None,
                true,
            ));
        }

        if !self.has_staged_files(&repository_root)? {
            return Err(AppErrorDto::new(
                "NO_STAGED_FILES",
                "There are no staged files to commit",
                None,
                true,
            ));
        }

        GitExecutor::run_with_timeout(
            &repository_root,
            &["commit", "-m", trimmed_message.as_str()],
            Duration::from_secs(COMMIT_COMMAND_TIMEOUT_SECONDS),
        )
        .map_err(|error| match error.kind {
            GitExecutorErrorKind::TimedOut => AppErrorDto::new(
                "GIT_COMMAND_TIMEOUT",
                "Git commit timed out. Pre-commit hooks may be running for too long",
                error.details,
                true,
            ),
            _ => self.map_git_operation_error(error.kind, error.details, "create commit"),
        })?;

        Ok(())
    }

    pub fn revert_commit(
        &self,
        repository_path: String,
        commit_hash: String,
    ) -> Result<(), AppErrorDto> {
        let repository_root = self.validate_repository_path(&repository_path)?;
        let normalized_commit_hash = commit_hash.trim();

        if normalized_commit_hash.is_empty() {
            return Err(AppErrorDto::new(
                "INVALID_INPUT",
                "Commit hash is required",
                None,
                true,
            ));
        }

        GitExecutor::run(&repository_root, &["revert", "--no-edit", normalized_commit_hash])
            .map_err(|error| self.map_revert_error(error.kind, error.details))?;

        Ok(())
    }

    pub fn list_branches(&self, repository_path: String) -> Result<Vec<Branch>, AppErrorDto> {
        let repository_root = self.validate_repository_path(&repository_path)?;
        let current_branch = GitExecutor::run(&repository_root, &["branch", "--show-current"])
            .map_err(|error| {
                self.map_git_operation_error(error.kind, error.details, "read current branch")
            })?;

        let branch_output = GitExecutor::run(
            &repository_root,
            &["branch", "--format=%(refname:short)"],
        )
        .map_err(|error| self.map_git_operation_error(error.kind, error.details, "list branches"))?;

        let current_branch_name = current_branch.trim();
        let branches = branch_output
            .lines()
            .map(str::trim)
            .filter(|name| !name.is_empty())
            .map(|name| Branch {
                name: name.to_string(),
                is_current: name == current_branch_name,
            })
            .collect::<Vec<_>>();

        Ok(branches)
    }

    pub fn checkout_branch(
        &self,
        repository_path: String,
        branch_name: String,
    ) -> Result<(), AppErrorDto> {
        let repository_root = self.validate_repository_path(&repository_path)?;
        let trimmed_branch_name = branch_name.trim();

        if trimmed_branch_name.is_empty() {
            return Err(AppErrorDto::new(
                "INVALID_INPUT",
                "Branch name is required",
                None,
                true,
            ));
        }

        GitExecutor::run(&repository_root, &["checkout", trimmed_branch_name]).map_err(|error| {
            self.map_git_operation_error(error.kind, error.details, "checkout branch")
        })?;
        Ok(())
    }

    pub fn create_branch(
        &self,
        repository_path: String,
        branch_name: String,
    ) -> Result<(), AppErrorDto> {
        let repository_root = self.validate_repository_path(&repository_path)?;
        let trimmed_branch_name = branch_name.trim();

        if trimmed_branch_name.is_empty() {
            return Err(AppErrorDto::new(
                "INVALID_INPUT",
                "Branch name is required",
                None,
                true,
            ));
        }

        GitExecutor::run(&repository_root, &["checkout", "-b", trimmed_branch_name]).map_err(
            |error| self.map_git_operation_error(error.kind, error.details, "create branch"),
        )?;
        Ok(())
    }

    pub fn get_commit_history(
        &self,
        repository_path: String,
        limit: Option<u32>,
    ) -> Result<Vec<CommitHistoryEntry>, AppErrorDto> {
        let repository_root = self.validate_repository_path(&repository_path)?;
        let normalized_limit = limit
            .unwrap_or(DEFAULT_HISTORY_LIMIT)
            .clamp(1, MAX_HISTORY_LIMIT);
        let max_count_arg = format!("--max-count={normalized_limit}");
        let log_format =
            "--pretty=format:%H%x1f%h%x1f%an%x1f%ae%x1f%ad%x1f%s%x1f%P%x1e";

        let log_output = GitExecutor::run(
            &repository_root,
            &["log", max_count_arg.as_str(), "--date=iso-strict", log_format],
        )
        .map_err(|error| self.map_git_operation_error(error.kind, error.details, "get commit history"))?;

        let commits = parse_git_log_records(&log_output)
            .into_iter()
            .map(|record| CommitHistoryEntry {
                hash: record.hash,
                short_hash: record.short_hash,
                subject: record.subject,
                author_name: record.author_name,
                author_email: record.author_email,
                authored_at: record.authored_at,
                parent_hashes: record.parent_hashes,
            })
            .collect::<Vec<_>>();

        Ok(commits)
    }

    pub fn get_working_diff(
        &self,
        repository_path: String,
        file_path: String,
        scope: WorkingDiffScopeDto,
    ) -> Result<Vec<RepositoryDiffFile>, AppErrorDto> {
        let repository_root = self.validate_repository_path(&repository_path)?;
        let normalized_file_path = file_path.trim().to_string();
        if normalized_file_path.is_empty() {
            return Err(AppErrorDto::new(
                "INVALID_INPUT",
                "File path is required",
                None,
                true,
            ));
        }

        let diff_output = match scope {
            WorkingDiffScopeDto::Staged => GitExecutor::run(
                &repository_root,
                &["diff", "--cached", "--", normalized_file_path.as_str()],
            ),
            WorkingDiffScopeDto::Unstaged => GitExecutor::run(
                &repository_root,
                &["diff", "--", normalized_file_path.as_str()],
            ),
        }
        .map_err(|error| self.map_git_operation_error(error.kind, error.details, "get working diff"))?;

        Ok(self.map_diff_files(parse_unified_diff(&diff_output)))
    }

    pub fn get_commit_diff(
        &self,
        repository_path: String,
        commit_hash: String,
        file_path: Option<String>,
    ) -> Result<Vec<RepositoryDiffFile>, AppErrorDto> {
        let repository_root = self.validate_repository_path(&repository_path)?;
        let normalized_commit_hash = commit_hash.trim().to_string();
        if normalized_commit_hash.is_empty() {
            return Err(AppErrorDto::new(
                "INVALID_INPUT",
                "Commit hash is required",
                None,
                true,
            ));
        }

        let mut args: Vec<&str> = vec!["show", "--format=", "--unified=3", normalized_commit_hash.as_str()];
        let trimmed_file_path = file_path.as_deref().map(str::trim).unwrap_or("");
        if !trimmed_file_path.is_empty() {
            args.push("--");
            args.push(trimmed_file_path);
        }

        let diff_output = GitExecutor::run_with_timeout(
            &repository_root,
            &args,
            Duration::from_secs(COMMIT_DIFF_COMMAND_TIMEOUT_SECONDS),
        )
        .map_err(|error| {
            self.map_git_operation_error(error.kind, error.details, "get commit diff")
        })?;

        Ok(self.map_diff_files(parse_unified_diff(&diff_output)))
    }

    /// Lists paths touched by a commit without loading unified-diff bodies (fast for large commits).
    pub fn list_commit_changed_files(
        &self,
        repository_path: String,
        commit_hash: String,
    ) -> Result<Vec<RepositoryDiffFile>, AppErrorDto> {
        let repository_root = self.validate_repository_path(&repository_path)?;
        let normalized_commit_hash = commit_hash.trim().to_string();
        if normalized_commit_hash.is_empty() {
            return Err(AppErrorDto::new(
                "INVALID_INPUT",
                "Commit hash is required",
                None,
                true,
            ));
        }

        // Use `git log`, not `git show -s --name-status`: Git rejects `-s` together with
        // `--name-status` (fatal: cannot be used together), which always failed listing.
        let list_output = GitExecutor::run(
            &repository_root,
            &[
                "log",
                "-1",
                "-M",
                "--name-status",
                "--pretty=format:",
                normalized_commit_hash.as_str(),
            ],
        )
        .map_err(|error| {
            self.map_git_operation_error(error.kind, error.details, "list commit changed files")
        })?;

        Ok(self.map_diff_files(parse_git_show_name_status(&list_output)))
    }

    fn validate_repository_path(&self, repository_path: &str) -> Result<PathBuf, AppErrorDto> {
        if repository_path.trim().is_empty() {
            return Err(AppErrorDto::new(
                "INVALID_PATH",
                "Repository path is required",
                None,
                true,
            ));
        }

        let path = PathBuf::from(repository_path.trim());
        if !path.exists() || !path.is_dir() {
            return Err(AppErrorDto::new(
                "INVALID_PATH",
                "Provided repository path does not exist or is not a directory",
                None,
                true,
            ));
        }

        self.resolve_repository_root(&path)
    }

    fn validate_file_paths(&self, file_paths: Vec<String>) -> Result<Vec<String>, AppErrorDto> {
        if file_paths.is_empty() {
            return Err(AppErrorDto::new(
                "INVALID_INPUT",
                "At least one file path is required",
                None,
                true,
            ));
        }

        let normalized_file_paths = file_paths
            .into_iter()
            .map(|path| path.trim().to_string())
            .filter(|path| !path.is_empty())
            .collect::<Vec<_>>();

        if normalized_file_paths.is_empty() {
            return Err(AppErrorDto::new(
                "INVALID_INPUT",
                "At least one non-empty file path is required",
                None,
                true,
            ));
        }

        Ok(normalized_file_paths)
    }

    fn map_git_operation_error(
        &self,
        kind: GitExecutorErrorKind,
        details: Option<String>,
        operation_name: &str,
    ) -> AppErrorDto {
        match kind {
            GitExecutorErrorKind::GitNotAvailable => AppErrorDto::new(
                "GIT_NOT_AVAILABLE",
                "Git is not available on this system",
                details,
                false,
            ),
            GitExecutorErrorKind::TimedOut => AppErrorDto::new(
                "GIT_COMMAND_TIMEOUT",
                &format!("Git command timed out while trying to {operation_name}"),
                details,
                true,
            ),
            GitExecutorErrorKind::CommandFailed => AppErrorDto::new(
                "GIT_COMMAND_FAILED",
                &format!("Failed to {operation_name}"),
                details,
                true,
            ),
        }
    }

    fn map_discard_error(
        &self,
        kind: GitExecutorErrorKind,
        details: &Option<String>,
    ) -> AppErrorDto {
        match kind {
            GitExecutorErrorKind::GitNotAvailable => AppErrorDto::new(
                "GIT_NOT_AVAILABLE",
                "Git is not available on this system",
                details.clone(),
                false,
            ),
            GitExecutorErrorKind::TimedOut => AppErrorDto::new(
                "GIT_COMMAND_TIMEOUT",
                "Git command timed out while trying to discard changes",
                details.clone(),
                true,
            ),
            GitExecutorErrorKind::CommandFailed => {
                if is_discard_unmerged_error(details) {
                    AppErrorDto::new(
                        "DISCARD_UNMERGED_PATH",
                        "Cannot discard changes while this path is unmerged. Resolve conflicts first",
                        details.clone(),
                        true,
                    )
                } else if is_discard_pathspec_error(details) {
                    AppErrorDto::new(
                        "DISCARD_PATHSPEC_FAILED",
                        "Git could not discard changes for the given path",
                        details.clone(),
                        true,
                    )
                } else {
                    AppErrorDto::new(
                        "GIT_COMMAND_FAILED",
                        "Failed to discard changes",
                        details.clone(),
                        true,
                    )
                }
            }
        }
    }

    fn map_revert_error(&self, kind: GitExecutorErrorKind, details: Option<String>) -> AppErrorDto {
        match kind {
            GitExecutorErrorKind::GitNotAvailable => AppErrorDto::new(
                "GIT_NOT_AVAILABLE",
                "Git is not available on this system",
                details,
                false,
            ),
            GitExecutorErrorKind::TimedOut => AppErrorDto::new(
                "GIT_COMMAND_TIMEOUT",
                "Git command timed out while trying to revert commit",
                details,
                true,
            ),
            GitExecutorErrorKind::CommandFailed => {
                if is_revert_conflict_error(&details) {
                    AppErrorDto::new(
                        "REVERT_CONFLICT",
                        "Revert failed due to conflicts. Resolve conflicts and try again",
                        details,
                        true,
                    )
                } else {
                    AppErrorDto::new(
                        "REVERT_COMMIT_FAILED",
                        "Failed to revert commit",
                        details,
                        true,
                    )
                }
            }
        }
    }

    fn validate_discard_candidate(
        &self,
        file_path: &str,
        status_entries: &[RepositoryStatusEntry],
    ) -> Result<(), AppErrorDto> {
        let matching_entries = status_entries
            .iter()
            .filter(|entry| entry.path == file_path)
            .collect::<Vec<_>>();

        if matching_entries.is_empty() {
            return Err(AppErrorDto::new(
                "FILE_NOT_MODIFIED",
                "File has no local changes to discard",
                Some(file_path.to_string()),
                true,
            ));
        }

        if matching_entries
            .iter()
            .any(|entry| matches!(entry.status, RepositoryFileStatus::Untracked | RepositoryFileStatus::Conflicted))
        {
            return Err(AppErrorDto::new(
                "DISCARD_NOT_SUPPORTED_FOR_FILE_STATE",
                "Only unstaged tracked file changes can be discarded",
                Some(file_path.to_string()),
                true,
            ));
        }

        if matching_entries.iter().any(|entry| entry.staged) {
            return Err(AppErrorDto::new(
                "FILE_HAS_STAGED_CHANGES",
                "Cannot discard changes for a file that has staged changes",
                Some(file_path.to_string()),
                true,
            ));
        }

        let has_unstaged_tracked_change = matching_entries.iter().any(|entry| {
            !entry.staged
                && matches!(
                    entry.status,
                    RepositoryFileStatus::Modified
                        | RepositoryFileStatus::Deleted
                        | RepositoryFileStatus::Added
                )
        });

        if !has_unstaged_tracked_change {
            return Err(AppErrorDto::new(
                "FILE_NOT_MODIFIED",
                "File has no unstaged tracked changes to discard",
                Some(file_path.to_string()),
                true,
            ));
        }

        Ok(())
    }

    fn map_diff_files(&self, parsed_files: Vec<DiffFile>) -> Vec<RepositoryDiffFile> {
        parsed_files
            .into_iter()
            .map(|file| RepositoryDiffFile {
                path: file.path,
                old_path: file.old_path,
                change_type: file.change_type,
                is_binary: file.is_binary,
                hunks: file
                    .hunks
                    .into_iter()
                    .map(|hunk| RepositoryDiffHunk {
                        header: hunk.header,
                        lines: hunk
                            .lines
                            .into_iter()
                            .map(|line| RepositoryDiffLine {
                                line_type: line.line_type,
                                content: line.content,
                            })
                            .collect::<Vec<_>>(),
                    })
                    .collect::<Vec<_>>(),
            })
            .collect::<Vec<_>>()
    }

    fn has_staged_files(&self, repository_root: &Path) -> Result<bool, AppErrorDto> {
        let status_output = GitExecutor::run(repository_root, &["status", "--porcelain=v1", "-u"])
            .map_err(|error| {
                self.map_git_operation_error(
                    error.kind,
                    error.details,
                    "check staged files before commit",
                )
            })?;
        let entries = parse_porcelain_v1_status(&status_output);
        Ok(entries.iter().any(|entry| entry.staged))
    }

    fn resolve_repository_root(&self, path: &Path) -> Result<PathBuf, AppErrorDto> {
        let root_output =
            GitExecutor::run(path, &["rev-parse", "--show-toplevel"]).map_err(|error| {
                let is_not_repository = is_not_git_repository_error(&error.details);
                match error.kind {
                    GitExecutorErrorKind::GitNotAvailable => AppErrorDto::new(
                        "GIT_NOT_AVAILABLE",
                        "Git is not available on this system",
                        error.details,
                        false,
                    ),
                    GitExecutorErrorKind::TimedOut => AppErrorDto::new(
                        "GIT_COMMAND_TIMEOUT",
                        "Git command timed out while opening repository",
                        error.details,
                        true,
                    ),
                    GitExecutorErrorKind::CommandFailed => AppErrorDto::new(
                        if is_not_repository {
                            "NOT_A_GIT_REPOSITORY"
                        } else {
                            "GIT_COMMAND_FAILED"
                        },
                        if is_not_repository {
                            "Selected folder is not a Git repository"
                        } else {
                            "Failed to resolve repository root"
                        },
                        error.details,
                        !is_not_repository,
                    ),
                }
            })?;

        Ok(PathBuf::from(root_output))
    }

    fn read_current_branch(&self, repository_root: &Path) -> Result<String, AppErrorDto> {
        GitExecutor::run(repository_root, &["branch", "--show-current"]).map_err(|error| {
            match error.kind {
                GitExecutorErrorKind::GitNotAvailable => AppErrorDto::new(
                    "GIT_NOT_AVAILABLE",
                    "Git is not available on this system",
                    error.details,
                    false,
                ),
                GitExecutorErrorKind::TimedOut => AppErrorDto::new(
                    "GIT_COMMAND_TIMEOUT",
                    "Git command timed out while reading current branch",
                    error.details,
                    true,
                ),
                GitExecutorErrorKind::CommandFailed => AppErrorDto::new(
                    "GIT_COMMAND_FAILED",
                    "Failed to read current branch",
                    error.details,
                    true,
                ),
            }
        })
    }
}

fn is_not_git_repository_error(details: &Option<String>) -> bool {
    let Some(details) = details else {
        return false;
    };

    details.to_ascii_lowercase().contains("not a git repository")
}

fn is_revert_conflict_error(details: &Option<String>) -> bool {
    let Some(details) = details else {
        return false;
    };
    let normalized_details = details.to_ascii_lowercase();
    normalized_details.contains("conflict")
        || normalized_details.contains("could not revert")
        || normalized_details.contains("after resolving the conflicts")
}

fn is_discard_unmerged_error(details: &Option<String>) -> bool {
    let Some(details) = details else {
        return false;
    };
    let normalized = details.to_ascii_lowercase();
    normalized.contains("unmerged")
        || normalized.contains("needs merge")
        || normalized.contains("you need to resolve")
}

fn is_discard_pathspec_error(details: &Option<String>) -> bool {
    let Some(details) = details else {
        return false;
    };
    let normalized = details.to_ascii_lowercase();
    normalized.contains("pathspec")
        || normalized.contains("did not match")
        || normalized.contains("ambiguous argument")
}
