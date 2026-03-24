import { invoke } from "@tauri-apps/api/core";

type TauriCommandMap = {
  open_repository: {
    args: { input: { folderPath: string } };
    result: unknown;
  };
  get_repository_status: {
    args: { input: { repositoryPath: string } };
    result: unknown;
  };
  stage_files: {
    args: { input: { repositoryPath: string; filePaths: string[] } };
    result: unknown;
  };
  unstage_files: {
    args: { input: { repositoryPath: string; filePaths: string[] } };
    result: unknown;
  };
  create_commit: {
    args: { input: { repositoryPath: string; message: string } };
    result: unknown;
  };
  revert_commit: {
    args: { input: { repositoryPath: string; commitHash: string } };
    result: unknown;
  };
  list_branches: {
    args: { input: { repositoryPath: string } };
    result: unknown;
  };
  checkout_branch: {
    args: { input: { repositoryPath: string; branchName: string } };
    result: unknown;
  };
  create_branch: {
    args: { input: { repositoryPath: string; branchName: string } };
    result: unknown;
  };
  get_commit_history: {
    args: { input: { repositoryPath: string; limit?: number } };
    result: unknown;
  };
  get_working_diff: {
    args: { input: { repositoryPath: string; filePath: string } };
    result: unknown;
  };
  get_commit_diff: {
    args: { input: { repositoryPath: string; commitHash: string; filePath?: string } };
    result: unknown;
  };
};

export async function callTauri<TCommand extends keyof TauriCommandMap>(
  command: TCommand,
  args: TauriCommandMap[TCommand]["args"]
): Promise<TauriCommandMap[TCommand]["result"]>;
export async function callTauri<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T>;
export async function callTauri<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  return invoke<T>(command, args);
}