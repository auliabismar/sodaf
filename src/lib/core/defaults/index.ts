/**
 * Defaults Module Exports
 *
 * Exports the DefaultManager and related types for the
 * multi-level default values system.
 *
 * @module core/defaults
 */

export { DefaultManager, createDefaultManager } from './default-manager';
export type {
    DefaultScope,
    DefaultEntry,
    DefaultManagerOptions,
    DefaultDatabase
} from './types';
