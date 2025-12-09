/**
 * Module Definition Types
 */

export interface ModuleDef {
    name: string; // ID of the module
    app_name: string; // App name the module belongs to
    label?: string; // Human readable label
    icon?: string; // Icon for the module
    disabled?: boolean; // Is the module disabled?
    restrict_to_domain?: string; // Only show if this domain is active
    is_standard?: boolean; // Is this a standard module?
    description?: string; // Description of the module
}

export interface ModuleConfig {
    modules: ModuleDef[];
}
