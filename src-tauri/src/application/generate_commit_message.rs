use crate::infrastructure::ai::commit_message::{
    CommitMessageAiError, OpenAiCommitMessageGenerator, StagedCommitMessageSuggestion,
};
use crate::infrastructure::git::repository_service::GitRepositoryService;
use crate::interfaces::dto::app_error::AppErrorDto;

const MAX_STAGED_DIFF_LINES: usize = 800;
const MAX_STAGED_DIFF_CHARS: usize = 48_000;
const ERROR_DETAIL_MAX_CHARS: usize = 480;

pub struct GenerateCommitMessageOutcome {
    pub suggestions: Vec<StagedCommitMessageSuggestion>,
    pub truncated_diff: bool,
}

fn sanitize_diff(input: &str) -> String {
    input.chars().filter(|&character| character != '\0').collect()
}

fn truncate_diff_lines_and_bytes(input: &str, max_lines: usize, max_bytes: usize) -> (String, bool) {
    let mut truncated = false;
    let line_count = input.lines().count();
    let after_lines = if line_count > max_lines {
        truncated = true;
        input.lines().take(max_lines).collect::<Vec<_>>().join("\n")
    } else {
        input.to_string()
    };

    if after_lines.len() <= max_bytes {
        return (after_lines, truncated);
    }

    let mut end = max_bytes;
    while end > 0 && !after_lines.is_char_boundary(end) {
        end -= 1;
    }
    let out = format!(
        "{}\n\n[... staged diff truncated for AI ({max_bytes} byte limit after line cap) ...]",
        &after_lines[..end]
    );
    (out, true)
}

fn sanitize_error_detail(raw: &str) -> String {
    let filtered: String = raw
        .chars()
        .filter(|character| match character {
            '\n' | '\r' | '\t' => true,
            c if c.is_control() => false,
            _ => true,
        })
        .take(ERROR_DETAIL_MAX_CHARS.saturating_add(1))
        .collect();
    let count = filtered.chars().count();
    if count > ERROR_DETAIL_MAX_CHARS {
        filtered
            .chars()
            .take(ERROR_DETAIL_MAX_CHARS)
            .chain(std::iter::once('…'))
            .collect()
    } else {
        filtered
    }
}

fn map_ai_error(error: CommitMessageAiError) -> AppErrorDto {
    match error {
        CommitMessageAiError::NotConfigured => AppErrorDto::new(
            "AI_NOT_CONFIGURED",
            "Set GITFLOW_OPENAI_API_KEY or OPENAI_API_KEY to generate commit messages",
            None,
            true,
        ),
        CommitMessageAiError::Timeout => AppErrorDto::new(
            "AI_TIMEOUT",
            "AI request timed out. Try again with a smaller staged change set",
            None,
            true,
        ),
        CommitMessageAiError::RequestFailed { status, message } => {
            let safe = sanitize_error_detail(&message);
            AppErrorDto::new(
                "AI_REQUEST_FAILED",
                "AI provider request failed",
                Some(format!("status={status:?} {safe}")),
                true,
            )
        }
        CommitMessageAiError::InvalidResponse(details) => AppErrorDto::new(
            "AI_INVALID_RESPONSE",
            "AI returned an unexpected response",
            Some(sanitize_error_detail(&details)),
            true,
        ),
    }
}

pub fn run(repository_path: String) -> Result<GenerateCommitMessageOutcome, AppErrorDto> {
    let git = GitRepositoryService::new();
    let status_entries = git.get_repository_status(repository_path.clone())?;
    let has_staged = status_entries.iter().any(|entry| entry.staged);
    if !has_staged {
        return Err(AppErrorDto::new(
            "NO_STAGED_CHANGES",
            "Stage files before generating a commit message",
            None,
            true,
        ));
    }

    let raw = git.get_staged_diff_text(repository_path)?;
    let sanitized = sanitize_diff(&raw);
    if sanitized.trim().is_empty() {
        return Err(AppErrorDto::new(
            "EMPTY_STAGED_DIFF",
            "Staged changes have no textual diff to send to AI (for example binary-only changes)",
            None,
            true,
        ));
    }

    let (excerpt, truncated_diff) =
        truncate_diff_lines_and_bytes(&sanitized, MAX_STAGED_DIFF_LINES, MAX_STAGED_DIFF_CHARS);

    let generator = OpenAiCommitMessageGenerator::try_from_env().map_err(map_ai_error)?;
    let suggestions = generator
        .generate_suggestions(&excerpt)
        .map_err(map_ai_error)?;

    Ok(GenerateCommitMessageOutcome {
        suggestions,
        truncated_diff,
    })
}
