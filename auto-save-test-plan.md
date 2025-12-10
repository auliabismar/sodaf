# Auto-Save Test Plan for FormController

## Overview
This document outlines a comprehensive test plan for the auto-save functionality in the FormController class. The plan expands the existing single test case to cover all edge cases and scenarios.

## Current Implementation Analysis

### Existing Features
1. **Configuration**: Auto-save enabled via `auto_save: true` in FormControllerConfig
2. **Interval Configuration**: Configurable via `auto_save_interval` (default: 30000ms)
3. **Scheduling Trigger**: Auto-save scheduled when `setValue()` or `setValues()` is called
4. **Cancellation**: Auto-save cancelled when manual save is successful
5. **Private Methods**: `scheduleAutoSave()` and `cancelAutoSave()` handle the logic

### Identified Issues
1. No cleanup of auto-save timeout when form is destroyed
2. No validation error handling before auto-save
3. No specific event for auto-save completion
4. Auto-save schedules even if document isn't actually dirty
5. No handling of network failures during auto-save
6. Concurrent field changes may cause multiple auto-saves

## Comprehensive Test Cases

### 1. Basic Auto-save Functionality
- **T26.1**: Schedule auto-save on single field change
- **T26.2**: Schedule auto-save on multiple field changes via `setValues()`
- **T26.3**: Auto-save triggers after configured interval
- **T26.4**: Auto-save does not trigger if disabled in config
- **T26.5**: Default auto-save interval is 30000ms

### 2. Auto-save Cancellation
- **T26.6**: Auto-save cancelled on manual save
- **T26.7**: Auto-save cancelled on form submission
- **T26.8**: Auto-save cancelled on form cancellation
- **T26.9**: Auto-save cancelled on document reload
- **T26.10**: Auto-save cancelled when loading new document

### 3. Configuration Options
- **T26.11**: Custom auto-save interval respected
- **T26.12**: Auto-save disabled when `auto_save: false`
- **T26.13**: Auto-save enabled when `auto_save: true`
- **T26.14**: Default configuration has auto-save disabled

### 4. Document State Handling
- **T26.15**: Auto-save works with new documents
- **T26.16**: Auto-save works with existing documents
- **T26.17**: Auto-save not triggered if document not dirty
- **T26.18**: Auto-save handles document name changes
- **T26.19**: Auto-save with document status changes

### 5. Validation and Error Handling
- **T26.20**: Auto-save respects validation errors
- **T26.21**: Auto-save triggers validation before saving
- **T26.22**: Auto-save handles network failures gracefully
- **T26.23**: Auto-save handles server errors gracefully
- **T26.24**: Auto-save retries on network failure (if implemented)

### 6. Concurrent Changes
- **T26.25**: Multiple rapid field changes result in single auto-save
- **T26.26**: Auto-save debounces properly with concurrent changes
- **T26.27**: Auto-save resets timer on each change
- **T26.28**: Auto-save handles conflicting changes

### 7. Event System
- **T26.29**: Auto-save triggers appropriate events
- **T26.30**: Auto-save respects `on_before_save` event cancellation
- **T26.31**: Auto-save triggers `on_save` event on success
- **T26.32**: Auto-save triggers `on_after_save` event on success
- **T26.33**: Auto-save triggers `on_error` event on failure

### 8. Edge Cases
- **T26.34**: Auto-save with very short intervals (1ms)
- **T26.35**: Auto-save with very long intervals (5 minutes)
- **T26.36**: Auto-save during document deletion
- **T26.37**: Auto-save during document amendment
- **T26.38**: Auto-save with read-only fields
- **T26.39**: Auto-save with hidden fields
- **T26.40**: Auto-save with disabled fields

### 9. Memory and Cleanup
- **T26.41**: Auto-save timeout cleared on controller destruction
- **T26.42**: No memory leaks with multiple auto-save schedules
- **T26.43**: Auto-save cleanup on navigation away
- **T26.44**: Auto-save cleanup on form reset

### 10. Integration Scenarios
- **T26.45**: Auto-save with child table changes
- **T26.46**: Auto-save with file attachments
- **T26.47**: Auto-save with workflow state changes
- **T26.48**: Auto-save with permission changes
- **T26.49**: Auto-save with user session expiry
- **T26.50**: Auto-save with browser tab visibility changes

## Test Implementation Structure

```typescript
describe('P3-006-T26: Comprehensive Auto-save Tests', () => {
    
    // Test groups for each category above
    
    describe('Basic Auto-save Functionality', () => {
        // Tests T26.1-T26.5
    });
    
    describe('Auto-save Cancellation', () => {
        // Tests T26.6-T26.10
    });
    
    // ... other test groups
});
```

## Mock Requirements

1. **Timer Mocks**: Using `vi.useFakeTimers()` for precise timing control
2. **Fetch Mocks**: Mock API responses for save operations
3. **Event Spies**: Track event triggering during auto-save
4. **State Spies**: Monitor form state changes
5. **Network Error Simulation**: Test failure scenarios

## Test Data Requirements

1. **Mock Document**: Standard document with various field types
2. **Mock DocType**: Complete DocType definition with validation rules
3. **Mock API Responses**: Success, error, and network failure responses
4. **Configuration Variants**: Different auto-save configurations

## Performance Considerations

1. **Timer Cleanup**: Ensure all timers are properly cleaned up
2. **Async Handling**: Proper async/await patterns for timer-based tests
3. **Memory Management**: Check for memory leaks in timeout handling
4. **Concurrent Operations**: Test race conditions properly

## Implementation Recommendations

1. **Use `vi.useFakeTimers()`** for precise timing control
2. **Create helper functions** for common test scenarios
3. **Use `vi.spyOn()`** to monitor private methods
4. **Implement proper cleanup** in `afterEach` hooks
5. **Test both positive and negative scenarios**
6. **Include integration tests** with real-world scenarios

## Code Examples

### Basic Auto-save Test
```typescript
it('should schedule auto-save on field change', async () => {
    vi.useFakeTimers();
    const controller = new FormController('Task', {
        doctype: 'Task',
        auto_save: true,
        auto_save_interval: 100
    });
    await controller.load('TASK-001');
    
    const saveSpy = vi.spyOn(controller, 'save');
    
    controller.setValue('subject', 'Updated');
    
    expect(saveSpy).not.toHaveBeenCalled();
    
    await vi.advanceTimersByTimeAsync(100);
    
    expect(saveSpy).toHaveBeenCalled();
    
    vi.useRealTimers();
});
```

### Auto-save Cancellation Test
```typescript
it('should cancel auto-save on manual save', async () => {
    vi.useFakeTimers();
    const controller = new FormController('Task', {
        doctype: 'Task',
        auto_save: true,
        auto_save_interval: 1000
    });
    await controller.load('TASK-001');
    
    const saveSpy = vi.spyOn(controller, 'save');
    const cancelSpy = vi.spyOn(controller as any, 'cancelAutoSave');
    
    controller.setValue('subject', 'Updated');
    await controller.save();
    
    expect(cancelSpy).toHaveBeenCalled();
    
    await vi.advanceTimersByTimeAsync(2000);
    
    expect(saveSpy).toHaveBeenCalledTimes(1); // Only manual save
    
    vi.useRealTimers();
});
```

## Next Steps

1. Implement all 50 test cases in the existing test file
2. Add helper functions for common test patterns
3. Ensure proper cleanup and isolation between tests
4. Add performance benchmarks for auto-save operations
5. Create documentation for auto-save behavior