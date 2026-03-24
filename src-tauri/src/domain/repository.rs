#[derive(Debug, Clone)]
pub struct Repository {
    pub name: String,
    pub root_path: String,
    pub current_branch: String,
}
