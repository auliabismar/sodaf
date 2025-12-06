/**
 * Query Builder Implementation
 * 
 * This module implements a fluent, type-safe query builder API
 * inspired by Frappe's PyPika-based frappe.qb.
 */

import type { FilterOperator } from './types';
import type {
    IQueryBuilder,
    QueryBuilderState,
    QueryExecutor,
    QuerySQL,
    JoinType,
    OrderDirection,
    WhereCondition,
    JoinCondition,
    HavingCondition,
    OrderSpec
} from './query-types';

/**
 * QueryBuilder class implementing fluent query construction
 * 
 * @example
 * ```typescript
 * const users = await qb.from('User')
 *   .select('name', 'email')
 *   .where('status', '=', 'Active')
 *   .orderBy('creation', 'DESC')
 *   .limit(10)
 *   .run();
 * ```
 */
export class QueryBuilder<T = any> implements IQueryBuilder<T> {
    private state: QueryBuilderState;
    private executor: QueryExecutor | null;

    /**
     * Create a new QueryBuilder instance
     * @param executor Database executor for running queries
     * @param table Optional table name to query from
     */
    constructor(executor?: QueryExecutor | null, table: string = '') {
        this.executor = executor || null;
        this.state = {
            table: table,
            fields: [],
            where: [],
            joins: [],
            groupBy: [],
            having: [],
            orderBy: [],
            limit: undefined,
            offset: undefined,
            distinct: false,
            aggregates: []
        };
    }

    /**
     * Clone the current builder state
     * @returns New QueryBuilder with copied state
     */
    private clone(): QueryBuilder<T> {
        const newBuilder = new QueryBuilder<T>(this.executor, this.state.table);
        newBuilder.state = {
            ...this.state,
            fields: [...this.state.fields],
            where: [...this.state.where],
            joins: [...this.state.joins],
            groupBy: [...this.state.groupBy],
            having: [...this.state.having],
            orderBy: [...this.state.orderBy],
            aggregates: [...this.state.aggregates]
        };
        return newBuilder;
    }

    /**
     * Get the table name with 'tab' prefix
     * @param name Table name
     * @returns Prefixed table name
     */
    private getTableName(name: string): string {
        if (name.startsWith('tab')) {
            return name;
        }
        return `tab${name}`;
    }

    /**
     * Escape a field name for SQL
     * Handles table.field notation
     * @param field Field name
     * @returns Escaped field name
     */
    private escapeField(field: string): string {
        // Handle aggregate functions like COUNT(*)
        if (field.includes('(') && field.includes(')')) {
            return field;
        }

        // Handle table.field notation
        if (field.includes('.')) {
            const [table, fieldName] = field.split('.');
            return `\`${this.getTableName(table)}\`.\`${fieldName}\``;
        }

        // Handle * for all fields
        if (field === '*') {
            return '*';
        }

        return `\`${field}\``;
    }

    /**
     * Build the operator and value for a condition
     * @param operator Filter operator
     * @param value Condition value
     * @returns Object with SQL fragment and parameters
     */
    private buildOperatorValue(operator: FilterOperator, value: any): { sql: string; params: any[] } {
        switch (operator) {
            case 'in':
            case 'not in': {
                const values = Array.isArray(value) ? value : [value];
                const placeholders = values.map(() => '?').join(', ');
                const op = operator === 'in' ? 'IN' : 'NOT IN';
                return { sql: `${op} (${placeholders})`, params: values };
            }
            case 'between':
            case 'not between': {
                const [low, high] = Array.isArray(value) ? value : [value, value];
                const op = operator === 'between' ? 'BETWEEN' : 'NOT BETWEEN';
                return { sql: `${op} ? AND ?`, params: [low, high] };
            }
            case 'is':
            case 'is not': {
                const op = operator === 'is' ? 'IS' : 'IS NOT';
                if (value === null || value === 'NULL') {
                    return { sql: `${op} NULL`, params: [] };
                }
                return { sql: `${op} ?`, params: [value] };
            }
            case 'like':
            case 'not like': {
                const op = operator === 'like' ? 'LIKE' : 'NOT LIKE';
                return { sql: `${op} ?`, params: [value] };
            }
            default: {
                // Standard operators: =, !=, <, >, <=, >=
                const opMap: Record<string, string> = {
                    '=': '=',
                    '!=': '!=',
                    '<': '<',
                    '>': '>',
                    '<=': '<=',
                    '>=': '>='
                };
                const sqlOp = opMap[operator] || '=';
                return { sql: `${sqlOp} ?`, params: [value] };
            }
        }
    }

    /**
     * Build WHERE clause from conditions
     * @returns Object with SQL fragment and parameters
     */
    private buildWhereClause(): { sql: string; params: any[] } {
        if (this.state.where.length === 0) {
            return { sql: '', params: [] };
        }

        const parts: string[] = [];
        const params: any[] = [];

        this.state.where.forEach((condition, index) => {
            const field = this.escapeField(condition.field);
            const { sql: opSql, params: opParams } = this.buildOperatorValue(condition.operator, condition.value);

            if (index === 0) {
                parts.push(`${field} ${opSql}`);
            } else {
                parts.push(`${condition.connector} ${field} ${opSql}`);
            }
            params.push(...opParams);
        });

        return { sql: `WHERE ${parts.join(' ')}`, params };
    }

    /**
     * Build JOIN clauses
     * @returns SQL fragment for joins
     */
    private buildJoinClause(): string {
        if (this.state.joins.length === 0) {
            return '';
        }

        return this.state.joins.map(join => {
            const joinType = join.type === 'INNER' ? 'JOIN' : `${join.type} JOIN`;
            const table = this.getTableName(join.table);

            const conditions = Object.entries(join.conditions).map(([left, right]) => {
                const leftField = this.escapeField(left);
                const rightField = this.escapeField(right);
                return `${leftField} = ${rightField}`;
            }).join(' AND ');

            return `${joinType} \`${table}\` ON ${conditions}`;
        }).join(' ');
    }

    /**
     * Build GROUP BY clause
     * @returns SQL fragment for group by
     */
    private buildGroupByClause(): string {
        if (this.state.groupBy.length === 0) {
            return '';
        }
        const fields = this.state.groupBy.map(f => this.escapeField(f)).join(', ');
        return `GROUP BY ${fields}`;
    }

    /**
     * Build HAVING clause
     * @returns Object with SQL fragment and parameters
     */
    private buildHavingClause(): { sql: string; params: any[] } {
        if (this.state.having.length === 0) {
            return { sql: '', params: [] };
        }

        const parts: string[] = [];
        const params: any[] = [];

        this.state.having.forEach((condition, index) => {
            const field = this.escapeField(condition.field);
            const { sql: opSql, params: opParams } = this.buildOperatorValue(condition.operator, condition.value);

            if (index === 0) {
                parts.push(`${field} ${opSql}`);
            } else {
                parts.push(`${condition.connector} ${field} ${opSql}`);
            }
            params.push(...opParams);
        });

        return { sql: `HAVING ${parts.join(' ')}`, params };
    }

    /**
     * Build ORDER BY clause
     * @returns SQL fragment for order by
     */
    private buildOrderByClause(): string {
        if (this.state.orderBy.length === 0) {
            return '';
        }
        const orders = this.state.orderBy.map(o => {
            const field = this.escapeField(o.field);
            return `${field} ${o.direction}`;
        }).join(', ');
        return `ORDER BY ${orders}`;
    }

    /**
     * Build LIMIT and OFFSET clause
     * @returns SQL fragment for limit/offset
     */
    private buildLimitClause(): string {
        const parts: string[] = [];
        if (this.state.limit !== undefined) {
            parts.push(`LIMIT ${this.state.limit}`);
        }
        if (this.state.offset !== undefined) {
            parts.push(`OFFSET ${this.state.offset}`);
        }
        return parts.join(' ');
    }

    /**
     * Build the SELECT fields clause
     * @returns SQL fragment for select fields
     */
    private buildSelectFields(): string {
        const distinctPrefix = this.state.distinct ? 'DISTINCT ' : '';

        if (this.state.fields.length === 0) {
            return `${distinctPrefix}*`;
        }

        const fields = this.state.fields.map(f => this.escapeField(f)).join(', ');
        return `${distinctPrefix}${fields}`;
    }

    /**
     * Select specific fields
     */
    select(...fields: string[]): IQueryBuilder<T> {
        this.state.fields.push(...fields);
        return this;
    }

    /**
     * Add a WHERE condition with AND connector
     */
    where(field: string, operator: FilterOperator, value: any): IQueryBuilder<T> {
        const condition: WhereCondition = {
            field,
            operator,
            value,
            connector: 'AND'
        };
        this.state.where.push(condition);
        return this;
    }

    /**
     * Add a WHERE condition with OR connector
     */
    orWhere(field: string, operator: FilterOperator, value: any): IQueryBuilder<T> {
        const condition: WhereCondition = {
            field,
            operator,
            value,
            connector: 'OR'
        };
        this.state.where.push(condition);
        return this;
    }

    /**
     * Add an INNER JOIN
     */
    join(table: string, conditions: Record<string, string>): IQueryBuilder<T> {
        this.addJoin('INNER', table, conditions);
        return this;
    }

    /**
     * Add a LEFT JOIN
     */
    leftJoin(table: string, conditions: Record<string, string>): IQueryBuilder<T> {
        this.addJoin('LEFT', table, conditions);
        return this;
    }

    /**
     * Add a join of specified type
     */
    private addJoin(type: JoinType, table: string, conditions: Record<string, string>): void {
        const join: JoinCondition = {
            type,
            table,
            conditions
        };
        this.state.joins.push(join);
    }

    /**
     * Group results by fields
     */
    groupBy(...fields: string[]): IQueryBuilder<T> {
        this.state.groupBy.push(...fields);
        return this;
    }

    /**
     * Add a HAVING condition
     */
    having(field: string, operator: FilterOperator, value: any): IQueryBuilder<T> {
        const condition: HavingCondition = {
            field,
            operator,
            value,
            connector: 'AND'
        };
        this.state.having.push(condition);
        return this;
    }

    /**
     * Order results by a field
     */
    orderBy(field: string, direction: OrderDirection = 'ASC'): IQueryBuilder<T> {
        const order: OrderSpec = { field, direction };
        this.state.orderBy.push(order);
        return this;
    }

    /**
     * Limit number of results
     */
    limit(count: number): IQueryBuilder<T> {
        this.state.limit = count;
        return this;
    }

    /**
     * Skip a number of results
     */
    offset(count: number): IQueryBuilder<T> {
        this.state.offset = count;
        return this;
    }

    /**
     * Return only distinct rows
     */
    distinct(): IQueryBuilder<T> {
        this.state.distinct = true;
        return this;
    }

    /**
     * Execute an aggregate query
     */
    private async executeAggregate(func: string, field: string): Promise<any> {
        if (!this.executor) {
            throw new Error('Query executor not set');
        }

        const table = `\`${this.getTableName(this.state.table)}\``;
        const escapedField = field === '*' ? '*' : this.escapeField(field);

        const { sql: whereClause, params: whereParams } = this.buildWhereClause();
        const joinClause = this.buildJoinClause();
        const groupByClause = this.buildGroupByClause();
        const { sql: havingClause, params: havingParams } = this.buildHavingClause();

        const sqlParts = [
            `SELECT ${func}(${escapedField}) as result`,
            `FROM ${table}`,
            joinClause,
            whereClause,
            groupByClause,
            havingClause
        ].filter(Boolean);

        const sql = sqlParts.join(' ');
        const params = [...whereParams, ...havingParams];

        const result = await this.executor.sql(sql, params);
        return result[0]?.result ?? 0;
    }

    /**
     * Count rows
     */
    async count(field: string = '*'): Promise<number> {
        const result = await this.executeAggregate('COUNT', field);
        return Number(result) || 0;
    }

    /**
     * Sum a numeric field
     */
    async sum(field: string): Promise<number> {
        const result = await this.executeAggregate('SUM', field);
        return Number(result) || 0;
    }

    /**
     * Average a numeric field
     */
    async avg(field: string): Promise<number> {
        const result = await this.executeAggregate('AVG', field);
        return Number(result) || 0;
    }

    /**
     * Get minimum value of a field
     */
    async min(field: string): Promise<any> {
        return this.executeAggregate('MIN', field);
    }

    /**
     * Get maximum value of a field
     */
    async max(field: string): Promise<any> {
        return this.executeAggregate('MAX', field);
    }

    /**
     * Generate the SQL query
     */
    toSQL(): QuerySQL {
        const table = `\`${this.getTableName(this.state.table)}\``;
        const selectFields = this.buildSelectFields();
        const { sql: whereClause, params: whereParams } = this.buildWhereClause();
        const joinClause = this.buildJoinClause();
        const groupByClause = this.buildGroupByClause();
        const { sql: havingClause, params: havingParams } = this.buildHavingClause();
        const orderByClause = this.buildOrderByClause();
        const limitClause = this.buildLimitClause();

        const sqlParts = [
            `SELECT ${selectFields}`,
            `FROM ${table}`,
            joinClause,
            whereClause,
            groupByClause,
            havingClause,
            orderByClause,
            limitClause
        ].filter(Boolean);

        return {
            sql: sqlParts.join(' '),
            params: [...whereParams, ...havingParams]
        };
    }

    /**
     * Execute the query and return results
     */
    async run(): Promise<T[]> {
        if (!this.executor) {
            throw new Error('Query executor not set');
        }

        const { sql, params } = this.toSQL();
        return this.executor.sql(sql, params);
    }
}

/**
 * Create a query builder factory function
 * @param executor Database executor for running queries
 * @returns Factory function that creates query builders for tables
 */
export function createQueryBuilder(executor: QueryExecutor): <T = any>(table: string) => QueryBuilder<T> {
    return <T = any>(table: string) => new QueryBuilder<T>(executor, table);
}

/**
 * Convenience function to start a query from a table
 * @param executor Database executor
 * @param table Table name
 * @returns QueryBuilder instance
 */
export function from<T = any>(executor: QueryExecutor, table: string): QueryBuilder<T> {
    return new QueryBuilder<T>(executor, table);
}
