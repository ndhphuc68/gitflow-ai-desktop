use crate::domain::repository_status::{RepositoryFileStatus, RepositoryStatusEntry};

const CONFLICT_CODES: [&str; 7] = ["DD", "AU", "UD", "UA", "DU", "AA", "UU"];

pub fn parse_porcelain_v1_status(output: &str) -> Vec<RepositoryStatusEntry> {
    let mut entries = Vec::new();

    for line in output.lines() {
        if line.len() < 3 {
            continue;
        }

        let x = line.as_bytes()[0] as char;
        let y = line.as_bytes()[1] as char;
        let xy = &line[0..2];
        let path = extract_path(line);
        if path.is_empty() {
            continue;
        }

        if xy == "??" {
            entries.push(RepositoryStatusEntry {
                path,
                status: RepositoryFileStatus::Untracked,
                staged: false,
            });
            continue;
        }

        if CONFLICT_CODES.contains(&xy) {
            entries.push(RepositoryStatusEntry {
                path,
                status: RepositoryFileStatus::Conflicted,
                staged: false,
            });
            continue;
        }

        if let Some(status) = map_staged_status(x) {
            entries.push(RepositoryStatusEntry {
                path: path.clone(),
                status,
                staged: true,
            });
        }

        if let Some(status) = map_unstaged_status(y) {
            entries.push(RepositoryStatusEntry {
                path,
                status,
                staged: false,
            });
        }
    }

    entries
}

fn extract_path(line: &str) -> String {
    if line.len() <= 3 {
        return String::new();
    }

    let raw = line[3..].trim();
    if let Some((_, right_path)) = split_rename_paths(raw) {
        return unquote_porcelain_path(right_path);
    }

    unquote_porcelain_path(raw)
}

fn split_rename_paths(raw: &str) -> Option<(&str, &str)> {
    let mut in_quotes = false;
    let mut escape_next = false;

    for (index, character) in raw.char_indices() {
        if escape_next {
            escape_next = false;
            continue;
        }

        if character == '\\' {
            escape_next = true;
            continue;
        }

        if character == '"' {
            in_quotes = !in_quotes;
            continue;
        }

        if !in_quotes && raw[index..].starts_with(" -> ") {
            let left_path = &raw[..index];
            let right_path = &raw[index + 4..];
            return Some((left_path, right_path));
        }
    }

    None
}

fn unquote_porcelain_path(path: &str) -> String {
    let trimmed = path.trim();
    if trimmed.len() >= 2 && trimmed.starts_with('"') && trimmed.ends_with('"') {
        let inner = &trimmed[1..trimmed.len() - 1];
        let mut unescaped = String::with_capacity(inner.len());
        let mut chars = inner.chars();

        while let Some(character) = chars.next() {
            if character == '\\' {
                match chars.next() {
                    Some('"') => unescaped.push('"'),
                    Some('\\') => unescaped.push('\\'),
                    Some('t') => unescaped.push('\t'),
                    Some('n') => unescaped.push('\n'),
                    Some(other) => {
                        unescaped.push('\\');
                        unescaped.push(other);
                    }
                    None => unescaped.push('\\'),
                }
            } else {
                unescaped.push(character);
            }
        }

        return unescaped;
    }

    trimmed.to_string()
}

fn map_staged_status(code: char) -> Option<RepositoryFileStatus> {
    match code {
        'M' => Some(RepositoryFileStatus::Modified),
        'A' => Some(RepositoryFileStatus::Added),
        'D' => Some(RepositoryFileStatus::Deleted),
        'R' | 'T' => Some(RepositoryFileStatus::Modified),
        'C' => Some(RepositoryFileStatus::Added),
        _ => None,
    }
}

fn map_unstaged_status(code: char) -> Option<RepositoryFileStatus> {
    match code {
        'M' => Some(RepositoryFileStatus::Modified),
        'A' => Some(RepositoryFileStatus::Added),
        'D' => Some(RepositoryFileStatus::Deleted),
        'R' | 'C' | 'T' => Some(RepositoryFileStatus::Modified),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::parse_porcelain_v1_status;

    #[test]
    fn parses_untracked_and_conflicted() {
        let output = "?? new-file.txt\nUU conflicted-file.txt";
        let entries = parse_porcelain_v1_status(output);
        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].path, "new-file.txt");
        assert!(!entries[0].staged);
        assert_eq!(entries[1].path, "conflicted-file.txt");
        assert!(!entries[1].staged);
    }

    #[test]
    fn parses_exact_xy_columns_for_basic_cases() {
        let output = " M file-unstaged.ts\nM  file-staged.ts\nMM file-both.ts\n?? file-untracked.ts\nUU file-conflicted.ts";
        let entries = parse_porcelain_v1_status(output);

        assert_eq!(entries.len(), 6);

        assert_eq!(entries[0].path, "file-unstaged.ts");
        assert!(!entries[0].staged);

        assert_eq!(entries[1].path, "file-staged.ts");
        assert!(entries[1].staged);

        assert_eq!(entries[2].path, "file-both.ts");
        assert!(entries[2].staged);
        assert_eq!(entries[3].path, "file-both.ts");
        assert!(!entries[3].staged);

        assert_eq!(entries[4].path, "file-untracked.ts");
        assert!(!entries[4].staged);

        assert_eq!(entries[5].path, "file-conflicted.ts");
        assert!(!entries[5].staged);
    }

    #[test]
    fn parses_staged_and_unstaged_for_same_path() {
        let output = "MM src/main.rs";
        let entries = parse_porcelain_v1_status(output);
        assert_eq!(entries.len(), 2);
        assert!(entries[0].staged);
        assert!(!entries[1].staged);
        assert_eq!(entries[0].path, "src/main.rs");
        assert_eq!(entries[1].path, "src/main.rs");
    }

    #[test]
    fn parses_rename_using_target_path() {
        let output = "R  old-name.rs -> new-name.rs";
        let entries = parse_porcelain_v1_status(output);
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].path, "new-name.rs");
        assert!(entries[0].staged);
    }

    #[test]
    fn parses_added_and_deleted_in_index() {
        let output = "A  src/new-file.rs\nD  src/old-file.rs";
        let entries = parse_porcelain_v1_status(output);

        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].path, "src/new-file.rs");
        assert!(entries[0].staged);
        assert_eq!(entries[1].path, "src/old-file.rs");
        assert!(entries[1].staged);
    }

    #[test]
    fn parses_conflict_codes_as_conflicted() {
        let output = "AA both-added.txt\nDU deleted-updated.txt\nUD updated-deleted.txt";
        let entries = parse_porcelain_v1_status(output);

        assert_eq!(entries.len(), 3);
        assert!(entries.iter().all(|entry| !entry.staged));
    }

    #[test]
    fn parses_staged_type_change() {
        let output = "T  src/main.rs";
        let entries = parse_porcelain_v1_status(output);
        assert_eq!(entries.len(), 1);
        assert!(entries[0].staged);
        assert_eq!(entries[0].path, "src/main.rs");
    }

    #[test]
    fn parses_staged_copy_as_added() {
        let output = "C  src/copied.rs";
        let entries = parse_porcelain_v1_status(output);
        assert_eq!(entries.len(), 1);
        assert!(entries[0].staged);
        assert_eq!(entries[0].path, "src/copied.rs");
        assert!(matches!(
            entries[0].status,
            crate::domain::repository_status::RepositoryFileStatus::Added
        ));
    }

    #[test]
    fn parses_unstaged_rename_and_copy() {
        let output = " R old.rs -> new.rs\n C src/original.rs -> src/copied.rs";
        let entries = parse_porcelain_v1_status(output);
        assert_eq!(entries.len(), 2);
        assert!(!entries[0].staged);
        assert_eq!(entries[0].path, "new.rs");
        assert!(!entries[1].staged);
        assert_eq!(entries[1].path, "src/copied.rs");
    }

    #[test]
    fn parses_quoted_paths_and_quoted_rename_with_arrow_in_name() {
        let output =
            "?? \"docs/my file.md\"\nR  \"src/old -> name.rs\" -> \"src/new -> name.rs\"";
        let entries = parse_porcelain_v1_status(output);

        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].path, "docs/my file.md");
        assert_eq!(entries[1].path, "src/new -> name.rs");
        assert!(entries[1].staged);
    }
}
