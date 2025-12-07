/**
 * Validation Type Tests (P2-005-V1 to V6)
 * 
 * This file contains tests for validation types to ensure they compile
 * correctly and handle various validation scenarios.
 */

import { describe, it, expect } from 'vitest';
import type {
	MigrationValidation,
	ValidationError,
	ValidationWarning,
	MigrationError
} from '../types';
import { MigrationErrorCode } from '../types';
import { testErrorMessages } from './fixtures/test-data';

describe('Validation Tests', () => {
	/**
	 * Test P2-005-V1: MigrationValidation with errors
	 */
	it('P2-005-V1: should create MigrationValidation with errors', () => {
		const errors: ValidationError[] = [
			{
				code: 'SCHEMA_VALIDATION_FAILED',
				message: 'Schema validation failed for field type',
				field: 'test_field',
				severity: 'error',
				suggestion: 'Check field type definition'
			},
			{
				code: 'COLUMN_NOT_FOUND',
				message: 'Column not found in table',
				field: 'missing_field',
				severity: 'error',
				suggestion: 'Verify column exists in table'
			}
		];
		
		const validation: MigrationValidation = {
			valid: false,
			errors: errors,
			warnings: [],
			recommendations: [
				'Fix field type definitions',
				'Verify all columns exist in target table'
			]
		};
		
		expect(validation).toBeDefined();
		expect(validation.valid).toBe(false);
		expect(validation.errors).toHaveLength(2);
		expect(validation.warnings).toHaveLength(0);
		expect(validation.recommendations).toHaveLength(2);
		
		// Check first error
		expect(validation.errors[0].code).toBe('SCHEMA_VALIDATION_FAILED');
		expect(validation.errors[0].message).toBe('Schema validation failed for field type');
		expect(validation.errors[0].field).toBe('test_field');
		expect(validation.errors[0].severity).toBe('error');
		expect(validation.errors[0].suggestion).toBe('Check field type definition');
		
		// Check second error
		expect(validation.errors[1].code).toBe('COLUMN_NOT_FOUND');
		expect(validation.errors[1].message).toBe('Column not found in table');
		expect(validation.errors[1].field).toBe('missing_field');
		expect(validation.errors[1].severity).toBe('error');
		expect(validation.errors[1].suggestion).toBe('Verify column exists in table');
	});

	/**
	 * Test P2-005-V2: MigrationValidation with warnings
	 */
	it('P2-005-V2: should create MigrationValidation with warnings', () => {
		const warnings: ValidationWarning[] = [
			{
				code: 'DATA_LOSS_RISK',
				message: 'Data loss risk detected',
				field: 'test_field',
				type: 'data_loss'
			},
			{
				code: 'PERFORMANCE_IMPACT',
				message: 'Index may impact performance',
				type: 'performance'
			},
			{
				code: 'COMPATIBILITY_ISSUE',
				message: 'Compatibility issue detected',
				type: 'compatibility'
			},
			{
				code: 'OTHER_WARNING',
				message: 'Other warning',
				type: 'other'
			}
		];
		
		const validation: MigrationValidation = {
			valid: true,
			errors: [],
			warnings: warnings,
			recommendations: [
				'Backup data before proceeding',
				'Test performance impact in staging',
				'Verify compatibility with existing systems'
			]
		};
		
		expect(validation).toBeDefined();
		expect(validation.valid).toBe(true);
		expect(validation.errors).toHaveLength(0);
		expect(validation.warnings).toHaveLength(4);
		expect(validation.recommendations).toHaveLength(3);
		
		// Check data loss warning
		expect(validation.warnings[0].code).toBe('DATA_LOSS_RISK');
		expect(validation.warnings[0].message).toBe('Data loss risk detected');
		expect(validation.warnings[0].field).toBe('test_field');
		expect(validation.warnings[0].type).toBe('data_loss');
		
		// Check performance warning
		expect(validation.warnings[1].code).toBe('PERFORMANCE_IMPACT');
		expect(validation.warnings[1].message).toBe('Index may impact performance');
		expect(validation.warnings[1].type).toBe('performance');
		
		// Check compatibility warning
		expect(validation.warnings[2].code).toBe('COMPATIBILITY_ISSUE');
		expect(validation.warnings[2].message).toBe('Compatibility issue detected');
		expect(validation.warnings[2].type).toBe('compatibility');
		
		// Check other warning
		expect(validation.warnings[3].code).toBe('OTHER_WARNING');
		expect(validation.warnings[3].message).toBe('Other warning');
		expect(validation.warnings[3].type).toBe('other');
	});

	/**
	 * Test P2-005-V3: ValidationError with all properties
	 */
	it('P2-005-V3: should create ValidationError with all properties', () => {
		const error: ValidationError = {
			code: 'SCHEMA_VALIDATION_FAILED',
			message: 'Schema validation failed for field type',
			field: 'test_field',
			severity: 'error',
			suggestion: 'Check field type definition'
		};
		
		expect(error).toBeDefined();
		expect(error.code).toBe('SCHEMA_VALIDATION_FAILED');
		expect(error.message).toBe('Schema validation failed for field type');
		expect(error.field).toBe('test_field');
		expect(error.severity).toBe('error');
		expect(error.suggestion).toBe('Check field type definition');
	});

	/**
	 * Test P2-005-V4: ValidationWarning with types
	 */
	it('P2-005-V4: should create ValidationWarning with types', () => {
		const dataLossWarning: ValidationWarning = {
			code: 'DATA_LOSS_RISK',
			message: 'Data loss risk detected',
			field: 'test_field',
			type: 'data_loss'
		};
		
		const performanceWarning: ValidationWarning = {
			code: 'PERFORMANCE_IMPACT',
			message: 'Index may impact performance',
			type: 'performance'
		};
		
		const compatibilityWarning: ValidationWarning = {
			code: 'COMPATIBILITY_ISSUE',
			message: 'Compatibility issue detected',
			type: 'compatibility'
		};
		
		const otherWarning: ValidationWarning = {
			code: 'OTHER_WARNING',
			message: 'Other warning',
			type: 'other'
		};
		
		// Check data loss warning
		expect(dataLossWarning.type).toBe('data_loss');
		expect(dataLossWarning.code).toBe('DATA_LOSS_RISK');
		expect(dataLossWarning.message).toBe('Data loss risk detected');
		expect(dataLossWarning.field).toBe('test_field');
		
		// Check performance warning
		expect(performanceWarning.type).toBe('performance');
		expect(performanceWarning.code).toBe('PERFORMANCE_IMPACT');
		expect(performanceWarning.message).toBe('Index may impact performance');
		
		// Check compatibility warning
		expect(compatibilityWarning.type).toBe('compatibility');
		expect(compatibilityWarning.code).toBe('COMPATIBILITY_ISSUE');
		expect(compatibilityWarning.message).toBe('Compatibility issue detected');
		
		// Check other warning
		expect(otherWarning.type).toBe('other');
		expect(otherWarning.code).toBe('OTHER_WARNING');
		expect(otherWarning.message).toBe('Other warning');
	});

	/**
	 * Test P2-005-V5: MigrationError with context
	 */
	it('P2-005-V5: should create MigrationError with context', () => {
		const error: MigrationError = {
			code: 'SQL_EXECUTION_ERROR',
			message: 'SQL execution failed',
			details: {
				sql: 'INVALID SQL',
				error: 'syntax error',
				line: 1,
				position: 1
			},
			doctype: 'TestDocType',
			field: 'test_field',
			sql: 'INVALID SQL',
			stack: 'Error: SQL syntax error\n    at test.js:1:1',
			severity: 'error',
			recoverable: false,
			recoveryAction: 'Fix SQL syntax and retry'
		};
		
		expect(error).toBeDefined();
		expect(error.code).toBe('SQL_EXECUTION_ERROR');
		expect(error.message).toBe('SQL execution failed');
		expect(error.details?.sql).toBe('INVALID SQL');
		expect(error.details?.error).toBe('syntax error');
		expect(error.details?.line).toBe(1);
		expect(error.details?.position).toBe(1);
		expect(error.doctype).toBe('TestDocType');
		expect(error.field).toBe('test_field');
		expect(error.sql).toBe('INVALID SQL');
		expect(error.stack).toBe('Error: SQL syntax error\n    at test.js:1:1');
		expect(error.severity).toBe('error');
		expect(error.recoverable).toBe(false);
		expect(error.recoveryAction).toBe('Fix SQL syntax and retry');
	});

	/**
	 * Test P2-005-V6: MigrationErrorCode enum values
	 */
	it('P2-005-V6: should have all MigrationErrorCode enum values', () => {
		expect(MigrationErrorCode.SCHEMA_VALIDATION_FAILED).toBe('SCHEMA_VALIDATION_FAILED');
		expect(MigrationErrorCode.TABLE_NOT_FOUND).toBe('TABLE_NOT_FOUND');
		expect(MigrationErrorCode.COLUMN_NOT_FOUND).toBe('COLUMN_NOT_FOUND');
		expect(MigrationErrorCode.INDEX_NOT_FOUND).toBe('INDEX_NOT_FOUND');
		expect(MigrationErrorCode.TYPE_CONVERSION_FAILED).toBe('TYPE_CONVERSION_FAILED');
		expect(MigrationErrorCode.CONSTRAINT_VIOLATION).toBe('CONSTRAINT_VIOLATION');
		expect(MigrationErrorCode.FOREIGN_KEY_VIOLATION).toBe('FOREIGN_KEY_VIOLATION');
		expect(MigrationErrorCode.DATA_LOSS_RISK).toBe('DATA_LOSS_RISK');
		expect(MigrationErrorCode.MIGRATION_TIMEOUT).toBe('MIGRATION_TIMEOUT');
		expect(MigrationErrorCode.SQL_EXECUTION_ERROR).toBe('SQL_EXECUTION_ERROR');
		expect(MigrationErrorCode.BACKUP_FAILED).toBe('BACKUP_FAILED');
		expect(MigrationErrorCode.ROLLBACK_FAILED).toBe('ROLLBACK_FAILED');
	});
});

describe('Validation Type Safety', () => {
	/**
	 * Test MigrationValidation type safety
	 */
	it('should enforce MigrationValidation type safety', () => {
		const validation: MigrationValidation = {
			valid: true,
			errors: [
				{
					code: 'SCHEMA_VALIDATION_FAILED',
					message: 'Schema validation failed',
					field: 'test_field',
					severity: 'error',
					suggestion: 'Check schema definition'
				}
			],
			warnings: [
				{
					code: 'DATA_LOSS_RISK',
					message: 'Data loss risk',
					type: 'data_loss'
				}
			],
			recommendations: [
				'Backup data before proceeding',
				'Test in staging environment'
			]
		};
		
		expect(typeof validation.valid).toBe('boolean');
		expect(Array.isArray(validation.errors)).toBe(true);
		expect(Array.isArray(validation.warnings)).toBe(true);
		expect(Array.isArray(validation.recommendations)).toBe(true);
		
		// Check error structure
		const error = validation.errors[0];
		expect(typeof error.code).toBe('string');
		expect(typeof error.message).toBe('string');
		expect(typeof error.field).toBe('string');
		expect(['error', 'warning', 'info']).toContain(error.severity);
		expect(typeof error.suggestion).toBe('string');
		
		// Check warning structure
		const warning = validation.warnings[0];
		expect(typeof warning.code).toBe('string');
		expect(typeof warning.message).toBe('string');
		expect(['data_loss', 'performance', 'compatibility', 'other']).toContain(warning.type);
	});

	/**
	 * Test ValidationError type safety
	 */
	it('should enforce ValidationError type safety', () => {
		const error: ValidationError = {
			code: 'SCHEMA_VALIDATION_FAILED',
			message: 'Schema validation failed',
			field: 'test_field',
			severity: 'error',
			suggestion: 'Check schema definition'
		};
		
		expect(typeof error.code).toBe('string');
		expect(typeof error.message).toBe('string');
		expect(typeof error.field).toBe('string');
		expect(['error', 'warning', 'info']).toContain(error.severity);
		expect(typeof error.suggestion).toBe('string');
	});

	/**
	 * Test ValidationWarning type safety
	 */
	it('should enforce ValidationWarning type safety', () => {
		const warning: ValidationWarning = {
			code: 'DATA_LOSS_RISK',
			message: 'Data loss risk',
			field: 'test_field',
			type: 'data_loss'
		};
		
		expect(typeof warning.code).toBe('string');
		expect(typeof warning.message).toBe('string');
		expect(typeof warning.field).toBe('string');
		expect(['data_loss', 'performance', 'compatibility', 'other']).toContain(warning.type);
	});

	/**
	 * Test MigrationError type safety
	 */
	it('should enforce MigrationError type safety', () => {
		const error: MigrationError = {
			code: 'SQL_EXECUTION_ERROR',
			message: 'SQL execution failed',
			details: {
				sql: 'INVALID SQL',
				error: 'syntax error'
			},
			doctype: 'TestDocType',
			field: 'test_field',
			sql: 'INVALID SQL',
			stack: 'Error: SQL syntax error\n    at test.js:1:1',
			severity: 'error',
			recoverable: false,
			recoveryAction: 'Fix SQL syntax and retry'
		};
		
		expect(typeof error.code).toBe('string');
		expect(typeof error.message).toBe('string');
		expect(typeof error.doctype).toBe('string');
		expect(typeof error.field).toBe('string');
		expect(typeof error.sql).toBe('string');
		expect(typeof error.stack).toBe('string');
		expect(['fatal', 'error', 'warning']).toContain(error.severity);
		expect(typeof error.recoverable).toBe('boolean');
		expect(typeof error.recoveryAction).toBe('string');
	});
});

describe('Validation Edge Cases', () => {
	/**
	 * Test MigrationValidation with minimal properties
	 */
	it('should handle MigrationValidation with minimal properties', () => {
		const minimalValidation: MigrationValidation = {
			valid: true,
			errors: [],
			warnings: [],
			recommendations: []
		};
		
		expect(minimalValidation.valid).toBe(true);
		expect(minimalValidation.errors).toHaveLength(0);
		expect(minimalValidation.warnings).toHaveLength(0);
		expect(minimalValidation.recommendations).toHaveLength(0);
	});

	/**
	 * Test ValidationError with minimal properties
	 */
	it('should handle ValidationError with minimal properties', () => {
		const minimalError: ValidationError = {
			code: 'ERROR_CODE',
			message: 'Error message',
			severity: 'error'
		};
		
		expect(minimalError.code).toBe('ERROR_CODE');
		expect(minimalError.message).toBe('Error message');
		expect(minimalError.severity).toBe('error');
		expect(minimalError.field).toBeUndefined();
		expect(minimalError.suggestion).toBeUndefined();
	});

	/**
	 * Test ValidationWarning with minimal properties
	 */
	it('should handle ValidationWarning with minimal properties', () => {
		const minimalWarning: ValidationWarning = {
			code: 'WARNING_CODE',
			message: 'Warning message',
			type: 'other'
		};
		
		expect(minimalWarning.code).toBe('WARNING_CODE');
		expect(minimalWarning.message).toBe('Warning message');
		expect(minimalWarning.type).toBe('other');
		expect(minimalWarning.field).toBeUndefined();
	});

	/**
	 * Test MigrationError with minimal properties
	 */
	it('should handle MigrationError with minimal properties', () => {
		const minimalError: MigrationError = {
			code: 'ERROR_CODE',
			message: 'Error message',
			severity: 'error',
			recoverable: false
		};
		
		expect(minimalError.code).toBe('ERROR_CODE');
		expect(minimalError.message).toBe('Error message');
		expect(minimalError.severity).toBe('error');
		expect(minimalError.recoverable).toBe(false);
		expect(minimalError.details).toBeUndefined();
		expect(minimalError.doctype).toBeUndefined();
		expect(minimalError.field).toBeUndefined();
		expect(minimalError.sql).toBeUndefined();
		expect(minimalError.stack).toBeUndefined();
		expect(minimalError.recoveryAction).toBeUndefined();
	});

	/**
	 * Test all ValidationError severity levels
	 */
	it('should handle all ValidationError severity levels', () => {
		const errorSeverity: ValidationError = {
			code: 'ERROR_CODE',
			message: 'Error message',
			severity: 'error'
		};
		
		const warningSeverity: ValidationError = {
			code: 'WARNING_CODE',
			message: 'Warning message',
			severity: 'warning'
		};
		
		const infoSeverity: ValidationError = {
			code: 'INFO_CODE',
			message: 'Info message',
			severity: 'info'
		};
		
		expect(errorSeverity.severity).toBe('error');
		expect(warningSeverity.severity).toBe('warning');
		expect(infoSeverity.severity).toBe('info');
	});

	/**
	 * Test all ValidationWarning types
	 */
	it('should handle all ValidationWarning types', () => {
		const dataLossWarning: ValidationWarning = {
			code: 'DATA_LOSS_RISK',
			message: 'Data loss risk',
			type: 'data_loss'
		};
		
		const performanceWarning: ValidationWarning = {
			code: 'PERFORMANCE_IMPACT',
			message: 'Performance impact',
			type: 'performance'
		};
		
		const compatibilityWarning: ValidationWarning = {
			code: 'COMPATIBILITY_ISSUE',
			message: 'Compatibility issue',
			type: 'compatibility'
		};
		
		const otherWarning: ValidationWarning = {
			code: 'OTHER_WARNING',
			message: 'Other warning',
			type: 'other'
		};
		
		expect(dataLossWarning.type).toBe('data_loss');
		expect(performanceWarning.type).toBe('performance');
		expect(compatibilityWarning.type).toBe('compatibility');
		expect(otherWarning.type).toBe('other');
	});

	/**
	 * Test all MigrationError severity levels
	 */
	it('should handle all MigrationError severity levels', () => {
		const fatalError: MigrationError = {
			code: 'FATAL_ERROR',
			message: 'Fatal error',
			severity: 'fatal',
			recoverable: false
		};
		
		const errorSeverity: MigrationError = {
			code: 'ERROR_CODE',
			message: 'Error message',
			severity: 'error',
			recoverable: true
		};
		
		const warningSeverity: MigrationError = {
			code: 'WARNING_CODE',
			message: 'Warning message',
			severity: 'warning',
			recoverable: true
		};
		
		expect(fatalError.severity).toBe('fatal');
		expect(fatalError.recoverable).toBe(false);
		expect(errorSeverity.severity).toBe('error');
		expect(errorSeverity.recoverable).toBe(true);
		expect(warningSeverity.severity).toBe('warning');
		expect(warningSeverity.recoverable).toBe(true);
	});

	/**
	 * Test MigrationValidation with mixed errors and warnings
	 */
	it('should handle MigrationValidation with mixed errors and warnings', () => {
		const mixedValidation: MigrationValidation = {
			valid: false,
			errors: [
				{
					code: 'SCHEMA_VALIDATION_FAILED',
					message: 'Schema validation failed',
					severity: 'error',
					suggestion: 'Check schema definition'
				}
			],
			warnings: [
				{
					code: 'DATA_LOSS_RISK',
					message: 'Data loss risk',
					type: 'data_loss'
				},
				{
					code: 'PERFORMANCE_IMPACT',
					message: 'Performance impact',
					type: 'performance'
				}
			],
			recommendations: [
				'Fix schema validation errors',
				'Backup data before proceeding',
				'Monitor performance after migration'
			]
		};
		
		expect(mixedValidation.valid).toBe(false);
		expect(mixedValidation.errors).toHaveLength(1);
		expect(mixedValidation.warnings).toHaveLength(2);
		expect(mixedValidation.recommendations).toHaveLength(3);
		expect(mixedValidation.errors[0].severity).toBe('error');
		expect(mixedValidation.warnings[0].type).toBe('data_loss');
		expect(mixedValidation.warnings[1].type).toBe('performance');
	});
});