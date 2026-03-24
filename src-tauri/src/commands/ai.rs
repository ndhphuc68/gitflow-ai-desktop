use crate::application::generate_commit_message as generate_commit_message_use_case;
use crate::interfaces::dto::app_error::AppErrorDto;
use crate::interfaces::dto::generate_commit_message::{
    CommitMessageSuggestionDto, GenerateCommitMessageInputDto, GenerateCommitMessageResponseDto,
};

#[tauri::command]
pub async fn generate_commit_message(
    input: GenerateCommitMessageInputDto,
) -> GenerateCommitMessageResponseDto {
    let repository_path = input.repository_path;
    let join_result = tauri::async_runtime::spawn_blocking(move || {
        generate_commit_message_use_case::run(repository_path)
    })
    .await;

    let outcome = match join_result {
        Ok(value) => value,
        Err(_) => {
            return GenerateCommitMessageResponseDto {
                success: false,
                suggestions: None,
                truncated_diff: false,
                error: Some(AppErrorDto::new(
                    "AI_GENERATION_TASK_FAILED",
                    "Commit message generation was interrupted",
                    None,
                    true,
                )),
            };
        }
    };

    match outcome {
        Ok(outcome) => GenerateCommitMessageResponseDto {
            success: true,
            suggestions: Some(
                outcome
                    .suggestions
                    .into_iter()
                    .map(|suggestion| CommitMessageSuggestionDto {
                        title: suggestion.title,
                        description: suggestion.description,
                    })
                    .collect(),
            ),
            truncated_diff: outcome.truncated_diff,
            error: None,
        },
        Err(error) => GenerateCommitMessageResponseDto {
            success: false,
            suggestions: None,
            truncated_diff: false,
            error: Some(error),
        },
    }
}
