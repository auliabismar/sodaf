# Auto-Save Implementation Guide

## FormController Improvements Needed

Based on the analysis, the following improvements should be made to the FormController before implementing comprehensive tests:

### 1. Auto-save Cleanup on Destruction
```typescript
// Add to FormController class
destroy(): void {
    this.cancelAutoSave();
    // Clear all event handlers
    this.eventHandlers.clear();
}
```

### 2. Enhanced Auto-save Logic
```typescript
// Improve scheduleAutoSave method
private scheduleAutoSave(): void {
    // Only schedule if document is actually dirty
    if (!this.isDirty()) {
        return;
    }
    
    this.cancelAutoSave();
    
    this.autoSaveTimeout = setTimeout(async () => {
        if (this.isDirty() && !this.getState().is_saving) {
            try {
                await this.save();
                await this.triggerEvent('on_auto_save', this.getState());
            } catch (error) {
                await this.triggerEvent('on_auto_save_error', error as Error, this.getState());
            }
        }
    }, this.autoSaveInterval);
}
```

### 3. Validation Before Auto-save
```typescript
// Modify save method to handle auto-save validation
async save(isAutoSave = false): Promise<SaveResult> {
    const state = this.getState();
    
    // Skip validation for auto-save if configured
    if (!isAutoSave || this.config?.validate_on_auto_save) {
        const isValid = this.validate();
        if (!isValid) {
            const errors = this.getErrors();
            await this.triggerEvent('on_validation_error', errors, this.getState());
            return {
                success: false,
                errors,
                message: 'Validation failed'
            };
        }
    }
    
    // ... rest of save logic
}
```

### 4. Configuration Options
Add to FormControllerConfig interface:
```typescript
export interface FormControllerConfig {
    // ... existing properties
    /** Whether to validate before auto-save */
    validate_on_auto_save?: boolean;
    /** Maximum number of auto-save retries */
    auto_save_max_retries?: number;
    /** Whether to show auto-save notifications */
    show_auto_save_notifications?: boolean;
}
```

## Test Implementation Strategy

### Phase 1: Basic Functionality Tests
1. Test auto-save scheduling on field changes
2. Test auto-save triggering after interval
3. Test auto-save with different configurations
4. Test auto-save cancellation scenarios

### Phase 2: Error Handling Tests
1. Test auto-save with validation errors
2. Test auto-save with network failures
3. Test auto-save with server errors
4. Test auto-save retry logic

### Phase 3: Edge Cases Tests
1. Test auto-save with concurrent changes
2. Test auto-save with document state changes
3. Test auto-save memory cleanup
4. Test auto-save with various field types

### Phase 4: Integration Tests
1. Test auto-save with child tables
2. Test auto-save with workflow changes
3. Test auto-save with permission changes
4. Test auto-save with user interactions

## Test Helper Functions

### Create Mock Controller
```typescript
function createAutoSaveController(config?: Partial<FormControllerConfig>): FormController {
    return new FormController('Task', {
        doctype: 'Task',
        auto_save: true,
        auto_save_interval: 100,
        ...config
    });
}
```

### Setup Timer Tests
```typescript
function setupTimerTests() {
    vi.useFakeTimers();
    return () => vi.useRealTimers();
}
```

### Mock Save Responses
```typescript
function mockSaveResponse(success: boolean, error?: string) {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;
    
    if (success) {
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ data: { ...mockDocument } })
        });
    } else {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ error: { message: error } })
        });
    }
}
```

## Test Implementation Examples

### Test 1: Basic Auto-save Scheduling
```typescript
it('should schedule auto-save on single field change', async () => {
    const cleanup = setupTimerTests();
    const controller = createAutoSaveController();
    await controller.load('TASK-001');
    
    const saveSpy = vi.spyOn(controller, 'save');
    const scheduleSpy = vi.spyOn(controller as any, 'scheduleAutoSave');
    
    controller.setValue('subject', 'Updated Subject');
    
    expect(scheduleSpy).toHaveBeenCalled();
    expect(saveSpy).not.toHaveBeenCalled();
    
    await vi.advanceTimersByTimeAsync(100);
    
    expect(saveSpy).toHaveBeenCalledTimes(1);
    
    cleanup();
});
```

### Test 2: Auto-save Cancellation
```typescript
it('should cancel auto-save on manual save', async () => {
    const cleanup = setupTimerTests();
    const controller = createAutoSaveController();
    await controller.load('TASK-001');
    
    const saveSpy = vi.spyOn(controller, 'save');
    const cancelSpy = vi.spyOn(controller as any, 'cancelAutoSave');
    
    controller.setValue('subject', 'Updated');
    await controller.save();
    
    expect(cancelSpy).toHaveBeenCalled();
    
    await vi.advanceTimersByTimeAsync(200);
    
    expect(saveSpy).toHaveBeenCalledTimes(1); // Only manual save
    
    cleanup();
});
```

### Test 3: Auto-save with Validation Errors
```typescript
it('should handle validation errors during auto-save', async () => {
    const cleanup = setupTimerTests();
    const controller = createAutoSaveController({
        validate_on_auto_save: true
    });
    await controller.load('TASK-001');
    
    const saveSpy = vi.spyOn(controller, 'save');
    const errorSpy = vi.fn();
    controller.on('on_validation_error', errorSpy);
    
    // Clear required field to trigger validation error
    controller.setValue('subject', '');
    
    await vi.advanceTimersByTimeAsync(100);
    
    expect(saveSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    
    const state = controller.getState();
    expect(state.errors.subject).toBeDefined();
    
    cleanup();
});
```

### Test 4: Concurrent Field Changes
```typescript
it('should debounce multiple rapid field changes', async () => {
    const cleanup = setupTimerTests();
    const controller = createAutoSaveController();
    await controller.load('TASK-001');
    
    const saveSpy = vi.spyOn(controller, 'save');
    
    // Make multiple rapid changes
    controller.setValue('subject', 'Change 1');
    controller.setValue('description', 'Change 2');
    controller.setValue('status', 'Change 3');
    
    await vi.advanceTimersByTimeAsync(100);
    
    // Should only save once
    expect(saveSpy).toHaveBeenCalledTimes(1);
    
    cleanup();
});
```

## Performance Testing

### Memory Leak Detection
```typescript
it('should not leak memory with multiple auto-saves', async () => {
    const cleanup = setupTimerTests();
    const controller = createAutoSaveController();
    await controller.load('TASK-001');
    
    const initialTimeouts = setTimeout.toString();
    
    // Trigger multiple auto-saves
    for (let i = 0; i < 10; i++) {
        controller.setValue('subject', `Change ${i}`);
        await vi.advanceTimersByTimeAsync(100);
    }
    
    // Force garbage collection if available
    if (global.gc) {
        global.gc();
    }
    
    const finalTimeouts = setTimeout.toString();
    
    // Should not accumulate timeouts
    expect(finalTimeouts).toBe(initialTimeouts);
    
    cleanup();
});
```

## Integration Testing

### Auto-save with Child Tables
```typescript
it('should auto-save child table changes', async () => {
    const cleanup = setupTimerTests();
    const controller = createAutoSaveController();
    await controller.load('TASK-001');
    
    const saveSpy = vi.spyOn(controller, 'save');
    
    // Simulate child table change
    controller.setValue('items', [
        { item_code: 'ITEM-001', qty: 1 },
        { item_code: 'ITEM-002', qty: 2 }
    ]);
    
    await vi.advanceTimersByTimeAsync(100);
    
    expect(saveSpy).toHaveBeenCalled();
    
    cleanup();
});
```

## Documentation Requirements

### Auto-save Configuration Documentation
```markdown
## Auto-save Configuration

The FormController supports automatic saving of form data. Configure auto-save using the following options:

- `auto_save`: Enable/disable auto-save (default: false)
- `auto_save_interval`: Time in milliseconds before auto-save triggers (default: 30000)
- `validate_on_auto_save`: Whether to validate before auto-save (default: false)
- `auto_save_max_retries`: Maximum retry attempts on failure (default: 3)
- `show_auto_save_notifications`: Show UI notifications for auto-save (default: true)

### Events
- `on_auto_save`: Triggered after successful auto-save
- `on_auto_save_error`: Triggered when auto-save fails
```

## Next Steps

1. Implement the FormController improvements
2. Add the comprehensive test suite
3. Update documentation
4. Add performance benchmarks
5. Create integration examples