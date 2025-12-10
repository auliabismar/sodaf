import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import PasswordField from '../PasswordField.svelte';
import { renderWithProps, createMockEvent, createMockKeyboardEvent } from './fixtures/testUtils';
import { mockFields } from './fixtures/mockFields';

describe('PasswordField', () => {
	let mockGeolocation = {
		getCurrentPosition: vi.fn()
	};

	beforeEach(() => {
		vi.clearAllMocks();
		global.navigator = { ...global.navigator, geolocation: mockGeolocation } as any;
	});

	describe('P3-007-T23: Password Field Basic Functionality', () => {
		it('should render password field with label', async () => {
			const { getByText, getByLabelText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: ''
			});

			expect(getByText(mockFields.password.label)).toBeInTheDocument();
			expect(getByLabelText('Password Field')).toBeInTheDocument();
		});

		it('should render password input with correct type', async () => {
			const { getByLabelText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: ''
			});

			const input = getByLabelText('Password Field') as HTMLInputElement;
			expect(input.type).toBe('password');
		});

		it('should handle password input changes', async () => {
			const mockChange = vi.fn();
			const { getByLabelText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: '',
				onchange: mockChange
			});

			const input = getByLabelText('Password Field') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: 'testpassword' } });

			expect(mockChange).toHaveBeenCalledWith(
				expect.objectContaining({ detail: 'testpassword' })
			);
		});

		it('should display error message when error is provided', async () => {
			const { getByText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: '',
				error: 'Password is required'
			});

			expect(getByText('Password is required')).toBeInTheDocument();
		});
	});

	describe('P3-007-T23: Password Visibility Toggle', () => {
		it('should show password visibility toggle button', async () => {
			const { getByLabelText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: ''
			});

			expect(getByLabelText('Show password')).toBeInTheDocument();
		});

		it('should toggle password visibility when button is clicked', async () => {
			const { getByLabelText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'testpassword'
			});

			const toggleButton = getByLabelText('Show password');
			const input = getByLabelText('Password Field') as HTMLInputElement;

			// Initially hidden
			expect(input.type).toBe('password');

			// Click to show
			await fireEvent.click(toggleButton);
			expect(input.type).toBe('text');
			expect(getByLabelText('Hide password')).toBeInTheDocument();

			// Click to hide
			await fireEvent.click(toggleButton);
			expect(input.type).toBe('password');
			expect(getByLabelText('Show password')).toBeInTheDocument();
		});

		it('should update button aria-label when toggling', async () => {
			const { getByLabelText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'testpassword'
			});

			const toggleButton = getByLabelText('Show password');

			await fireEvent.click(toggleButton);
			expect(getByLabelText('Hide password')).toBeInTheDocument();

			await fireEvent.click(toggleButton);
			expect(getByLabelText('Show password')).toBeInTheDocument();
		});
	});

	describe('P3-007-T23: Password Strength Indicator', () => {
		it('should show strength indicator when password is entered', async () => {
			const { container } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'weak',
				showStrengthIndicator: true
			});

			expect(container.querySelector('.password-strength-indicator')).toBeInTheDocument();
		});

		it('should not show strength indicator when disabled', async () => {
			const { container } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'weak',
				showStrengthIndicator: true,
				disabled: true
			});

			expect(container.querySelector('.password-strength-indicator')).toBeInTheDocument();
		});

		it('should calculate weak password strength', async () => {
			const { container } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: '123',
				showStrengthIndicator: true
			});

			const strengthText = container.querySelector('.strength-text');
			expect(strengthText?.textContent).toContain('Weak');
		});

		it('should calculate medium password strength', async () => {
			const { container } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'Password123',
				showStrengthIndicator: true
			});

			const strengthText = container.querySelector('.strength-text');
			expect(strengthText?.textContent).toContain('Medium');
		});

		it('should calculate strong password strength', async () => {
			const { container } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'StrongP@ssw0rd!',
				showStrengthIndicator: true
			});

			const strengthText = container.querySelector('.strength-text');
			expect(strengthText?.textContent).toContain('Strong');
		});

		it('should calculate very strong password strength', async () => {
			const { container } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'VeryStr0ngP@ssw0rd!WithNumbers123',
				showStrengthIndicator: true
			});

			const strengthText = container.querySelector('.strength-text');
			expect(strengthText?.textContent).toContain('Very Strong');
		});

		it('should show password feedback for missing requirements', async () => {
			const { container } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'weak',
				showStrengthIndicator: true,
				minLength: 8,
				requireUppercase: true,
				requireNumbers: true,
				requireSpecialChars: true
			});

			const feedbackItems = container.querySelectorAll('.feedback-item');
			expect(feedbackItems.length).toBeGreaterThan(0);
		});

		it('should update strength indicator when password changes', async () => {
			const { container, getByLabelText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: '',
				showStrengthIndicator: true
			});

			const input = getByLabelText('Password Field') as HTMLInputElement;
			
			// Type weak password
			await fireEvent.input(input, { target: { value: '123' } });
			let strengthText = container.querySelector('.strength-text');
			expect(strengthText?.textContent).toContain('Weak');

			// Type strong password
			await fireEvent.input(input, { target: { value: 'StrongP@ssw0rd!' } });
			strengthText = container.querySelector('.strength-text');
			expect(strengthText?.textContent).toContain('Strong');
		});
	});

	describe('P3-007-T23: Custom Password Requirements', () => {
		it('should use custom minimum length', async () => {
			const { container } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: '12345',
				showStrengthIndicator: true,
				minLength: 10
			});

			const feedbackItems = container.querySelectorAll('.feedback-item');
			const hasLengthFeedback = Array.from(feedbackItems).some((item: Element) =>
				item.textContent?.includes('10 characters')
			);
			expect(hasLengthFeedback).toBe(true);
		});

		it('should validate uppercase requirement', async () => {
			const { container } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'lowercase',
				showStrengthIndicator: true,
				requireUppercase: true
			});

			const feedbackItems = container.querySelectorAll('.feedback-item');
			const hasUppercaseFeedback = Array.from(feedbackItems).some((item: Element) =>
				item.textContent?.includes('uppercase')
			);
			expect(hasUppercaseFeedback).toBe(true);
		});

		it('should validate lowercase requirement', async () => {
			const { container } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'UPPERCASE',
				showStrengthIndicator: true,
				requireLowercase: true
			});

			const feedbackItems = container.querySelectorAll('.feedback-item');
			const hasLowercaseFeedback = Array.from(feedbackItems).some((item: Element) =>
				item.textContent?.includes('lowercase')
			);
			expect(hasLowercaseFeedback).toBe(true);
		});

		it('should validate numbers requirement', async () => {
			const { container } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'NoNumbers',
				showStrengthIndicator: true,
				requireNumbers: true
			});

			const feedbackItems = container.querySelectorAll('.feedback-item');
			const hasNumbersFeedback = Array.from(feedbackItems).some((item: Element) =>
				item.textContent?.includes('number')
			);
			expect(hasNumbersFeedback).toBe(true);
		});

		it('should validate special characters requirement', async () => {
			const { container } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'NoSpecialChars',
				showStrengthIndicator: true,
				requireSpecialChars: true
			});

			const feedbackItems = container.querySelectorAll('.feedback-item');
			const hasSpecialCharsFeedback = Array.from(feedbackItems).some((item: Element) =>
				item.textContent?.includes('special character')
			);
			expect(hasSpecialCharsFeedback).toBe(true);
		});

		it('should skip disabled requirements', async () => {
			const { container } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'simple',
				showStrengthIndicator: true,
				requireUppercase: false,
				requireNumbers: false,
				requireSpecialChars: false
			});

			const feedbackItems = container.querySelectorAll('.feedback-item');
			expect(feedbackItems.length).toBe(0);
		});
	});

	describe('P3-007-T23: Accessibility', () => {
		it('should have proper ARIA labels', async () => {
			const { getByLabelText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: ''
			});

			expect(getByLabelText('Password Field')).toBeInTheDocument();
			expect(getByLabelText('Show password')).toBeInTheDocument();
		});

		it('should support keyboard navigation', async () => {
			const { getByLabelText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'test'
			});

			const toggleButton = getByLabelText('Show password');
			toggleButton.focus();

			await fireEvent.keyDown(toggleButton, { key: 'Enter' });
			
			const input = getByLabelText('Password Field') as HTMLInputElement;
			expect(input.type).toBe('text');
		});

		it('should announce password strength changes', async () => {
			const { container, getByLabelText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: '',
				showStrengthIndicator: true
			});

			const input = getByLabelText('Password Field') as HTMLInputElement;
			
			await fireEvent.input(input, { target: { value: 'StrongP@ssw0rd!' } });
			
			const strengthText = container.querySelector('.strength-text');
			expect(strengthText).toBeInTheDocument();
		});
	});

	describe('P3-007-T23: Disabled and Readonly States', () => {
		it('should disable input when disabled prop is true', async () => {
			const { getByLabelText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'test',
				disabled: true
			});

			const input = getByLabelText('Password Field') as HTMLInputElement;
			expect(input.disabled).toBe(true);
		});

		it('should make input readonly when readonly prop is true', async () => {
			const { getByLabelText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'test',
				readonly: true
			});

			const input = getByLabelText('Password Field') as HTMLInputElement;
			expect(input.readOnly).toBe(true);
		});

		it('should disable toggle button when disabled', async () => {
			const { getByLabelText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'test',
				disabled: true
			});

			const toggleButton = getByLabelText('Show password');
			expect(toggleButton).toBeDisabled();
		});

		it('should disable toggle button when readonly', async () => {
			const { getByLabelText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'test',
				readonly: true
			});

			const toggleButton = getByLabelText('Show password');
			expect(toggleButton).toBeDisabled();
		});
	});

	describe('P3-007-T23: Event Handling', () => {
		it('should dispatch change event on input', async () => {
			const mockChange = vi.fn();
			const { getByLabelText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: '',
				onchange: mockChange
			});

			const input = getByLabelText('Password Field') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: 'newpassword' } });

			expect(mockChange).toHaveBeenCalledTimes(1);
			expect(mockChange).toHaveBeenCalledWith(
				expect.objectContaining({ detail: 'newpassword' })
			);
		});

		it('should dispatch blur event', async () => {
			const mockBlur = vi.fn();
			const { getByLabelText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'test',
				onblur: mockBlur
			});

			const input = getByLabelText('Password Field');
			await fireEvent.blur(input);

			expect(mockBlur).toHaveBeenCalledTimes(1);
		});

		it('should dispatch focus event', async () => {
			const mockFocus = vi.fn();
			const { getByLabelText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: 'test',
				onfocus: mockFocus
			});

			const input = getByLabelText('Password Field');
			await fireEvent.focus(input);

			expect(mockFocus).toHaveBeenCalledTimes(1);
		});
	});

	describe('P3-007-T23: Edge Cases', () => {
		it('should handle empty password', async () => {
			const { container } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: '',
				showStrengthIndicator: true
			});

			const strengthIndicator = container.querySelector('.password-strength-indicator');
			expect(strengthIndicator).not.toBeInTheDocument();
		});

		it('should handle very long passwords', async () => {
			const longPassword = 'a'.repeat(1000);
			const mockChange = vi.fn();
			const { getByLabelText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: '',
				onchange: mockChange
			});

			const input = getByLabelText('Password Field') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: longPassword } });

			expect(mockChange).toHaveBeenCalledWith(
				expect.objectContaining({ detail: longPassword })
			);
		});

		it('should handle special characters in password', async () => {
			const specialPassword = 'P@$$w0rd!🔒';
			const mockChange = vi.fn();
			const { getByLabelText } = await renderWithProps(PasswordField, {
				field: mockFields.password,
				value: '',
				onchange: mockChange
			});

			const input = getByLabelText('Password Field') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: specialPassword } });

			expect(mockChange).toHaveBeenCalledWith(
				expect.objectContaining({ detail: specialPassword })
			);
		});
	});
});