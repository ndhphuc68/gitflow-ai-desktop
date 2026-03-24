use std::path::Path;
use std::process::Command;
use std::process::Output;
use std::process::Stdio;
use std::time::Duration;
use wait_timeout::ChildExt;

#[derive(Debug, Clone)]
pub enum GitExecutorErrorKind {
    GitNotAvailable,
    TimedOut,
    CommandFailed,
}

#[derive(Debug, Clone)]
pub struct GitExecutorError {
    pub kind: GitExecutorErrorKind,
    pub details: Option<String>,
}

pub struct GitExecutor;

impl GitExecutor {
    pub fn run(current_dir: &Path, args: &[&str]) -> Result<String, GitExecutorError> {
        Self::run_with_timeout(current_dir, args, Duration::from_secs(10))
    }

    pub fn run_with_timeout(
        current_dir: &Path,
        args: &[&str],
        timeout: Duration,
    ) -> Result<String, GitExecutorError> {
        let output = Self::run_output(current_dir, args, timeout)?;
        let stdout = String::from_utf8_lossy(&output.stdout)
            .trim_end_matches(['\r', '\n'])
            .to_string();
        Ok(stdout)
    }

    pub fn run_with_timeout_utf8_stdout(
        current_dir: &Path,
        args: &[&str],
        timeout: Duration,
    ) -> Result<String, GitExecutorError> {
        let output = Self::run_output(current_dir, args, timeout)?;
        let stdout = String::from_utf8(output.stdout).map_err(|_| GitExecutorError {
            kind: GitExecutorErrorKind::CommandFailed,
            details: Some("Git stdout is not valid UTF-8".to_string()),
        })?;
        Ok(stdout.trim_end_matches(['\r', '\n']).to_string())
    }

    fn run_output(
        current_dir: &Path,
        args: &[&str],
        timeout: Duration,
    ) -> Result<Output, GitExecutorError> {
        let mut child = Command::new("git")
            .current_dir(current_dir)
            .args(args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|error| {
                let kind = if error.kind() == std::io::ErrorKind::NotFound {
                    GitExecutorErrorKind::GitNotAvailable
                } else {
                    GitExecutorErrorKind::CommandFailed
                };

                GitExecutorError {
                    kind,
                    details: Some(error.to_string()),
                }
            })?;

        let status = child
            .wait_timeout(timeout)
            .map_err(|error| GitExecutorError {
                kind: GitExecutorErrorKind::CommandFailed,
                details: Some(error.to_string()),
            })?;

        let exit_status = match status {
            Some(status) => status,
            None => {
                let _ = child.kill();
                let _ = child.wait();
                return Err(GitExecutorError {
                    kind: GitExecutorErrorKind::TimedOut,
                    details: Some("Git command timed out".to_string()),
                });
            }
        };

        let output = child.wait_with_output().map_err(|error| GitExecutorError {
            kind: GitExecutorErrorKind::CommandFailed,
            details: Some(error.to_string()),
        })?;

        if exit_status.success() {
            return Ok(output);
        }

        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        Err(GitExecutorError {
            kind: GitExecutorErrorKind::CommandFailed,
            details: if stderr.is_empty() { None } else { Some(stderr) },
        })
    }
}
