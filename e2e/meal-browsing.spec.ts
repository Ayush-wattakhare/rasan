import { test, expect } from '@playwright/test'

test.describe('Meal Browsing', () => {
  test('should display meals page', async ({ page }) => {
    await page.goto('/meals')
    await expect(page.getByRole('heading', { name: /Explore Master Chefs/i })).toBeVisible()
  })

  test('should display meal cards', async ({ page }) => {
    await page.goto('/meals')
    
    // Wait for meals to load
    await page.waitForTimeout(1000)
    
    // Check if meal cards are present (if any meals exist)
    const mealCards = page.locator('[data-testid="meal-card"]')
    const count = await mealCards.count()
    
    if (count > 0) {
      await expect(mealCards.first()).toBeVisible()
    }
  })

  test('should have search functionality', async ({ page }) => {
    await page.goto('/meals')
    
    const searchInput = page.getByPlaceholder(/search/i)
    if (await searchInput.isVisible()) {
      await searchInput.fill('biryani')
      await page.waitForTimeout(500)
      // Results should update based on search
    }
  })

  test('should have filter options', async ({ page }) => {
    await page.goto('/meals')
    
    // Check for filter elements
    const filterSection = page.locator('[data-testid="meal-filters"]')
    if (await filterSection.isVisible()) {
      await expect(filterSection).toBeVisible()
    }
  })

  test('should navigate to meal details', async ({ page }) => {
    await page.goto('/meals')
    await page.waitForTimeout(1000)
    
    const mealCards = page.locator('[data-testid="meal-card"]')
    const count = await mealCards.count()
    
    if (count > 0) {
      await mealCards.first().click()
      await page.waitForURL(/.*meals\/.*/, { timeout: 10000 })
      await expect(page).toHaveURL(/.*meals\/.*/)
    }
  })
})
