use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppErrorDto {
    pub code: String,
    pub message: String,
    pub details: Option<String>,
    pub recoverable: bool,
}

impl AppErrorDto {
    pub fn new(code: &str, message: &str, details: Option<String>, recoverable: bool) -> Self {
        Self {
            code: code.to_string(),
            message: message.to_string(),
            details,
            recoverable,
        }
    }
}
