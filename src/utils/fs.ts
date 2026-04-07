import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Ensure a directory exists, creating it and any parents if needed.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

/**
 * Write a file, creating parent directories as needed.
 */
export async function writeFileWithDirs(
  filePath: string,
  content: string,
): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, content, "utf-8");
}
