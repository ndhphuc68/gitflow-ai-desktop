#[derive(Debug, Clone)]
pub enum RepositoryFileStatus {
    Modified,
    Added,
    Deleted,
    Untracked,
    Conflicted,
}

#[derive(Debug, Clone)]
pub struct RepositoryStatusEntry {
    pub path: String,
    pub status: RepositoryFileStatus,
    pub staged: bool,
}
