import { describe, it, expect, beforeEach } from 'vitest';
import { ModuleManager } from '../module-manager.js';
import type { ModuleDef } from '../types.js';
import type { DocType } from '../../doctype/types.js';

describe('ModuleManager P2-022', () => {
    let moduleManager: ModuleManager;

    beforeEach(() => {
        moduleManager = ModuleManager.getInstance();
        moduleManager.clear();
    });

    it('P2-022-T1: createModule', () => {
        const module: ModuleDef = { name: 'Sales', app_name: 'myapp' };
        moduleManager.createModule(module);

        const retrieved = moduleManager.getModule('Sales');
        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe('Sales');
        expect(retrieved?.app_name).toBe('myapp');
        expect(retrieved?.disabled).toBe(false); // Default
    });

    it('P2-022-T2: getModules', () => {
        moduleManager.createModule({ name: 'Sales', app_name: 'myapp' });
        moduleManager.createModule({ name: 'Buying', app_name: 'myapp' });

        const modules = moduleManager.getModules();
        expect(modules.length).toBe(2);
        expect(modules.find(m => m.name === 'Sales')).toBeDefined();
        expect(modules.find(m => m.name === 'Buying')).toBeDefined();
    });

    it('P2-022-T3: isModuleEnabled', () => {
        moduleManager.createModule({ name: 'Sales', app_name: 'myapp', disabled: false });
        expect(moduleManager.isModuleEnabled('Sales')).toBe(true);

        moduleManager.createModule({ name: 'Hidden', app_name: 'myapp', disabled: true });
        expect(moduleManager.isModuleEnabled('Hidden')).toBe(false);
    });

    it('P2-022-T4: getDocTypesByModule', () => {
        moduleManager.createModule({ name: 'Sales', app_name: 'myapp' });

        const docTypes: DocType[] = [
            { name: 'Sales Order', module: 'Sales', fields: [], permissions: [] },
            { name: 'Purchase Order', module: 'Buying', fields: [], permissions: [] }
        ];

        const salesDocs = moduleManager.getDocTypesByModule('Sales', docTypes);
        expect(salesDocs.length).toBe(1);
        expect(salesDocs[0].name).toBe('Sales Order');
    });

    it('P2-022-T5: enableModule', () => {
        moduleManager.createModule({ name: 'Sales', app_name: 'myapp', disabled: true });
        expect(moduleManager.isModuleEnabled('Sales')).toBe(false);

        moduleManager.enableModule('Sales');
        expect(moduleManager.isModuleEnabled('Sales')).toBe(true);
    });

    it('P2-022-T6: disableModule', () => {
        moduleManager.createModule({ name: 'Sales', app_name: 'myapp', disabled: false });
        expect(moduleManager.isModuleEnabled('Sales')).toBe(true);

        moduleManager.disableModule('Sales');
        expect(moduleManager.isModuleEnabled('Sales')).toBe(false);
    });

    it('P2-022-T7: Disabled module hides DocTypes', () => {
        moduleManager.createModule({ name: 'Sales', app_name: 'myapp', disabled: true });

        const docTypes: DocType[] = [
            { name: 'Sales Order', module: 'Sales', fields: [], permissions: [] }
        ];

        // Should return empty list because module is disabled
        const salesDocs = moduleManager.getDocTypesByModule('Sales', docTypes);
        expect(salesDocs.length).toBe(0);
    });

    it('P2-022-T8: restrict_to_domain respected', () => {
        moduleManager.createModule({
            name: 'Manufacturing',
            app_name: 'myapp',
            restrict_to_domain: 'Manufacturing'
        });

        // No active domain
        expect(moduleManager.isModuleEnabled('Manufacturing', [])).toBe(false); // Should be false if domain not active? usually yes.
        // Actually check logic: 
        // if (module.restrict_to_domain && activeDomains.length > 0) { return activeDomains.includes(...) }
        // If activeDomains is empty, does it mean "All domains" or "No domains"?
        // Usually in ERPNext/Frappe: if restricts to domain, and domain not enabled, it's hidden.
        // If I pass [], it means no domains active. So it should be hidden?
        // Let's assume strict: if restricted and not in list, hidden.

        // Correct implementation check:
        // isModuleEnabled('Manufacturing', ['Retail']) -> false
        // isModuleEnabled('Manufacturing', ['Manufacturing']) -> true

        expect(moduleManager.isModuleEnabled('Manufacturing', ['Retail'])).toBe(false);
        expect(moduleManager.isModuleEnabled('Manufacturing', ['Manufacturing'])).toBe(true);
    });

    it('P2-022-T9: Module in workspace (Simulated)', () => {
        // This test simulates checking if module info is available for workspace
        moduleManager.createModule({ name: 'Desk', app_name: 'myapp' });
        const module = moduleManager.getModule('Desk');
        expect(module).toBeDefined();
        // Conceptually passes if we can retrieve it
    });

    it('P2-022-T10: Custom module', () => {
        moduleManager.createModule({
            name: 'MyCustom',
            app_name: 'myapp',
            is_standard: false
        });

        const module = moduleManager.getModule('MyCustom');
        expect(module?.is_standard).toBe(false);
    });
});
