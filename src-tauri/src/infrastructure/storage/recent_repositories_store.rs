use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri::Manager;

use crate::interfaces::dto::app_error::AppErrorDto;

const STORE_FILE_NAME: &str = "recent_repositories.json";
const STORE_TMP_NAME: &str = "recent_repositories.json.tmp";
const STORE_CORRUPT_BACKUP: &str = "recent_repositories.corrupt.bak";
const MAX_RECENT_ENTRIES: usize = 30;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentRepositoryRecord {
    pub name: String,
    pub root_path: String,
    pub last_opened_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RecentRepositoriesFile {
    #[serde(default)]
    repositories: Vec<RecentRepositoryRecord>,
}

pub struct RecentRepositoriesStore {
    file_path: PathBuf,
}

impl RecentRepositoriesStore {
    pub fn for_app(app: &AppHandle) -> Result<Self, AppErrorDto> {
        let dir = app.path().app_data_dir().map_err(|error| {
            AppErrorDto::new(
                "RECENTS_STORAGE_UNAVAILABLE",
                "Could not resolve application data directory for recent repositories",
                Some(error.to_string()),
                true,
            )
        })?;

        fs::create_dir_all(&dir).map_err(|error| {
            AppErrorDto::new(
                "RECENTS_STORAGE_WRITE_FAILED",
                "Could not create application data directory",
                Some(error.to_string()),
                true,
            )
        })?;

        Ok(Self {
            file_path: dir.join(STORE_FILE_NAME),
        })
    }

    pub fn list_sorted(&self) -> Result<Vec<RecentRepositoryRecord>, AppErrorDto> {
        let mut file = self.read_file_or_default()?;
        file.repositories.sort_by(|a, b| {
            let ta = a.last_opened_at.as_deref().unwrap_or("");
            let tb = b.last_opened_at.as_deref().unwrap_or("");
            tb.cmp(ta)
        });
        Ok(file.repositories)
    }

    pub fn upsert(&self, name: String, root_path: String) -> Result<(), AppErrorDto> {
        let stored_root = validate_non_empty_path(&root_path)?;
        let key = identity_key(&stored_root);

        let mut file = self.read_file_or_default()?;
        file
            .repositories
            .retain(|entry| identity_key(&entry.root_path) != key);

        let record = RecentRepositoryRecord {
            name,
            root_path: stored_root,
            last_opened_at: Some(Utc::now().to_rfc3339()),
        };

        file.repositories.insert(0, record);
        if file.repositories.len() > MAX_RECENT_ENTRIES {
            file.repositories.truncate(MAX_RECENT_ENTRIES);
        }

        self.write_file_atomic(&file)
    }

    pub fn remove(&self, root_path: &str) -> Result<(), AppErrorDto> {
        let key = identity_key(root_path.trim());
        let mut file = self.read_file_or_default()?;
        file
            .repositories
            .retain(|entry| identity_key(&entry.root_path) != key);
        self.write_file_atomic(&file)
    }

    fn tmp_path(&self) -> PathBuf {
        self.file_path
            .parent()
            .map(|parent| parent.join(STORE_TMP_NAME))
            .unwrap_or_else(|| PathBuf::from(STORE_TMP_NAME))
    }

    fn read_file_or_default(&self) -> Result<RecentRepositoriesFile, AppErrorDto> {
        if !self.file_path.exists() {
            return Ok(RecentRepositoriesFile {
                repositories: Vec::new(),
            });
        }

        let raw = fs::read_to_string(&self.file_path).map_err(|error| {
            AppErrorDto::new(
                "RECENTS_STORAGE_READ_FAILED",
                "Could not read recent repositories file",
                Some(error.to_string()),
                true,
            )
        })?;

        let trimmed = raw.trim();
        if trimmed.is_empty() {
            return Ok(RecentRepositoriesFile {
                repositories: Vec::new(),
            });
        }

        match serde_json::from_str::<RecentRepositoriesFile>(trimmed) {
            Ok(mut file) => {
                file.repositories = sanitize_loaded_entries(file.repositories);
                Ok(file)
            }
            Err(_) => {
                self.quarantine_corrupt_store_file();
                Ok(RecentRepositoriesFile {
                    repositories: Vec::new(),
                })
            }
        }
    }

    fn quarantine_corrupt_store_file(&self) {
        let backup_path = self
            .file_path
            .parent()
            .map(|parent| parent.join(STORE_CORRUPT_BACKUP))
            .unwrap_or_else(|| PathBuf::from(STORE_CORRUPT_BACKUP));
        let _ = fs::remove_file(&backup_path);
        let _ = fs::rename(&self.file_path, &backup_path);
    }

    fn write_file_atomic(&self, file: &RecentRepositoriesFile) -> Result<(), AppErrorDto> {
        let json = serde_json::to_string_pretty(file).map_err(|error| {
            AppErrorDto::new(
                "RECENTS_STORAGE_SERIALIZE_FAILED",
                "Could not serialize recent repositories",
                Some(error.to_string()),
                true,
            )
        })?;

        let tmp_path = self.tmp_path();
        fs::write(&tmp_path, &json).map_err(|error| {
            AppErrorDto::new(
                "RECENTS_STORAGE_WRITE_FAILED",
                "Could not write recent repositories file",
                Some(error.to_string()),
                true,
            )
        })?;

        fs::rename(&tmp_path, &self.file_path).map_err(|error| {
            let _ = fs::remove_file(&tmp_path);
            AppErrorDto::new(
                "RECENTS_STORAGE_WRITE_FAILED",
                "Could not finalize recent repositories file",
                Some(error.to_string()),
                true,
            )
        })?;

        Ok(())
    }
}

fn sanitize_loaded_entries(entries: Vec<RecentRepositoryRecord>) -> Vec<RecentRepositoryRecord> {
    let mut best: HashMap<String, RecentRepositoryRecord> = HashMap::new();
    for entry in entries {
        let name = entry.name.trim().to_string();
        let root_path = entry.root_path.trim().to_string();
        if name.is_empty() || root_path.is_empty() {
            continue;
        }
        let key = identity_key(&root_path);
        if key.is_empty() {
            continue;
        }
        let candidate = RecentRepositoryRecord {
            name,
            root_path,
            last_opened_at: entry.last_opened_at,
        };
        match best.get_mut(&key) {
            Some(existing) => {
                if last_opened_is_newer(&candidate.last_opened_at, &existing.last_opened_at) {
                    *existing = candidate;
                }
            }
            None => {
                best.insert(key, candidate);
            }
        }
    }
    best.into_values().collect()
}

fn last_opened_is_newer(a: &Option<String>, b: &Option<String>) -> bool {
    match (a, b) {
        (Some(x), Some(y)) => x > y,
        (Some(_), None) => true,
        _ => false,
    }
}

fn validate_non_empty_path(path: &str) -> Result<String, AppErrorDto> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err(AppErrorDto::new(
            "INVALID_PATH",
            "Repository path is required",
            None,
            true,
        ));
    }
    Ok(trimmed.to_string())
}

/// Stable key for deduplicating paths that refer to the same directory.
fn identity_key(path: &str) -> String {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    let p = PathBuf::from(trimmed);
    if p.exists() {
        if let Ok(canonical) = p.canonicalize() {
            return fold_path_for_compare(&canonical.to_string_lossy());
        }
    }
    fold_path_for_compare(trimmed)
}

fn fold_path_for_compare(path: &str) -> String {
    #[cfg(windows)]
    {
        path.to_lowercase()
    }
    #[cfg(not(windows))]
    {
        path.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_non_empty_path_rejects_blank() {
        assert!(validate_non_empty_path("").is_err());
        assert!(validate_non_empty_path("   ").is_err());
    }

    #[test]
    fn identity_key_empty_for_blank_path() {
        assert_eq!(identity_key(""), "");
        assert_eq!(identity_key("   "), "");
    }

    #[test]
    fn sanitize_keeps_newer_duplicate_by_last_opened() {
        let entries = vec![
            RecentRepositoryRecord {
                name: "a".to_string(),
                root_path: "/same/path".to_string(),
                last_opened_at: Some("2020-01-01T00:00:00Z".to_string()),
            },
            RecentRepositoryRecord {
                name: "b".to_string(),
                root_path: "/same/path".to_string(),
                last_opened_at: Some("2025-01-01T00:00:00Z".to_string()),
            },
        ];
        let out = sanitize_loaded_entries(entries);
        assert_eq!(out.len(), 1);
        assert_eq!(out[0].name, "b");
    }
}
