/**
 * Migration Command
 * 
 * This file implements the main migration command for the CLI system.
 */

import type { CommandArgs, ExecutionContext, CommandOption } from '../types';
import { ExitCode } from '../types';
import { BaseCommand } from '../command';
import { MigrationService } from '../services/migration-service';

/**
 * Main migrate command
 */
export class MigrateCommand extends BaseCommand {
	name = 'migrate';
	description = 'Run pending migrations';
	usage = 'sodaf migrate [options]';
	examples = [
		'sodaf migrate',
		'sodaf migrate --site=mysite',
		'sodaf migrate --force',
		'sodaf migrate --verbose'
	];
	options: CommandOption[] = [
		{
			name: 'site',
			short: 's',
			description: 'Target site name',
			hasValue: true
		},
		{
			name: 'force',
			short: 'f',
			description: 'Force migration without confirmation',
			hasValue: false
		},
		{
			name: 'backup',
			short: 'b',
			description: 'Create backup before migration',
			hasValue: false,
			default: true
		},
		{
			name: 'timeout',
			short: 't',
			description: 'Migration timeout in seconds',
			hasValue: true,
			default: 300
		},
		{
			name: 'batch-size',
			description: 'Batch size for large migrations',
			hasValue: true,
			default: 1000
		},
		{
			name: 'continue-on-error',
			description: 'Continue migration on error',
			hasValue: false,
			default: false
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
	 * Execute the migrate command
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
			
			// Parse migration options
			const options = {
				site: args.getOption('site'),
				force: args.hasFlag('force'),
				backup: args.getOption('backup'),
				timeout: args.getOption('timeout'),
				batchSize: args.getOption('batch-size'),
				continueOnError: args.hasFlag('continue-on-error'),
				verbose: args.hasFlag('verbose')
			};
			
			// Show progress if verbose
			if (options.verbose) {
				context.output.info('Starting migration...');
				context.output.info(`Site: ${options.site || 'default'}`);
				context.output.info(`Force: ${options.force}`);
				context.output.info(`Backup: ${options.backup}`);
			}
			
			// Run migrations
			const result = await migrationService.runMigrations(options, context);
			
			// Display result
			context.output.migrationResult(result);
			
			// Return appropriate exit code
			return result.success ? ExitCode.SUCCESS : ExitCode.MIGRATION_ERROR;
			
		} catch (error) {
			context.output.error(`Migration failed: ${
				error instanceof Error ? error.message : String(error)
			}`);
			return ExitCode.MIGRATION_ERROR;
		}
	}
}