import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import FieldRenderer from '../FieldRenderer.svelte';
import { renderWithProps } from './fixtures/testUtils';
import { createMockField } from './fixtures/mockFields';
import type { DocField } from '../../../../meta/doctype/types';

describe('FieldRenderer', () => {
	let mockField: DocField;
});