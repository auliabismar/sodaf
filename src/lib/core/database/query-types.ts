/**
 * Query Builder Types
 * 
 * This module defines TypeScript types and interfaces for the fluent
 * query builder API inspired by Frappe's PyPika-based frappe.qb.
 */

import type { FilterOperator } from './types';

/**
 * Aggregate functions supported in queries
 */
export type AggregateFunction = 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';

/**
 * Join types for table joins
 */
export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'CROSS';

/**
 * Order direction for sorting
 */
export type OrderDirection = 'ASC' | 'DESC';

/**
 * Join condition specification
 * Maps left table.field to right table.field
 */
export interface JoinCondition {
    /** Join type */
    type: JoinType;
    /** Table to join */
    table: string;
    /** Join conditions: { 'leftTable.field': 'rightTable.field' } */
    conditions: Record<string, string>;
}

/**
 * Where condition for query filtering
 */
export interface WhereCondition {
    /** Field name (can include table prefix) */
    field: string;
    /** Comparison operator */
    operator: FilterOperator;
    /** Value to compare against */
    value: any;
    /** How to combine with previous condition */
    connector: 'AND' | 'OR';
}

/**
 * Order specification for sorting
 */
export interface OrderSpec {
    /** Field name to order by */
    field: string;
    /** Sort direction */
    direction: OrderDirection;
}

/**
 * Aggregate specification
 */
export interface AggregateSpec {
    /** Aggregate function to apply */
    function: AggregateFunction;
    /** Field to aggregate */
    field: string;
    /** Alias for the result */
    alias?: string;
}

/**
 * Having condition for grouped queries
 */
export interface HavingCondition {
    /** Field or aggregate expression */
    field: string;
    /** Comparison operator */
    operator: FilterOperator;
    /** Value to compare against */
    value: any;
    /** How to combine with previous condition */
    connector: 'AND' | 'OR';
}

/**
 * Query builder state
 * Internal representation of the query being built
 */
export interface QueryBuilderState {
    /** Main table name */
    table: string;
    /** Fields to select (empty means all) */
    fields: string[];
    /** Where conditions */
    where: WhereCondition[];
    /** Join specifications */
    joins: JoinCondition[];
    /** Group by fields */
    groupBy: string[];
    /** Having conditions */
    having: HavingCondition[];
    /** Order specifications */
    orderBy: OrderSpec[];
    /** Limit count */
    limit?: number;
    /** Offset count */
    offset?: number;
    /** Whether to select distinct */
    distinct: boolean;
    /** Aggregate functions to apply */
    aggregates: AggregateSpec[];
}

/**
 * Database executor interface
 * Minimal interface needed to execute queries
 */
export interface QueryExecutor {
    /**
     * Execute a raw SQL query
     * @param query SQL query string with placeholders
     * @param values Values for placeholders
     * @returns Promise resolving to query results
     */
    sql(query: string, values?: any[]): Promise<any[]>;

    /**
     * Execute a SQL statement that doesn't return data
     * @param query SQL query string with placeholders
     * @param values Values for placeholders
     * @returns Promise resolving to operation result
     */
    run?(query: string, values?: any[]): Promise<any>;
}

/**
 * Query builder result with SQL and parameters
 */
export interface QuerySQL {
    /** Generated SQL query */
    sql: string;
    /** Parameter values for placeholders */
    params: any[];
}

/**
 * Fluent query builder interface
 * All methods return the builder for chaining except terminal methods
 */
export interface IQueryBuilder<T = any> {
    /**
     * Select specific fields
     * @param fields Field names to select
     */
    select(...fields: string[]): IQueryBuilder<T>;

    /**
     * Add a WHERE condition (AND)
     * @param field Field name
     * @param operator Comparison operator
     * @param value Value to compare
     */
    where(field: string, operator: FilterOperator, value: any): IQueryBuilder<T>;

    /**
     * Add a WHERE condition (OR)
     * @param field Field name
     * @param operator Comparison operator
     * @param value Value to compare
     */
    orWhere(field: string, operator: FilterOperator, value: any): IQueryBuilder<T>;

    /**
     * Add an INNER JOIN
     * @param table Table to join
     * @param conditions Join conditions
     */
    join(table: string, conditions: Record<string, string>): IQueryBuilder<T>;

    /**
     * Add a LEFT JOIN
     * @param table Table to join
     * @param conditions Join conditions
     */
    leftJoin(table: string, conditions: Record<string, string>): IQueryBuilder<T>;

    /**
     * Group results by fields
     * @param fields Field names to group by
     */
    groupBy(...fields: string[]): IQueryBuilder<T>;

    /**
     * Add a HAVING condition
     * @param field Field or aggregate expression
     * @param operator Comparison operator
     * @param value Value to compare
     */
    having(field: string, operator: FilterOperator, value: any): IQueryBuilder<T>;

    /**
     * Order results by a field
     * @param field Field name
     * @param direction Sort direction (default: ASC)
     */
    orderBy(field: string, direction?: OrderDirection): IQueryBuilder<T>;

    /**
     * Limit number of results
     * @param count Maximum number of results
     */
    limit(count: number): IQueryBuilder<T>;

    /**
     * Skip a number of results
     * @param count Number of results to skip
     */
    offset(count: number): IQueryBuilder<T>;

    /**
     * Return only distinct rows
     */
    distinct(): IQueryBuilder<T>;

    /**
     * Count rows
     * @param field Optional field to count (default: *)
     * @returns Promise resolving to count
     */
    count(field?: string): Promise<number>;

    /**
     * Sum a numeric field
     * @param field Field to sum
     * @returns Promise resolving to sum
     */
    sum(field: string): Promise<number>;

    /**
     * Average a numeric field
     * @param field Field to average
     * @returns Promise resolving to average
     */
    avg(field: string): Promise<number>;

    /**
     * Get minimum value of a field
     * @param field Field to get minimum of
     * @returns Promise resolving to minimum value
     */
    min(field: string): Promise<any>;

    /**
     * Get maximum value of a field
     * @param field Field to get maximum of
     * @returns Promise resolving to maximum value
     */
    max(field: string): Promise<any>;

    /**
     * Execute the query and return results
     * @returns Promise resolving to array of results
     */
    run(): Promise<T[]>;

    /**
     * Get the generated SQL and parameters
     * Useful for debugging
     * @returns Object with sql string and params array
     */
    toSQL(): QuerySQL;
}

/**
 * Factory function type for creating query builders
 */
export type QueryBuilderFactory = <T = any>(table: string) => IQueryBuilder<T>;
