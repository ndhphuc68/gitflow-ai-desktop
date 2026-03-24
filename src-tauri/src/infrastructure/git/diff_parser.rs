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
