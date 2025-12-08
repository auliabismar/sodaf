/**
 * Tests for Virtual DocType interfaces and types
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
	VirtualDocType,
	VirtualDocTypeConfig,
	VirtualSourceType,
	VirtualDataFormat,
	CacheStrategy,
	RefreshStrategy,
	VirtualAuthConfig,
	VirtualSourceConfig,
	VirtualFieldMapping,
	VirtualTransformation,
	VirtualValidation,
	VirtualErrorHandling,
	VirtualPerformance,
	VirtualDebug,
	VirtualPerformanceMetrics,
	VirtualCacheStats
} from '../virtual-doctype';

describe('Virtual DocType Types', () => {
	let virtualDocType: VirtualDocType;

	beforeEach(() => {
		virtualDocType = {
			is_virtual: true,
			name: 'VirtualUser',
			module: 'Core',
			fields: [
				{
					fieldname: 'name',
					fieldtype: 'Data',
					label: 'Name',
					required: true
				},
				{
					fieldname: 'email',
					fieldtype: 'Data',
					label: 'Email',
					required: true
				},
				{
					fieldname: 'status',
					fieldtype: 'Select',
					label: 'Status',
					options: 'Active\nInactive'
				}
			],
			permissions: [
				{
					role: 'System Manager',
					read: true,
					write: true,
					create: true,
					delete: true
				}
			],
			virtual_config: {
				source_type: 'api',
				data_format: 'json',
				cache_strategy: 'memory',
				refresh_strategy: 'time-based',
				cache_duration: 300,
				max_records: 1000,
				timeout: 30000,
				retry_attempts: 3,
				retry_delay: 1000,
				enable_pagination: true,
				page_size: 50,
				enable_filtering: true,
				enable_sorting: true,
				enable_searching: true,
				custom_headers: {
					'Content-Type': 'application/json'
				},
				auth_config: {
					auth_type: 'bearer',
					bearer_token: 'test-token'
				},
				source_config: {
					api: {
						base_url: 'https://api.example.com',
						endpoint: '/users',
						method: 'GET',
						query_params: {
							limit: 50
						},
						data_path: 'data',
						count_path: 'total',
						pagination: {
							type: 'offset',
							page_param: 'page',
							limit_param: 'limit'
						}
					}
				},
				field_mapping: {
					field_map: {
						'id': 'name',
						'user_email': 'email'
					},
					default_values: {
						status: 'Active'
					}
				},
				transformation: {
					pre_process: [
						{
							type: 'filter',
							function: 'item => item.active === true'
						}
					],
					normalization: {
						trim_strings: true,
						normalize_case: 'lower'
					}
				},
				validation: {
					validation_mode: 'strict',
					quality_checks: [
						{
							field: 'email',
							check: 'format',
							parameter: 'email',
							error_message: 'Invalid email format'
						}
					]
				},
				error_handling: {
					retry_strategy: 'exponential',
					max_retries: 3,
					base_delay: 1000,
					max_delay: 10000
				},
				performance: {
					pool_size: 10,
					request_timeout: 30000,
					concurrent_limit: 5,
					rate_limit: {
						requests_per_second: 10,
						burst_size: 20
					},
					compression: {
						enabled: true,
						algorithm: 'gzip'
					}
				},
				debug: {
					enabled: true,
					log_level: 'info',
					log_requests: true,
					monitor_performance: true
				}
			},
			status: 'active',
			performance_metrics: {
				avg_response_time: 250,
				last_response_time: 200,
				total_requests: 100,
				successful_requests: 95,
				failed_requests: 5,
				cache_hit_ratio: 0.8,
				data_size: 1024000,
				record_count: 50
			},
			cache_stats: {
				hits: 80,
				misses: 20,
				size: 512000
			}
		};
	});

	describe('VirtualDocType interface', () => {
		it('should create a valid Virtual DocType', () => {
			expect(virtualDocType.is_virtual).toBe(true);
			expect(virtualDocType.name).toBe('VirtualUser');
			expect(virtualDocType.module).toBe('Core');
			expect(virtualDocType.fields).toHaveLength(3);
			expect(virtualDocType.permissions).toHaveLength(1);
		});

		it('should validate required properties', () => {
			expect(virtualDocType.virtual_config).toBeDefined();
			expect(virtualDocType.virtual_config.source_type).toBe('api');
			expect(virtualDocType.status).toBe('active');
		});

		it('should support different source types', () => {
			const fileDocType: VirtualDocType = {
				...virtualDocType,
				virtual_config: {
					...virtualDocType.virtual_config,
					source_type: 'file',
					source_config: {
						file: {
							file_path: '/data/users/*.json',
							watch_changes: true,
							encoding: 'utf-8'
						}
					}
				}
			};

			expect(fileDocType.virtual_config.source_type).toBe('file');
		});

		it('should support computed source type', () => {
			const computedDocType: VirtualDocType = {
				...virtualDocType,
				virtual_config: {
					...virtualDocType.virtual_config,
					source_type: 'computed',
					source_config: {
						computed: {
							source_doctypes: ['User', 'Role'],
							computation_function: 'return users.map(user => ({...user, role: roles[user.role_id]}));',
							field_dependencies: {
								'role': ['User.role_id', 'Role.name']
							},
							aggregation: {
								group_by: ['department'],
								aggregations: {
									'salary': 'avg',
									'count': 'count'
								}
							}
						}
					}
				}
			};

			expect(computedDocType.virtual_config.source_type).toBe('computed');
		});

		it('should support hybrid source type', () => {
			const hybridDocType: VirtualDocType = {
				...virtualDocType,
				virtual_config: {
					...virtualDocType.virtual_config,
					source_type: 'hybrid',
					source_config: {
						hybrid: {
							sources: [
								{
									name: 'api_users',
									source_type: 'api',
									priority: 1,
									source_config: {
										api: {
											base_url: 'https://api.example.com',
											endpoint: '/users',
											method: 'GET'
										}
									}
								},
								{
									name: 'local_cache',
									source_type: 'file',
									priority: 2,
									source_config: {
										file: {
											file_path: '/cache/users.json'
										}
									}
								}
							],
							merge_strategy: 'union',
							merge_function: 'return [...apiUsers, ...localUsers]'
						}
					}
				}
			};

			expect(hybridDocType.virtual_config.source_type).toBe('hybrid');
		});
	});

	describe('VirtualDocTypeConfig', () => {
		it('should validate basic config properties', () => {
			const config = virtualDocType.virtual_config;
			expect(config.source_type).toBe('api');
			expect(config.data_format).toBe('json');
			expect(config.cache_strategy).toBe('memory');
			expect(config.refresh_strategy).toBe('time-based');
			expect(config.cache_duration).toBe(300);
		});

		it('should validate performance config', () => {
			const config = virtualDocType.virtual_config;
			expect(config.max_records).toBe(1000);
			expect(config.timeout).toBe(30000);
			expect(config.retry_attempts).toBe(3);
			expect(config.retry_delay).toBe(1000);
		});

		it('should validate feature flags', () => {
			const config = virtualDocType.virtual_config;
			expect(config.enable_pagination).toBe(true);
			expect(config.enable_filtering).toBe(true);
			expect(config.enable_sorting).toBe(true);
			expect(config.enable_searching).toBe(true);
		});
	});

	describe('VirtualAuthConfig', () => {
		it('should validate bearer token auth', () => {
			const authConfig = virtualDocType.virtual_config.auth_config;
			expect(authConfig?.auth_type).toBe('bearer');
			expect(authConfig?.bearer_token).toBe('test-token');
		});

		it('should support basic auth', () => {
			const basicAuth: VirtualAuthConfig = {
				auth_type: 'basic',
				username: 'admin',
				password: 'secret'
			};

			expect(basicAuth.auth_type).toBe('basic');
			expect(basicAuth.username).toBe('admin');
		});

		it('should support API key auth', () => {
			const apiKeyAuth: VirtualAuthConfig = {
				auth_type: 'api_key',
				api_key: 'secret-key',
				api_key_header: 'X-API-Key'
			};

			expect(apiKeyAuth.auth_type).toBe('api_key');
			expect(apiKeyAuth.api_key_header).toBe('X-API-Key');
		});
	});

	describe('VirtualSourceConfig', () => {
		it('should validate API source config', () => {
			const apiConfig = virtualDocType.virtual_config.source_config.api;
			expect(apiConfig).toBeDefined();
			expect(apiConfig?.base_url).toBe('https://api.example.com');
			expect(apiConfig?.endpoint).toBe('/users');
			expect(apiConfig?.method).toBe('GET');
			expect(apiConfig?.pagination?.type).toBe('offset');
		});

		it('should validate file source config', () => {
			const fileConfig: VirtualSourceConfig = {
				file: {
					file_path: '/data/users/*.json',
					watch_changes: true,
					encoding: 'utf-8'
				}
			};

			expect(fileConfig.file?.file_path).toBe('/data/users/*.json');
			expect(fileConfig.file?.watch_changes).toBe(true);
		});

		it('should validate computed source config', () => {
			const computedConfig: VirtualSourceConfig = {
				computed: {
					source_doctypes: ['User', 'Role'],
					computation_function: 'return users;',
					joins: [
						{
							source_doctype: 'Role',
							local_field: 'role_id',
							foreign_field: 'name',
							join_type: 'left'
						}
					]
				}
			};

			expect(computedConfig.computed?.source_doctypes).toContain('User');
			expect(computedConfig.computed?.joins).toHaveLength(1);
		});
	});

	describe('VirtualFieldMapping', () => {
		it('should validate field mapping', () => {
			const fieldMapping = virtualDocType.virtual_config.field_mapping;
			expect(fieldMapping).toBeDefined();
			expect(fieldMapping?.field_map['id']).toBe('name');
			expect(fieldMapping?.default_values?.status).toBe('Active');
		});
	});

	describe('VirtualTransformation', () => {
		it('should validate transformation config', () => {
			const transformation = virtualDocType.virtual_config.transformation;
			expect(transformation).toBeDefined();
			expect(transformation?.pre_process).toHaveLength(1);
			expect(transformation?.normalization?.trim_strings).toBe(true);
		});
	});

	describe('VirtualValidation', () => {
		it('should validate validation config', () => {
			const validation = virtualDocType.virtual_config.validation;
			expect(validation).toBeDefined();
			expect(validation?.validation_mode).toBe('strict');
			expect(validation?.quality_checks).toHaveLength(1);
		});
	});

	describe('VirtualErrorHandling', () => {
		it('should validate error handling config', () => {
			const errorHandling = virtualDocType.virtual_config.error_handling;
			expect(errorHandling).toBeDefined();
			expect(errorHandling?.retry_strategy).toBe('exponential');
			expect(errorHandling?.max_retries).toBe(3);
		});
	});

	describe('VirtualPerformance', () => {
		it('should validate performance config', () => {
			const performance = virtualDocType.virtual_config.performance;
			expect(performance).toBeDefined();
			expect(performance?.pool_size).toBe(10);
			expect(performance?.rate_limit?.requests_per_second).toBe(10);
		});
	});

	describe('VirtualDebug', () => {
		it('should validate debug config', () => {
			const debug = virtualDocType.virtual_config.debug;
			expect(debug).toBeDefined();
			expect(debug?.enabled).toBe(true);
			expect(debug?.log_level).toBe('info');
		});
	});

	describe('VirtualPerformanceMetrics', () => {
		it('should validate performance metrics', () => {
			const metrics = virtualDocType.performance_metrics;
			expect(metrics).toBeDefined();
			expect(metrics?.avg_response_time).toBe(250);
			expect(metrics?.cache_hit_ratio).toBe(0.8);
		});
	});

	describe('VirtualCacheStats', () => {
		it('should validate cache stats', () => {
			const cacheStats = virtualDocType.cache_stats;
			expect(cacheStats).toBeDefined();
			expect(cacheStats?.hits).toBe(80);
			expect(cacheStats?.misses).toBe(20);
		});
	});
});