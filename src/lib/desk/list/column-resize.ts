/**
 * Column Resize Utilities
 * Provides column resizing functionality for DataTable with localStorage persistence
 */

const STORAGE_KEY_PREFIX = 'list-view-column-widths-';

export interface ColumnWidth {
    fieldname: string;
    width: number;
}

/**
 * Save column widths to localStorage
 */
export function saveColumnWidths(doctype: string, widths: ColumnWidth[]): void {
    try {
        localStorage.setItem(STORAGE_KEY_PREFIX + doctype, JSON.stringify(widths));
    } catch (e) {
        console.warn('Failed to save column widths:', e);
    }
}

/**
 * Load column widths from localStorage
 */
export function loadColumnWidths(doctype: string): ColumnWidth[] | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_PREFIX + doctype);
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        console.warn('Failed to load column widths:', e);
        return null;
    }
}

/**
 * Clear saved column widths
 */
export function clearColumnWidths(doctype: string): void {
    try {
        localStorage.removeItem(STORAGE_KEY_PREFIX + doctype);
    } catch (e) {
        console.warn('Failed to clear column widths:', e);
    }
}

/**
 * Svelte action for making a column header resizable
 * Usage: <th use:resizable={{ onResize: handleResize, minWidth: 50 }}>
 */
export function resizable(
    node: HTMLElement,
    params: { onResize: (width: number) => void; minWidth?: number }
) {
    const { onResize, minWidth = 50 } = params;
    let startX: number;
    let startWidth: number;
    let isResizing = false;

    // Create resize handle
    const handle = document.createElement('div');
    handle.className = 'column-resize-handle';
    handle.style.cssText = `
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		width: 5px;
		cursor: col-resize;
		background: transparent;
		z-index: 10;
	`;

    // Ensure parent has position relative
    if (getComputedStyle(node).position === 'static') {
        node.style.position = 'relative';
    }
    node.appendChild(handle);

    function onMouseDown(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        startX = e.clientX;
        startWidth = node.offsetWidth;

        handle.style.background = 'var(--cds-interactive, #0f62fe)';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function onMouseMove(e: MouseEvent) {
        if (!isResizing) return;
        const diff = e.clientX - startX;
        const newWidth = Math.max(minWidth, startWidth + diff);
        node.style.width = `${newWidth}px`;
    }

    function onMouseUp() {
        if (!isResizing) return;
        isResizing = false;
        handle.style.background = 'transparent';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        onResize(node.offsetWidth);
    }

    handle.addEventListener('mousedown', onMouseDown);

    return {
        destroy() {
            handle.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            handle.remove();
        }
    };
}
