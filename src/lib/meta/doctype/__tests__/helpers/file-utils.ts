/**
 * Test helpers for file operations
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Create a temporary directory for testing
 */
export async function createTempDir(): Promise<string> {
	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'doctype-test-'));
	return tempDir;
}

/**
 * Clean up a temporary directory
 */
export async function cleanupTempDir(tempDir: string): Promise<void> {
	try {
		await fs.rm(tempDir, { recursive: true, force: true });
	} catch (error) {
		// Ignore cleanup errors
		console.warn(`Failed to cleanup temp dir ${tempDir}:`, error);
	}
}

/**
 * Write a temporary file with the given content
 */
export async function writeTempFile(
	tempDir: string,
	fileName: string,
	content: string
): Promise<string> {
	const filePath = path.join(tempDir, fileName);
	await fs.writeFile(filePath, content, 'utf-8');
	return filePath;
}

/**
 * Read a file's content as string
 */
export async function readFileContent(filePath: string): Promise<string> {
	return await fs.readFile(filePath, 'utf-8');
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Get file stats
 */
export async function getFileStats(filePath: string) {
	return await fs.stat(filePath);
}

/**
 * List all files in a directory
 */
export async function listFiles(dirPath: string): Promise<string[]> {
	return await fs.readdir(dirPath);
}

/**
 * Filter files by extension
 */
export function filterByExtension(files: string[], extension: string): string[] {
	return files.filter(file => file.endsWith(extension));
}