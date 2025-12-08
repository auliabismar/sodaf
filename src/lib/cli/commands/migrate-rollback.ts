/**
 * Migration Rollback Command
 * 
 * This file implements the migration rollback command for the CLI system.
 */

import type { CommandArgs, ExecutionContext, CommandOption } from '../types';
import { ExitCode } from '../types';
import { BaseCommand } from '../command';
import { MigrationService } from '../services/migration-service';

/**
 * Migration rollback command
 */
export class MigrateRollbackCommand extends BaseCommand {
	name = 'rollback';
	description = 'Rollback migrations';
	usage = 'sodaf migrate:rollback [options]';
	examples = [
		'sodaf migrate:rollback',
		'sodaf migrate:rollback --steps=3',
		'sodaf migrate:rollback --id=migration_123',
		'sodaf migrate:rollback --force'
	];
	options: CommandOption[] = [
		{
			name: 'site',
			short: 's',
			description: 'Target site name',
			hasValue: true
		},
		{
			name: 'steps',
			description: 'Number of migrations to rollback',
			hasValue: true,
			default: '1'
		},
		{
			name: 'id',
			description: 'Specific migration ID to rollback',
			hasValue: true
		},
		{
			name: 'force',
			short: 'f',
			description: 'Force rollback without confirmation',
			hasValue: false
		},
		{
			name: 'backup',
			short: 'b',
			description: 'Create backup before rollback',
			hasValue: false,
			default: true
		},
		{
			name: 'timeout',
			short: 't',
			description: 'Rollback timeout in seconds',
			hasValue: true,
			default: 300
		},
		{
			name: 'verbose',
			short: 'v',
			description: 'Show verbose output',
			hasValue: false
		}
	];
	
	requiresSite = true;
	
	/**
	 * Execute the migrate rollback command
	 * @param args Parsed command arguments
	 * @param context Execution context
	 * @returns Promise resolving to exit code
	 */
	protected async executeCommand(
		args: CommandArgs,
		context: ExecutionContext
	): Promise<number> {
		try {
			// Create migration service
			const migrationService = new MigrationService();
			
			// Parse rollback options
			const options = {
				site: args.getOption('site'),
				steps: args.hasOption('steps') ? parseInt(args.getOption('steps'), 10) : undefined,
				id: args.getOption('id'),
				force: args.hasFlag('force'),
				backup: args.getOption('backup'),
				timeout: args.getOption('timeout'),
				verbose: args.hasFlag('verbose')
			};
			
			// Validate options
			if (options.steps !== undefined && options.id !== undefined) {
				context.output.error('Cannot specify both --steps and --id options');
				return ExitCode.INVALID_ARGUMENTS;
			}
			
			if (options.steps !== undefined && options.steps <= 0) {
				context.output.error('Steps must be a positive number');
				return ExitCode.INVALID_ARGUMENTS;
			}
			
			// Show progress if verbose
			if (options.verbose) {
				context.output.info('Starting migration rollback...');
				context.output.info(`Site: ${options.site || 'default'}`);
				context.output.info(`Steps: ${options.steps || 'last'}`);
				context.output.info(`Migration ID: ${options.id || 'auto'}`);
				context.output.info(`Force: ${options.force}`);
				context.output.info(`Backup: ${options.backup}`);
			}
			
			// Confirm rollback if not forced
			if (!options.force) {
				const confirmed = await this.confirmRollback(options, context);
				if (!confirmed) {
					context.output.info('Rollback cancelled by user');
					return ExitCode.SUCCESS;
				}
			}
			
			// Execute rollback
			const result = await migrationService.rollbackMigrations(options, context);
			
			// Display result
			context.output.migrationResult(result);
			
			// Return appropriate exit code
			return result.success ? ExitCode.SUCCESS : ExitCode.MIGRATION_ERROR;
			
		} catch (error) {
			context.output.error(`Rollback failed: ${
				error instanceof Error ? error.message : String(error)
			}`);
			return ExitCode.MIGRATION_ERROR;
		}
	}
	
	/**
	 * Confirm rollback with user
	 * @param options Rollback options
	 * @param context Execution context
	 * @returns Promise resolving to confirmation
	 */
	private async confirmRollback(
		options: any,
		context: ExecutionContext
	): Promise<boolean> {
		// In a real implementation, this would prompt the user
		// For now, we'll assume confirmation in non-interactive mode
		return true;
	}
}