import type { ModuleDef } from './types.js';
import type { DocType } from '../doctype/types.js';

export class ModuleManager {
    private modules: Map<string, ModuleDef> = new Map();
    private static instance: ModuleManager;

    private constructor() { }

    public static getInstance(): ModuleManager {
        if (!ModuleManager.instance) {
            ModuleManager.instance = new ModuleManager();
        }
        return ModuleManager.instance;
    }

    /**
     * Create or update a module definition
     */
    public createModule(def: ModuleDef): ModuleDef {
        // Validation could go here
        this.modules.set(def.name, {
            ...def,
            disabled: def.disabled ?? false,
            is_standard: def.is_standard ?? false
        });
        return this.modules.get(def.name)!;
    }

    /**
     * Get all modules
     */
    public getModules(): ModuleDef[] {
        return Array.from(this.modules.values());
    }

    /**
     * Get a specific module
     */
    public getModule(name: string): ModuleDef | undefined {
        return this.modules.get(name);
    }

    /**
     * Check if a module is enabled
     * Checks both the disabled flag and domain restrictions
     */
    public isModuleEnabled(name: string, activeDomains: string[] = []): boolean {
        const module = this.modules.get(name);
        if (!module) return false;

        if (module.disabled) return false;

        if (module.restrict_to_domain) {
            return activeDomains.includes(module.restrict_to_domain);
        }

        return true;
    }

    /**
     * Enable a module
     */
    public enableModule(name: string): boolean {
        const module = this.modules.get(name);
        if (module) {
            module.disabled = false;
            return true;
        }
        return false;
    }

    /**
     * Disable a module
     */
    public disableModule(name: string): boolean {
        const module = this.modules.get(name);
        if (module) {
            module.disabled = true;
            return true;
        }
        return false;
    }

    /**
     * Get DocTypes belonging to a module
     * Takes an array of DocTypes to filter
     */
    public getDocTypesByModule(moduleName: string, docTypes: DocType[]): DocType[] {
        // If module is disabled, maybe we shouldn't return DocTypes?
        // Requirement T7: "Disabled module hides DocTypes" -> "DocTypes not visible"
        // So we should check if module is enabled? 
        // But usually getDocTypesByModule might just return them, and the UI filters.
        // However, T7 implies logic here.
        // Let's assume we return empty if disabled, unless specific override?
        // Or better, let's just filter by module property first.

        // Actually T7 says "Disabled module hides DocTypes", so `getDocTypesByModule` should probably return empty or we rely on `isModuleEnabled`.
        // I will implement it such that it returns DocTypes if the module is enabled (or if we don't strictly enforce it here, but the test expectations suggest it).
        // Let's implement strict checking: if module exists and is disabled, return [].
        // If module doesn't exist, maybe return [] or unsafe? I'll assume standard filtering.

        const module = this.modules.get(moduleName);
        if (module && module.disabled) {
            return [];
        }

        return docTypes.filter(dt => dt.module === moduleName);
    }

    /**
     * Clear all modules (for testing)
     */
    public clear(): void {
        this.modules.clear();
    }
}
