/**
 * Site Management Error Classes
 * 
 * This module defines all error classes used in site management
 * to avoid circular imports between modules.
 */

/**
 * Base error class for site management errors
 */
export class SiteError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'SiteError';
	}
}

/**
 * Error thrown when attempting to create a site that already exists
 */
export class SiteExistsError extends SiteError {
	constructor(siteName: string) {
		super(`Site '${siteName}' already exists`);
		this.name = 'SiteExistsError';
	}
}

/**
 * Error thrown when attempting to access a site that doesn't exist
 */
export class SiteNotFoundError extends SiteError {
	constructor(siteName: string) {
		super(`Site '${siteName}' not found`);
		this.name = 'SiteNotFoundError';
	}
}

/**
 * Error thrown when a backup file is not found
 */
export class BackupNotFoundError extends SiteError {
	constructor(backupPath: string) {
		super(`Backup file not found: ${backupPath}`);
		this.name = 'BackupNotFoundError';
	}
}

/**
 * Error thrown when a backup file is invalid or corrupted
 */
export class InvalidBackupError extends SiteError {
	constructor(backupPath: string, reason?: string) {
		super(`Invalid backup file: ${backupPath}${reason ? ` (${reason})` : ''}`);
		this.name = 'InvalidBackupError';
	}
}