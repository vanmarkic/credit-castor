import { test as base } from '@playwright/test';

/**
 * Custom fixture - currently just re-exports test and expect
 * Password gate is handled directly in tests by typing the password
 * 
 * Usage: Import { test, expect } from './fixtures' instead of '@playwright/test'
 */
export const test = base;

export { expect } from '@playwright/test';

