/**
 * Migration Status Command
 * 
 * This file implements the migration status command for the CLI system.
 */

import type { CommandArgs, ExecutionContext, CommandOption } from '../types';
import { ExitCode } from '../types';
import { BaseCommand } from '../command';
import { MigrationService } from '../services/migration-service';

/**
 * Migration status command
 */
export class MigrateStatusCommand extends BaseCommand {
	name = 'status';
	description = 'Show migration status';
	usage = 'sodaf migrate:status [options]';
	examples = [
		'sodaf migrate:status',
		'sodaf migrate:status --site=mysite',
		'sodaf migrate:status --verbose'
	];
	options: CommandOption[] = [
		{
			name: 'site',
			short: 's',
			description: 'Target site name',
			hasValue: true
		},
		{
			name: 'format',
			description: 'Output format',
			hasValue: true,
			choices: ['text', 'json', 'table'],
			default: 'text'
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
	 * Execute the migrate status command
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
			
			// Parse command options
			const siteName = args.getOption('site');
			const outputFormat = args.getOption('format') as 'text' | 'json' | 'table';
			const verbose = args.hasFlag('verbose');
			
			// Show progress if verbose
			if (verbose) {
				context.output.info('Getting migration status...');
			}
			
			// Get migration status
			const history = await migrationService.getMigrationStatus(
				siteName || 'default',
				context
			);
			
			// Display results
			this.displayStatus(history, outputFormat, context);
			
			return ExitCode.SUCCESS;
			
		} catch (error) {
			context.output.error(`Failed to get migration status: ${
				error instanceof Error ? error.message : String(error)
			}`);
			return ExitCode.MIGRATION_ERROR;
		}
	}
	
	/**
	 * Display migration status
	 * @param history Migration history
	 * @param outputFormat Output format
	 * @param context Execution context
	 */
	private displayStatus(
		history: any,
		outputFormat: 'text' | 'json' | 'table',
		context: ExecutionContext
	): void {
		switch (outputFormat) {
			case 'json':
				context.output.info(JSON.stringify(history, null, 2));
				break;
				
			case 'table':
				this.displayStatusTable(history, context);
				break;
				
			case 'text':
			default:
				this.displayStatusText(history, context);
				break;
		}
	}
	
	/**
	 * Display migration status as text
	 * @param history Migration history
	 * @param context Execution context
	 */
	private displayStatusText(history: any, context: ExecutionContext): void {
		context.output.info('Migration Status:');
		context.output.info('');
		
		// Show statistics
		const stats = history.stats;
		context.output.info(`  Total: ${stats.total}`);
		context.output.info(`  Applied: ${stats.applied}`);
		context.output.info(`  Pending: ${stats.pending}`);
		context.output.info(`  Failed: ${stats.failed}`);
		context.output.info(`  Destructive: ${stats.destructive}`);
		
		if (stats.lastMigrationDate) {
			context.output.info(`  Last Migration: ${stats.lastMigrationDate.toISOString()}`);
		}
		
		// Show recent migrations
		if (history.migrations.length > 0) {
			context.output.info('');
			context.output.info('Recent Migrations:');
			
			const recentMigrations = history.migrations.slice(0, 10);
			for (const migration of recentMigrations) {
				const status = migration.applied ? 'Applied' : 'Failed';
				const destructive = migration.destructive ? ' (Destructive)' : '';
				
				context.output.info(`  ${migration.id} - ${migration.doctype} - ${status}${destructive}`);
				context.output.info(`    ${migration.timestamp.toISOString()}`);
			}
		}
	}
	
	/**
	 * Display migration status as table
	 * @param history Migration history
	 * @param context Execution context
	 */
	private displayStatusTable(history: any, context: ExecutionContext): void {
		// Prepare table data
		const tableData = [
			['Total', history.stats.total.toString()],
			['Applied', history.stats.applied.toString()],
			['Pending', history.stats.pending.toString()],
			['Failed', history.stats.failed.toString()],
			['Destructive', history.stats.destructive.toString()]
		];
		
		if (history.stats.lastMigrationDate) {
			tableData.push([
				'Last Migration',
				history.stats.lastMigrationDate.toISOString()
			]);
		}
		
		// Add migration rows
		for (const migration of history.migrations.slice(0, 10)) {
			tableData.push([
				migration.id,
				migration.doctype,
				migration.applied ? 'Yes' : 'No',
				migration.timestamp.toISOString(),
				migration.destructive ? 'Yes' : 'No'
			]);
		}
		
		// Display table
		const table = context.output.table(tableData, [
			'Metric', 'Value',
			'ID', 'DocType', 'Applied', 'Timestamp', 'Destructive'
		]);
		
		context.output.info(table);
	}
}