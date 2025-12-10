import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import RatingField from '../RatingField.svelte';
import { renderWithProps, createMockEvent, createMockKeyboardEvent } from './fixtures/testUtils';
import { mockFields } from './fixtures/mockFields';

describe('RatingField', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('P3-007-T25: Rating Field Basic Functionality', () => {
		it('should render rating field with label', async () => {
			const { getByText, getByLabelText } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3'
			});

			expect(getByText(mockFields.rating.label)).toBeInTheDocument();
			expect(getByLabelText('Rating, current value 3 of 5')).toBeInTheDocument();
		});

		it('should render correct number of stars', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				maxRating: 5
			});

			const stars = container.querySelectorAll('.star-button, .star-half');
			expect(stars.length).toBe(5);
		});

		it('should handle rating changes', async () => {
			const mockChange = vi.fn();
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				onchange: mockChange
			});

			const starButton = container.querySelectorAll('.star-button')[2]; // 3rd star
			await fireEvent.click(starButton);

			expect(mockChange).toHaveBeenCalledWith(
				expect.objectContaining({ detail: 3 })
			);
		});

		it('should display error message when error is provided', async () => {
			const { getByText } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				error: 'Rating is required'
			});

			expect(getByText('Rating is required')).toBeInTheDocument();
		});
	});

	describe('P3-007-T25: Star Interaction', () => {
		it('should fill stars based on rating value', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3'
			});

			const filledStars = container.querySelectorAll('.star-filled');
			expect(filledStars.length).toBe(3);
		});

		it('should show hover effect when hovering over stars', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '2'
			});

			const starButton = container.querySelectorAll('.star-button')[3]; // 4th star
			await fireEvent.mouseEnter(starButton);

			const hoveredStars = container.querySelectorAll('.star-filled');
			expect(hoveredStars.length).toBe(4);
		});

		it('should remove hover effect when mouse leaves', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '2'
			});

			const starButton = container.querySelectorAll('.star-button')[3]; // 4th star
			await fireEvent.mouseEnter(starButton);
			await fireEvent.mouseLeave(container.querySelector('.rating-stars')!);

			const filledStars = container.querySelectorAll('.star-filled');
			expect(filledStars.length).toBe(2); // Back to original value
		});

		it('should update rating when star is clicked', async () => {
			const mockChange = vi.fn();
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '2',
				onchange: mockChange
			});

			const starButton = container.querySelectorAll('.star-button')[4]; // 5th star
			await fireEvent.click(starButton);

			expect(mockChange).toHaveBeenCalledWith(
				expect.objectContaining({ detail: 5 })
			);
		});
	});

	describe('P3-007-T25: Half Star Support', () => {
		it('should show half stars when enabled', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3.5',
				allowHalfStars: true
			});

			const halfStars = container.querySelectorAll('.star-half');
			expect(halfStars.length).toBeGreaterThan(0);
		});

		it('should handle half star clicks', async () => {
			const mockChange = vi.fn();
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				allowHalfStars: true,
				onchange: mockChange
			});

			const halfStar = container.querySelector('.star-left');
			await fireEvent.click(halfStar!);

			expect(mockChange).toHaveBeenCalledWith(
				expect.objectContaining({ detail: 3.5 })
			);
		});

		it('should not show half stars when disabled', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3.5',
				allowHalfStars: false
			});

			const halfStars = container.querySelectorAll('.star-half');
			expect(halfStars.length).toBe(0);
		});
	});

	describe('P3-007-T25: Rating Display', () => {
		it('should show numeric rating when enabled', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				showValue: true
			});

			const ratingNumber = container.querySelector('.rating-number');
			expect(ratingNumber?.textContent).toBe('3');
		});

		it('should show max rating', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				maxRating: 7,
				showValue: true
			});

			const ratingMax = container.querySelector('.rating-max');
			expect(ratingMax?.textContent).toBe('/ 7');
		});

		it('should show rating text for 5-star scale', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '4',
				maxRating: 5,
				showValue: true
			});

			const ratingText = container.querySelector('.rating-text');
			expect(ratingText?.textContent).toBe('(Very Good)');
		});

		it('should show percentage bar when value is set', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				maxRating: 5
			});

			const percentageFill = container.querySelector('.percentage-fill');
			expect(percentageFill).toHaveStyle('width: 60%');
		});

		it('should not show percentage bar when value is 0', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '0',
				maxRating: 5
			});

			const percentageBar = container.querySelector('.rating-percentage');
			expect(percentageBar).not.toBeInTheDocument();
		});
	});

	describe('P3-007-T25: Size Variations', () => {
		it('should render small stars when size is small', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				size: 'small'
			});

			const stars = container.querySelectorAll('.rating-stars');
			expect(stars[0]).toHaveClass('small');
		});

		it('should render large stars when size is large', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				size: 'large'
			});

			const stars = container.querySelectorAll('.rating-stars');
			expect(stars[0]).toHaveClass('large');
		});

		it('should render medium stars by default', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3'
			});

			const stars = container.querySelectorAll('.rating-stars');
			expect(stars[0]).not.toHaveClass('small');
			expect(stars[0]).not.toHaveClass('large');
		});
	});

	describe('P3-007-T25: Keyboard Navigation', () => {
		it('should increase rating with arrow keys', async () => {
			const mockChange = vi.fn();
			const { getByLabelText } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				onchange: mockChange
			});

			const ratingContainer = getByLabelText('Rating, current value 3 of 5');
			await fireEvent.keyDown(ratingContainer, { key: 'ArrowRight' });

			expect(mockChange).toHaveBeenCalledWith(
				expect.objectContaining({ detail: 4 })
			);
		});

		it('should decrease rating with arrow keys', async () => {
			const mockChange = vi.fn();
			const { getByLabelText } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				onchange: mockChange
			});

			const ratingContainer = getByLabelText('Rating, current value 3 of 5');
			await fireEvent.keyDown(ratingContainer, { key: 'ArrowLeft' });

			expect(mockChange).toHaveBeenCalledWith(
				expect.objectContaining({ detail: 2 })
			);
		});

		it('should set minimum rating with Home key', async () => {
			const mockChange = vi.fn();
			const { getByLabelText } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				onchange: mockChange
			});

			const ratingContainer = getByLabelText('Rating, current value 3 of 5');
			await fireEvent.keyDown(ratingContainer, { key: 'Home' });

			expect(mockChange).toHaveBeenCalledWith(
				expect.objectContaining({ detail: 0 })
			);
		});

		it('should set maximum rating with End key', async () => {
			const mockChange = vi.fn();
			const { getByLabelText } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				maxRating: 5,
				onchange: mockChange
			});

			const ratingContainer = getByLabelText('Rating, current value 3 of 5');
			await fireEvent.keyDown(ratingContainer, { key: 'End' });

			expect(mockChange).toHaveBeenCalledWith(
				expect.objectContaining({ detail: 5 })
			);
		});

		it('should set rating with number keys', async () => {
			const mockChange = vi.fn();
			const { getByLabelText } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				onchange: mockChange
			});

			const ratingContainer = getByLabelText('Rating, current value 3 of 5');
			await fireEvent.keyDown(ratingContainer, { key: '4' });

			expect(mockChange).toHaveBeenCalledWith(
				expect.objectContaining({ detail: 4 })
			);
		});
	});

	describe('P3-007-T25: Accessibility', () => {
		it('should have proper ARIA attributes', async () => {
			const { getByLabelText } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				maxRating: 5
			});

			const ratingContainer = getByLabelText('Rating, current value 3 of 5');
			expect(ratingContainer).toHaveAttribute('role', 'slider');
			expect(ratingContainer).toHaveAttribute('aria-valuemin', '0');
			expect(ratingContainer).toHaveAttribute('aria-valuemax', '5');
			expect(ratingContainer).toHaveAttribute('aria-valuenow', '3');
		});

		it('should have accessible star labels', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3'
			});

			const stars = container.querySelectorAll('.star-button, .star-half');
			expect(stars[0]).toHaveAttribute('aria-label', 'Rate 1 star');
			expect(stars[1]).toHaveAttribute('aria-label', 'Rate 2 stars');
			expect(stars[2]).toHaveAttribute('aria-label', 'Rate 3 stars');
		});

		it('should be keyboard focusable', async () => {
			const { getByLabelText } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3'
			});

			const ratingContainer = getByLabelText('Rating, current value 3 of 5');
			expect(ratingContainer).toHaveAttribute('tabindex', '0');
		});
	});

	describe('P3-007-T25: Disabled and Readonly States', () => {
		it('should disable interaction when disabled', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				disabled: true
			});

			const stars = container.querySelectorAll('.star-button, .star-half');
			stars.forEach(star => {
				expect(star).toBeDisabled();
			});

			const ratingContainer = container.querySelector('.rating-stars');
			expect(ratingContainer).toHaveAttribute('aria-disabled', 'true');
		});

		it('should disable interaction when readonly', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				readonly: true
			});

			const stars = container.querySelectorAll('.star-button, .star-half');
			stars.forEach(star => {
				expect(star).toBeDisabled();
			});

			const ratingContainer = container.querySelector('.rating-stars');
			expect(ratingContainer).toHaveAttribute('aria-readonly', 'true');
		});

		it('should not respond to clicks when disabled', async () => {
			const mockChange = vi.fn();
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				disabled: true,
				onchange: mockChange
			});

			const starButton = container.querySelectorAll('.star-button')[4]; // 5th star
			await fireEvent.click(starButton);

			expect(mockChange).not.toHaveBeenCalled();
		});
	});

	describe('P3-007-T25: Event Handling', () => {
		it('should dispatch change event on star click', async () => {
			const mockChange = vi.fn();
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '2',
				onchange: mockChange
			});

			const starButton = container.querySelectorAll('.star-button')[3]; // 4th star
			await fireEvent.click(starButton);

			expect(mockChange).toHaveBeenCalledTimes(1);
			expect(mockChange).toHaveBeenCalledWith(
				expect.objectContaining({ detail: 4 })
			);
		});

		it('should dispatch blur event', async () => {
			const mockBlur = vi.fn();
			const { getByLabelText } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				onblur: mockBlur
			});

			const ratingContainer = getByLabelText('Rating, current value 3 of 5');
			await fireEvent.blur(ratingContainer);

			expect(mockBlur).toHaveBeenCalledTimes(1);
		});

		it('should dispatch focus event', async () => {
			const mockFocus = vi.fn();
			const { getByLabelText } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3',
				onfocus: mockFocus
			});

			const ratingContainer = getByLabelText('Rating, current value 3 of 5');
			await fireEvent.focus(ratingContainer);

			expect(mockFocus).toHaveBeenCalledTimes(1);
		});
	});

	describe('P3-007-T25: Edge Cases', () => {
		it('should handle zero rating', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '0'
			});

			const filledStars = container.querySelectorAll('.star-filled');
			expect(filledStars.length).toBe(0);
		});

		it('should handle maximum rating', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '5',
				maxRating: 5
			});

			const filledStars = container.querySelectorAll('.star-filled');
			expect(filledStars.length).toBe(5);
		});

		it('should handle custom max rating', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '7',
				maxRating: 10
			});

			const stars = container.querySelectorAll('.star-button, .star-half');
			expect(stars.length).toBe(10);

			const filledStars = container.querySelectorAll('.star-filled');
			expect(filledStars.length).toBe(7);
		});

		it('should clamp rating to maximum', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '10',
				maxRating: 5
			});

			const filledStars = container.querySelectorAll('.star-filled');
			expect(filledStars.length).toBe(5); // Should not exceed max
		});

		it('should handle decimal ratings without half stars', async () => {
			const { container } = await renderWithProps(RatingField, {
				field: mockFields.rating,
				value: '3.7',
				allowHalfStars: false
			});

			const filledStars = container.querySelectorAll('.star-filled');
			expect(filledStars.length).toBe(4); // Should round up
		});
	});
});