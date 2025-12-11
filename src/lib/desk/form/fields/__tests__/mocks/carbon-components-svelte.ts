// Mock Carbon Components for jsdom testing (Svelte 5 compatibility)
// These mocks provide minimal component implementations to avoid $$component errors
// Each mock returns a minimal Svelte-like object structure

const createMockComponent = (name: string) => {
    // Return an object that mimics a Svelte component
    // Svelte expects components to be callable (constructor-like)
    const component = function (options: any = {}) {
        return {
            $$: { on_mount: [] as any[], on_destroy: [] as any[], fragment: null },
            $set: () => { },
            $on: () => () => { },
            $destroy: () => { },
            $$set: () => { },
        };
    };
    // Mark as component for Svelte
    (component as any).$$render = () => '';
    return component;
};

export const DataTable = createMockComponent('DataTable');
export const Pagination = createMockComponent('Pagination');
export const Button = createMockComponent('Button');
export const Toolbar = createMockComponent('Toolbar');
export const ToolbarContent = createMockComponent('ToolbarContent');
export const ToolbarMenu = createMockComponent('ToolbarMenu');
export const ToolbarMenuItem = createMockComponent('ToolbarMenuItem');
export const ToolbarBatchActions = createMockComponent('ToolbarBatchActions');
export const ToolbarSearch = createMockComponent('ToolbarSearch');
export const SkeletonText = createMockComponent('SkeletonText');
export const Select = createMockComponent('Select');
export const SelectItem = createMockComponent('SelectItem');
export const TextInput = createMockComponent('TextInput');
export const DatePicker = createMockComponent('DatePicker');
export const DatePickerInput = createMockComponent('DatePickerInput');
export const OverflowMenu = createMockComponent('OverflowMenu');
export const OverflowMenuItem = createMockComponent('OverflowMenuItem');
export const Checkbox = createMockComponent('Checkbox');
export const InlineNotification = createMockComponent('InlineNotification');
export const Modal = createMockComponent('Modal');
export const NumberInput = createMockComponent('NumberInput');
export const Toggle = createMockComponent('Toggle');
export const Dropdown = createMockComponent('Dropdown');
export const ComboBox = createMockComponent('ComboBox');
export const TextArea = createMockComponent('TextArea');
export const TimePicker = createMockComponent('TimePicker');
export const TimePickerSelect = createMockComponent('TimePickerSelect');
export const Loading = createMockComponent('Loading');
export const Tag = createMockComponent('Tag');
export const Search = createMockComponent('Search');

// Add a proxy to handle any other components
export default new Proxy({}, {
    get: (_target, prop) => createMockComponent(String(prop))
});

