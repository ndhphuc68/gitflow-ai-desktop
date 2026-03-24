#[derive(Debug, Clone)]
pub struct ParsedCommitRecord {
    pub hash: String,
    pub short_hash: String,
    pub author_name: String,
    pub author_email: String,
    pub authored_at: String,
    pub subject: String,
    pub parent_hashes: Vec<String>,
}

pub fn parse_git_log_records(output: &str) -> Vec<ParsedCommitRecord> {
    output
        .split('\x1e')
        .filter_map(|record| parse_single_record(record.trim_end_matches(['\r', '\n'])))
        .collect()
}

fn parse_single_record(record: &str) -> Option<ParsedCommitRecord> {
    if record.is_empty() {
        return None;
    }

    let fields = record
        .split('\x1f')
        .collect::<Vec<_>>();

    if fields.len() != 7 {
        return None;
    }

    let parent_hashes = if fields[6].is_empty() {
        Vec::new()
    } else {
        fields[6]
            .split_whitespace()
            .map(str::to_string)
            .collect::<Vec<_>>()
    };

    Some(ParsedCommitRecord {
        hash: fields[0].to_string(),
        short_hash: fields[1].to_string(),
        author_name: fields[2].to_string(),
        author_email: fields[3].to_string(),
        authored_at: fields[4].to_string(),
        subject: fields[5].to_string(),
        parent_hashes,
    })
}

#[cfg(test)]
mod tests {
    use super::parse_git_log_records;

    #[test]
    fn parse_git_log_records_parses_multiple_commits() {
        let output = concat!(
            "aaaaaaaa\x1faaaaaaa\x1fAlice\x1falice@example.com\x1f2026-03-24T10:00:00+00:00\x1fInitial commit\x1f\x1e",
            "bbbbbbbb\x1fbbbbbbb\x1fBob\x1fbob@example.com\x1f2026-03-24T11:00:00+00:00\x1fSecond commit\x1faaaaaaaa\x1e",
        );

        let commits = parse_git_log_records(output);

        assert_eq!(commits.len(), 2);
        assert_eq!(commits[0].hash, "aaaaaaaa");
        assert_eq!(commits[0].parent_hashes.len(), 0);
        assert_eq!(commits[1].hash, "bbbbbbbb");
        assert_eq!(commits[1].parent_hashes, vec!["aaaaaaaa"]);
    }

    #[test]
    fn parse_git_log_records_ignores_malformed_records() {
        let output = "valid\x1fshort\x1fA\x1fa@a.com\x1fdate\x1fsubject\x1fparent\x1einvalid\x1fonly-two\x1e";
        let commits = parse_git_log_records(output);
        assert_eq!(commits.len(), 1);
    }
}
