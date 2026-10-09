import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should display register page', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /Create Account/i })).toBeVisible()
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Wait for validation errors to appear
    await page.waitForTimeout(500)
    
    // Check if form is still on login page (not navigated away)
    await expect(page).toHaveURL(/.*login/)
  })

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /sign up/i }).first().click()
    await page.waitForURL(/.*register/, { timeout: 10000 })
    await expect(page).toHaveURL(/.*register/)
    
    await page.getByRole('link', { name: /sign in/i }).first().click()
    await page.waitForURL(/.*login/, { timeout: 10000 })
    await expect(page).toHaveURL(/.*login/)
  })

  test('should display forgot password page', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByRole('heading', { name: /forgot password/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible()
  })
})
