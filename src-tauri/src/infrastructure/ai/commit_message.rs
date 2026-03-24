use serde::Deserialize;
use std::time::Duration;

const OPENAI_CHAT_COMPLETIONS_PATH: &str = "/chat/completions";

#[derive(Debug, Clone)]
pub struct StagedCommitMessageSuggestion {
    pub title: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone)]
pub enum CommitMessageAiError {
    NotConfigured,
    RequestFailed { status: Option<u16>, message: String },
    Timeout,
    InvalidResponse(String),
}

pub struct OpenAiCommitMessageGenerator {
    client: reqwest::blocking::Client,
    api_key: String,
    base_url: String,
    model: String,
    request_timeout: Duration,
}

fn normalize_model_json_content(content: &str) -> String {
    let trimmed = content.trim();
    if trimmed.starts_with("```") {
        let mut rest = &trimmed[3..];
        if let Some(newline) = rest.find('\n') {
            rest = &rest[newline + 1..];
        }
        if let Some(end) = rest.rfind("```") {
            return rest[..end].trim().to_string();
        }
        return rest.trim().to_string();
    }
    trimmed.to_string()
}

impl OpenAiCommitMessageGenerator {
    pub fn try_from_env() -> Result<Self, CommitMessageAiError> {
        let api_key = std::env::var("GITFLOW_OPENAI_API_KEY")
            .or_else(|_| std::env::var("OPENAI_API_KEY"))
            .map_err(|_| CommitMessageAiError::NotConfigured)?;

        if api_key.trim().is_empty() {
            return Err(CommitMessageAiError::NotConfigured);
        }

        let base_url = std::env::var("GITFLOW_OPENAI_BASE_URL")
            .unwrap_or_else(|_| "https://api.openai.com/v1".to_string());
        let base_url = base_url.trim_end_matches('/').to_string();

        let model = std::env::var("GITFLOW_OPENAI_MODEL")
            .unwrap_or_else(|_| "gpt-4o-mini".to_string());

        let client = reqwest::blocking::Client::builder()
            .timeout(Duration::from_secs(90))
            .build()
            .map_err(|error| CommitMessageAiError::RequestFailed {
                status: None,
                message: error.to_string(),
            })?;

        Ok(Self {
            client,
            api_key,
            base_url,
            model,
            request_timeout: Duration::from_secs(90),
        })
    }

    pub fn generate_suggestions(
        &self,
        staged_diff_excerpt: &str,
    ) -> Result<Vec<StagedCommitMessageSuggestion>, CommitMessageAiError> {
        let url = format!("{}{}", self.base_url, OPENAI_CHAT_COMPLETIONS_PATH);
        let system = r#"You write Git commit messages from staged diffs only.
Respond with a single JSON object (no markdown) using this exact shape:
{"suggestions":[{"title":"...","description":"..."}]}
Rules:
- Provide between 2 and 3 suggestions.
- "title" is a single-line Conventional Commit subject: start with feat:, fix:, refactor:, or chore: (lowercase type).
- "description" is optional; if present, a short body (not repeating the title).
- Base conclusions only on the diff provided; do not invent files or changes."#;

        let user = format!(
            "Staged diff (may be truncated):\n```diff\n{staged_diff_excerpt}\n```"
        );

        let body = serde_json::json!({
            "model": &self.model,
            "messages": [
                { "role": "system", "content": system },
                { "role": "user", "content": user }
            ],
            "temperature": 0.2,
            "max_tokens": 600,
            "response_format": { "type": "json_object" }
        });

        let response = self
            .client
            .post(&url)
            .timeout(self.request_timeout)
            .header(
                "Authorization",
                format!("Bearer {}", self.api_key.trim()),
            )
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .map_err(|error| {
                if error.is_timeout() {
                    CommitMessageAiError::Timeout
                } else {
                    CommitMessageAiError::RequestFailed {
                        status: None,
                        message: error.to_string(),
                    }
                }
            })?;

        let status = response.status();
        let text = response.text().map_err(|error| CommitMessageAiError::RequestFailed {
            status: Some(status.as_u16()),
            message: error.to_string(),
        })?;

        if !status.is_success() {
            return Err(CommitMessageAiError::RequestFailed {
                status: Some(status.as_u16()),
                message: text,
            });
        }

        let completion: OpenAiChatCompletionResponse = serde_json::from_str(&text).map_err(|error| {
            CommitMessageAiError::InvalidResponse(format!("completion JSON: {error}"))
        })?;

        let content = completion
            .choices
            .first()
            .map(|choice| choice.message.content.trim())
            .filter(|content| !content.is_empty())
            .ok_or_else(|| {
                CommitMessageAiError::InvalidResponse("empty choices from AI".to_string())
            })?;

        let json_payload = normalize_model_json_content(content);

        let envelope: SuggestionsEnvelope = serde_json::from_str(&json_payload).map_err(|error| {
            CommitMessageAiError::InvalidResponse(format!("suggestion JSON: {error}"))
        })?;

        let suggestions: Vec<StagedCommitMessageSuggestion> = envelope
            .suggestions
            .into_iter()
            .filter_map(|raw| {
                let title = raw.title.trim();
                if title.is_empty() {
                    return None;
                }
                Some(StagedCommitMessageSuggestion {
                    title: title.to_string(),
                    description: raw
                        .description
                        .map(|description| description.trim().to_string())
                        .filter(|description| !description.is_empty()),
                })
            })
            .take(3)
            .collect();

        if suggestions.is_empty() {
            return Err(CommitMessageAiError::InvalidResponse(
                "no valid suggestions".to_string(),
            ));
        }

        Ok(suggestions)
    }
}

#[derive(Deserialize)]
struct OpenAiChatCompletionResponse {
    choices: Vec<OpenAiChoice>,
}

#[derive(Deserialize)]
struct OpenAiChoice {
    message: OpenAiMessage,
}

#[derive(Deserialize)]
struct OpenAiMessage {
    content: String,
}

#[derive(Deserialize)]
struct SuggestionsEnvelope {
    suggestions: Vec<SuggestionRaw>,
}

#[derive(Deserialize)]
struct SuggestionRaw {
    title: String,
    description: Option<String>,
}
