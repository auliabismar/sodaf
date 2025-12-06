/**
 * Query Builder Tests
 * 
 * Unit tests for P1-026: Query Builder API (Fluent Interface)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryBuilder, createQueryBuilder, from } from '../query-builder';
import type { QueryExecutor, QuerySQL } from '../query-types';

// Mock database executor
function createMockExecutor(): QueryExecutor & { queries: { sql: string; params: any[] }[] } {
    const queries: { sql: string; params: any[] }[] = [];

    return {
        queries,
        async sql(query: string, values: any[] = []): Promise<any[]> {
            queries.push({ sql: query, params: values });

            // Return mock data based on query
            if (query.includes('COUNT')) {
                return [{ result: 10 }];
            }
            if (query.includes('SUM')) {
                return [{ result: 1500 }];
            }
            if (query.includes('AVG')) {
                return [{ result: 75.5 }];
            }
            if (query.includes('MIN')) {
                return [{ result: 'Alice' }];
            }
            if (query.includes('MAX')) {
                return [{ result: 'Zoe' }];
            }

            // Return mock users for normal select
            return [
                { name: 'user1', email: 'user1@example.com', status: 'Active' },
                { name: 'user2', email: 'user2@example.com', status: 'Active' }
            ];
        }
    };
}

describe('QueryBuilder', () => {
    let mockExecutor: ReturnType<typeof createMockExecutor>;

    beforeEach(() => {
        mockExecutor = createMockExecutor();
    });

    describe('basic select', () => {
        // P1-026-T1: Basic select with fields
        it('should select specific fields from table', async () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql, params } = qb.select('name', 'email').toSQL();

            expect(sql).toBe('SELECT `name`, `email` FROM `tabUser`');
            expect(params).toEqual([]);
        });

        it('should select all fields when none specified', async () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql } = qb.toSQL();

            expect(sql).toBe('SELECT * FROM `tabUser`');
        });

        it('should execute query and return results', async () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const results = await qb.select('name', 'email').run();

            expect(results).toHaveLength(2);
            expect(results[0].name).toBe('user1');
        });
    });

    describe('where conditions', () => {
        // P1-026-T2: Where clause
        it('should add where condition with equals operator', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql, params } = qb
                .select('name')
                .where('status', '=', 'Active')
                .toSQL();

            expect(sql).toContain('WHERE `status` = ?');
            expect(params).toEqual(['Active']);
        });

        it('should support various operators', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');

            const testCases: Array<{ op: any; expected: string }> = [
                { op: '!=', expected: '!= ?' },
                { op: '<', expected: '< ?' },
                { op: '>', expected: '> ?' },
                { op: '<=', expected: '<= ?' },
                { op: '>=', expected: '>= ?' },
                { op: 'like', expected: 'LIKE ?' },
                { op: 'not like', expected: 'NOT LIKE ?' }
            ];

            testCases.forEach(({ op, expected }) => {
                const builder = new QueryBuilder(mockExecutor, 'User');
                const { sql } = builder.where('field', op, 'value').toSQL();
                expect(sql).toContain(expected);
            });
        });

        it('should handle IN operator', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql, params } = qb
                .where('status', 'in', ['Active', 'Pending'])
                .toSQL();

            expect(sql).toContain('IN (?, ?)');
            expect(params).toEqual(['Active', 'Pending']);
        });

        it('should handle BETWEEN operator', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql, params } = qb
                .where('age', 'between', [18, 65])
                .toSQL();

            expect(sql).toContain('BETWEEN ? AND ?');
            expect(params).toEqual([18, 65]);
        });

        it('should handle IS NULL operator', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql, params } = qb
                .where('deleted_at', 'is', null)
                .toSQL();

            expect(sql).toContain('IS NULL');
            expect(params).toEqual([]);
        });

        // P1-026-T3: Or where clause
        it('should add OR condition', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql, params } = qb
                .where('status', '=', 'Active')
                .orWhere('role', '=', 'Admin')
                .toSQL();

            expect(sql).toContain('WHERE `status` = ?');
            expect(sql).toContain('OR `role` = ?');
            expect(params).toEqual(['Active', 'Admin']);
        });

        it('should chain multiple AND conditions', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql, params } = qb
                .where('status', '=', 'Active')
                .where('enabled', '=', 1)
                .where('type', '=', 'User')
                .toSQL();

            expect(sql).toContain('WHERE `status` = ? AND `enabled` = ? AND `type` = ?');
            expect(params).toEqual(['Active', 1, 'User']);
        });
    });

    describe('joins', () => {
        // P1-026-T4: Inner join
        it('should add inner join', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql } = qb
                .select('User.name', 'Role.role_name')
                .join('Role', { 'User.role': 'Role.name' })
                .toSQL();

            expect(sql).toContain('JOIN `tabRole` ON');
            expect(sql).toContain('`tabUser`.`role` = `tabRole`.`name`');
        });

        // P1-026-T5: Left join
        it('should add left join', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql } = qb
                .select('User.name', 'Address.city')
                .leftJoin('Address', { 'User.name': 'Address.user' })
                .toSQL();

            expect(sql).toContain('LEFT JOIN `tabAddress` ON');
        });

        it('should support multiple joins', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql } = qb
                .join('Role', { 'User.role': 'Role.name' })
                .leftJoin('Address', { 'User.name': 'Address.user' })
                .toSQL();

            expect(sql).toContain('JOIN `tabRole`');
            expect(sql).toContain('LEFT JOIN `tabAddress`');
        });
    });

    describe('groupBy and having', () => {
        // P1-026-T6: Group by
        it('should group by single field', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql } = qb
                .select('status', 'COUNT(*) as count')
                .groupBy('status')
                .toSQL();

            expect(sql).toContain('GROUP BY `status`');
        });

        it('should group by multiple fields', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql } = qb
                .groupBy('status', 'role')
                .toSQL();

            expect(sql).toContain('GROUP BY `status`, `role`');
        });

        it('should add having condition', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql, params } = qb
                .select('status', 'COUNT(*) as count')
                .groupBy('status')
                .having('COUNT(*)', '>', 5)
                .toSQL();

            expect(sql).toContain('HAVING COUNT(*) > ?');
            expect(params).toEqual([5]);
        });
    });

    describe('orderBy', () => {
        // P1-026-T7: Order by
        it('should order by field ascending (default)', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql } = qb.orderBy('name').toSQL();

            expect(sql).toContain('ORDER BY `name` ASC');
        });

        it('should order by field descending', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql } = qb.orderBy('creation', 'DESC').toSQL();

            expect(sql).toContain('ORDER BY `creation` DESC');
        });

        it('should support multiple order by', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql } = qb
                .orderBy('status', 'ASC')
                .orderBy('creation', 'DESC')
                .toSQL();

            expect(sql).toContain('ORDER BY `status` ASC, `creation` DESC');
        });
    });

    describe('limit and offset', () => {
        // P1-026-T8: Limit and offset
        it('should add limit clause', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql } = qb.limit(10).toSQL();

            expect(sql).toContain('LIMIT 10');
        });

        it('should add offset clause', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql } = qb.offset(20).toSQL();

            expect(sql).toContain('OFFSET 20');
        });

        it('should combine limit and offset for pagination', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql } = qb.limit(10).offset(20).toSQL();

            expect(sql).toContain('LIMIT 10');
            expect(sql).toContain('OFFSET 20');
        });
    });

    describe('subqueries', () => {
        // P1-026-T9: Subquery in where
        it('should support subquery values in IN clause', async () => {
            // Create a subquery-like array of values
            const subqueryResult = ['admin', 'manager'];

            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql, params } = qb
                .where('role', 'in', subqueryResult)
                .toSQL();

            expect(sql).toContain('IN (?, ?)');
            expect(params).toEqual(['admin', 'manager']);
        });
    });

    describe('aggregate functions', () => {
        // P1-026-T10: Count
        it('should execute count aggregate', async () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const count = await qb.count();

            expect(count).toBe(10);
            expect(mockExecutor.queries[0].sql).toContain('COUNT(*)');
        });

        it('should count specific field', async () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            await qb.count('email');

            expect(mockExecutor.queries[0].sql).toContain('COUNT(`email`)');
        });

        // P1-026-T11: Sum
        it('should execute sum aggregate', async () => {
            const qb = new QueryBuilder(mockExecutor, 'Order');
            const sum = await qb.sum('amount');

            expect(sum).toBe(1500);
            expect(mockExecutor.queries[0].sql).toContain('SUM(`amount`)');
        });

        it('should execute avg aggregate', async () => {
            const qb = new QueryBuilder(mockExecutor, 'Product');
            const avg = await qb.avg('price');

            expect(avg).toBe(75.5);
            expect(mockExecutor.queries[0].sql).toContain('AVG(`price`)');
        });

        it('should execute min aggregate', async () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const min = await qb.min('name');

            expect(min).toBe('Alice');
            expect(mockExecutor.queries[0].sql).toContain('MIN(`name`)');
        });

        it('should execute max aggregate', async () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const max = await qb.max('name');

            expect(max).toBe('Zoe');
            expect(mockExecutor.queries[0].sql).toContain('MAX(`name`)');
        });

        it('should apply where conditions to aggregates', async () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            await qb.where('status', '=', 'Active').count();

            const query = mockExecutor.queries[0];
            expect(query.sql).toContain('COUNT(*)');
            expect(query.sql).toContain('WHERE');
            expect(query.params).toEqual(['Active']);
        });
    });

    describe('distinct', () => {
        // P1-026-T12: Distinct
        it('should select distinct values', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql } = qb.select('status').distinct().toSQL();

            expect(sql).toContain('SELECT DISTINCT `status`');
        });
    });

    describe('method chaining', () => {
        // P1-026-T13: Method chaining
        it('should chain all methods fluently', async () => {
            const qb = new QueryBuilder(mockExecutor, 'User');

            const results = await qb
                .select('name', 'email')
                .where('status', '=', 'Active')
                .orWhere('role', '=', 'Admin')
                .join('Role', { 'User.role': 'Role.name' })
                .groupBy('status')
                .orderBy('creation', 'DESC')
                .limit(10)
                .offset(0)
                .distinct()
                .run();

            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
        });

        it('should return QueryBuilder from all chainable methods', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');

            expect(qb.select('name')).toBeInstanceOf(QueryBuilder);
            expect(qb.where('a', '=', 1)).toBeInstanceOf(QueryBuilder);
            expect(qb.orWhere('b', '=', 2)).toBeInstanceOf(QueryBuilder);
            expect(qb.join('T', {})).toBeInstanceOf(QueryBuilder);
            expect(qb.leftJoin('T', {})).toBeInstanceOf(QueryBuilder);
            expect(qb.groupBy('c')).toBeInstanceOf(QueryBuilder);
            expect(qb.having('d', '=', 3)).toBeInstanceOf(QueryBuilder);
            expect(qb.orderBy('e')).toBeInstanceOf(QueryBuilder);
            expect(qb.limit(10)).toBeInstanceOf(QueryBuilder);
            expect(qb.offset(5)).toBeInstanceOf(QueryBuilder);
            expect(qb.distinct()).toBeInstanceOf(QueryBuilder);
        });
    });

    describe('SQL injection prevention', () => {
        // P1-026-T14: SQL injection prevention
        it('should use parameterized queries for values', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const maliciousInput = "'; DROP TABLE users; --";

            const { sql, params } = qb
                .where('name', '=', maliciousInput)
                .toSQL();

            // Value should be in params, not in SQL string
            expect(sql).not.toContain(maliciousInput);
            expect(params).toContain(maliciousInput);
            expect(sql).toContain('= ?');
        });

        it('should escape field names', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql } = qb.select('name').toSQL();

            expect(sql).toContain('`name`');
        });

        it('should escape table names', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql } = qb.toSQL();

            expect(sql).toContain('`tabUser`');
        });
    });

    describe('TypeScript types', () => {
        // P1-026-T15: TypeScript types
        it('should infer return type from generic', async () => {
            interface User {
                name: string;
                email: string;
            }

            const qb = new QueryBuilder<User>(mockExecutor, 'User');
            const results = await qb.run();

            // TypeScript would infer results as User[]
            expect(results).toBeInstanceOf(Array);
        });
    });

    describe('factory functions', () => {
        it('should create query builder via createQueryBuilder', async () => {
            const qb = createQueryBuilder(mockExecutor);
            const builder = qb('User');

            expect(builder).toBeInstanceOf(QueryBuilder);

            const results = await builder.select('name').run();
            expect(results).toBeDefined();
        });

        it('should create query builder via from function', async () => {
            const builder = from(mockExecutor, 'User');

            expect(builder).toBeInstanceOf(QueryBuilder);

            const results = await builder.select('name').run();
            expect(results).toBeDefined();
        });
    });

    describe('error handling', () => {
        it('should throw error when running without executor', async () => {
            const qb = new QueryBuilder(null, 'User');

            await expect(qb.run()).rejects.toThrow('Query executor not set');
        });

        it('should throw error for aggregate without executor', async () => {
            const qb = new QueryBuilder(null, 'User');

            await expect(qb.count()).rejects.toThrow('Query executor not set');
        });
    });

    describe('toSQL method', () => {
        it('should return complete SQL with all clauses', () => {
            const qb = new QueryBuilder(mockExecutor, 'User');
            const { sql, params } = qb
                .select('name', 'email')
                .where('status', '=', 'Active')
                .join('Role', { 'User.role': 'Role.name' })
                .groupBy('status')
                .having('COUNT(*)', '>', 5)
                .orderBy('name', 'ASC')
                .limit(10)
                .offset(20)
                .distinct()
                .toSQL();

            expect(sql).toContain('SELECT DISTINCT');
            expect(sql).toContain('FROM `tabUser`');
            expect(sql).toContain('JOIN');
            expect(sql).toContain('WHERE');
            expect(sql).toContain('GROUP BY');
            expect(sql).toContain('HAVING');
            expect(sql).toContain('ORDER BY');
            expect(sql).toContain('LIMIT');
            expect(sql).toContain('OFFSET');
            expect(params).toEqual(['Active', 5]);
        });
    });
});
