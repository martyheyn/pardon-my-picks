import { expect, test } from '@playwright/test';
import { TEST_USER } from '../scripts/seed-test-data.js';

test('login page renders the login form', async ({ page }) => {
	await page.goto('/login');
	await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();
	await expect(page.locator('input[name="username"]')).toBeVisible();
	await expect(page.locator('input[name="password"]')).toBeVisible();
});

test('login succeeds with valid credentials', async ({ page }) => {
	await page.goto('/login');
	await page.locator('input[name="username"]').fill(TEST_USER.username);
	await page.locator('input[name="password"]').fill(TEST_USER.password);
	await page.getByRole('button', { name: 'Log In' }).click();

	await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
});

test('login fails with invalid credentials', async ({ page }) => {
	await page.goto('/login');
	await page.locator('input[name="username"]').fill(TEST_USER.username);
	await page.locator('input[name="password"]').fill('wrong-password-123');
	await page.getByRole('button', { name: 'Log In' }).click();

	await expect(page.getByText('Incorrect username or password')).toBeVisible();
});

test('weekly picks page renders grouped picks and tailing shows an alert flash', async ({
	page
}) => {
	await page.goto('/login');
	await page.locator('input[name="username"]').fill(TEST_USER.username);
	await page.locator('input[name="password"]').fill(TEST_USER.password);
	await page.getByRole('button', { name: 'Log In' }).click();
	await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

	// route matches CURRENT_YEAR/CURRENT_WEEK, which the seed script also targets
	await page.goto('/2025/21');
	await expect(page.getByRole('heading', { name: 'PFT' })).toBeVisible();

	const pickCard = page.locator('.card').filter({ hasText: 'Chiefs vs Bills Over 47.5' });
	await expect(pickCard).toBeVisible();

	const textBefore = await pickCard.innerText();
	await pickCard.getByRole('button').first().click();

	// tailing triggers an alert (success, or a business-rule rejection outside the tail window)
	// rendered inside this pick's card, which then clears itself after a few seconds
	await expect(pickCard).not.toHaveText(textBefore, { timeout: 5000 });
	await expect(pickCard).toHaveText(textBefore, { timeout: 8000 });
});
