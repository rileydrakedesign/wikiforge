import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Initialize a git repository in the given directory.
 */
export async function initGitRepo(cwd: string): Promise<void> {
  await execFileAsync("git", ["init"], { cwd });
}

/**
 * Create an initial commit with all files.
 */
export async function initialCommit(cwd: string): Promise<void> {
  await execFileAsync("git", ["add", "-A"], { cwd });
  await execFileAsync(
    "git",
    ["commit", "-m", "Initial scaffold via WikiForge"],
    { cwd },
  );
}
