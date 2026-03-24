mod commands;
mod application;
mod domain;
mod infrastructure;
mod interfaces;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::ai::generate_commit_message,
            commands::recent_repositories::get_recent_repositories,
            commands::recent_repositories::add_recent_repository,
            commands::recent_repositories::remove_recent_repository,
            commands::repository::open_repository,
            commands::repository::get_repository_status,
            commands::repository::stage_files,
            commands::repository::unstage_files,
            commands::repository::discard_changes,
            commands::repository::create_commit,
            commands::repository::revert_commit,
            commands::repository::list_branches,
            commands::repository::checkout_branch,
            commands::repository::create_branch,
            commands::repository::get_commit_history,
            commands::repository::get_working_diff,
            commands::repository::get_commit_diff,
            commands::repository::list_commit_changed_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
