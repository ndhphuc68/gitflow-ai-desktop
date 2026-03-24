#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DiffChangeType {
    Modified,
    Added,
    Deleted,
    Renamed,
    Binary,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DiffLineType {
    Context,
    Added,
    Removed,
}

#[derive(Debug, Clone)]
pub struct DiffLine {
    pub line_type: DiffLineType,
    pub content: String,
}

#[derive(Debug, Clone)]
pub struct DiffHunk {
    pub header: String,
    pub lines: Vec<DiffLine>,
}

#[derive(Debug, Clone)]
pub struct DiffFile {
    pub path: String,
    pub old_path: Option<String>,
    pub change_type: DiffChangeType,
    pub is_binary: bool,
    pub hunks: Vec<DiffHunk>,
}

pub fn parse_unified_diff(output: &str) -> Vec<DiffFile> {
    let mut files: Vec<DiffFile> = Vec::new();
    let mut current_file: Option<DiffFile> = None;
    let mut current_hunk: Option<DiffHunk> = None;

    for raw_line in output.lines() {
        let line = raw_line.trim_end_matches('\r');

        if line.starts_with("diff --git ") {
            flush_hunk(&mut current_file, &mut current_hunk);
            flush_file(&mut files, &mut current_file);
            current_file = Some(parse_diff_git_header(line));
            continue;
        }

        let Some(file) = current_file.as_mut() else {
            continue;
        };

        if let Some(rest) = line.strip_prefix("rename from ") {
            file.old_path = Some(rest.to_string());
            file.change_type = DiffChangeType::Renamed;
            continue;
        }
        if let Some(rest) = line.strip_prefix("rename to ") {
            file.path = rest.to_string();
            file.change_type = DiffChangeType::Renamed;
            continue;
        }
        if line.starts_with("new file mode ") {
            file.change_type = DiffChangeType::Added;
            continue;
        }
        if line.starts_with("deleted file mode ") {
            file.change_type = DiffChangeType::Deleted;
            continue;
        }
        if line.starts_with("Binary files ") || line.starts_with("GIT binary patch") {
            file.is_binary = true;
            file.change_type = DiffChangeType::Binary;
            continue;
        }
        if let Some(path) = line.strip_prefix("--- ") {
            if path != "/dev/null" {
                file.old_path = Some(path.trim_start_matches("a/").to_string());
            }
            continue;
        }
        if let Some(path) = line.strip_prefix("+++ ") {
            if path != "/dev/null" {
                file.path = path.trim_start_matches("b/").to_string();
            }
            continue;
        }

        if line.starts_with("@@ ") {
            flush_hunk(&mut current_file, &mut current_hunk);
            current_hunk = Some(DiffHunk {
                header: line.to_string(),
                lines: Vec::new(),
            });
            continue;
        }

        if let Some(hunk) = current_hunk.as_mut() {
            if let Some(content) = line.strip_prefix('+') {
                hunk.lines.push(DiffLine {
                    line_type: DiffLineType::Added,
                    content: content.to_string(),
                });
            } else if let Some(content) = line.strip_prefix('-') {
                hunk.lines.push(DiffLine {
                    line_type: DiffLineType::Removed,
                    content: content.to_string(),
                });
            } else if let Some(content) = line.strip_prefix(' ') {
                hunk.lines.push(DiffLine {
                    line_type: DiffLineType::Context,
                    content: content.to_string(),
                });
            } else if line.starts_with('\\') {
                hunk.lines.push(DiffLine {
                    line_type: DiffLineType::Context,
                    content: line.to_string(),
                });
            }
        }
    }

    flush_hunk(&mut current_file, &mut current_hunk);
    flush_file(&mut files, &mut current_file);
    files
}

/// Parses `git log -1 --name-status` / `git show --name-status` style lines into lightweight [`DiffFile`] records
/// with empty hunks. Used to list commit paths without loading full patches.
pub fn parse_git_show_name_status(output: &str) -> Vec<DiffFile> {
    let mut files: Vec<DiffFile> = Vec::new();

    for raw_line in output.lines() {
        let line = raw_line.trim_end_matches('\r').trim();
        if line.is_empty() {
            continue;
        }

        let parts = line.split('\t').collect::<Vec<_>>();
        if parts.len() == 2 {
            let status = parts[0];
            let path = parts[1].to_string();
            if path.is_empty() {
                continue;
            }
            let change_type = map_name_status_letter(status);
            files.push(DiffFile {
                path,
                old_path: None,
                change_type,
                is_binary: false,
                hunks: Vec::new(),
            });
            continue;
        }

        if parts.len() == 3 {
            let status = parts[0];
            let old_path = parts[1].to_string();
            let path = parts[2].to_string();
            if old_path.is_empty() || path.is_empty() {
                continue;
            }
            let change_type = if status.starts_with('R') || status.starts_with('C') {
                DiffChangeType::Renamed
            } else {
                map_name_status_letter(status)
            };
            files.push(DiffFile {
                path,
                old_path: Some(old_path),
                change_type,
                is_binary: false,
                hunks: Vec::new(),
            });
        }
    }

    files
}

fn map_name_status_letter(status: &str) -> DiffChangeType {
    let first = status.chars().next();
    match first {
        Some('A') => DiffChangeType::Added,
        Some('D') => DiffChangeType::Deleted,
        Some('R') | Some('C') => DiffChangeType::Renamed,
        Some('U') => DiffChangeType::Modified,
        Some('T') => DiffChangeType::Modified,
        _ => DiffChangeType::Modified,
    }
}

fn parse_diff_git_header(line: &str) -> DiffFile {
    let segments = line.split_whitespace().collect::<Vec<_>>();
    let old_path = segments
        .get(2)
        .map(|value| value.trim_start_matches("a/").to_string())
        .filter(|value| !value.is_empty());
    let new_path = segments
        .get(3)
        .map(|value| value.trim_start_matches("b/").to_string())
        .filter(|value| !value.is_empty())
        .or_else(|| old_path.clone())
        .unwrap_or_default();

    DiffFile {
        path: new_path,
        old_path,
        change_type: DiffChangeType::Modified,
        is_binary: false,
        hunks: Vec::new(),
    }
}

fn flush_hunk(current_file: &mut Option<DiffFile>, current_hunk: &mut Option<DiffHunk>) {
    let Some(file) = current_file.as_mut() else {
        return;
    };
    let Some(hunk) = current_hunk.take() else {
        return;
    };
    file.hunks.push(hunk);
}

fn flush_file(files: &mut Vec<DiffFile>, current_file: &mut Option<DiffFile>) {
    let Some(file) = current_file.take() else {
        return;
    };
    files.push(file);
}

#[cfg(test)]
mod name_status_tests {
    use super::{parse_git_show_name_status, DiffChangeType};

    #[test]
    fn parses_added_modified_deleted() {
        let out = "M\tsrc/foo.rs\nA\tnew.txt\nD\told.bin\n";
        let files = parse_git_show_name_status(out);
        assert_eq!(files.len(), 3);
        assert_eq!(files[0].path, "src/foo.rs");
        assert_eq!(files[0].change_type, DiffChangeType::Modified);
        assert_eq!(files[1].change_type, DiffChangeType::Added);
        assert_eq!(files[2].change_type, DiffChangeType::Deleted);
    }

    #[test]
    fn parses_rename_with_score() {
        let out = "R086\told/name.txt\tnew/name.txt\n";
        let files = parse_git_show_name_status(out);
        assert_eq!(files.len(), 1);
        assert_eq!(files[0].path, "new/name.txt");
        assert_eq!(files[0].old_path.as_deref(), Some("old/name.txt"));
        assert_eq!(files[0].change_type, DiffChangeType::Renamed);
    }

    #[test]
    fn skips_empty_lines() {
        assert!(parse_git_show_name_status("\n\n").is_empty());
    }
}
