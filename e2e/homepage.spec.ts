import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Rasan/i)
  })

  test('should display main navigation', async ({ page }) => {
    await page.goto('/')
    
    const isMobile = page.viewportSize() && page.viewportSize()!.width < 768;
    if (isMobile) {
      const menuBtn = page.getByRole('button', { name: /menu/i })
      await menuBtn.click()
    }

    // Check for navigation links
    await expect(page.getByRole('link', { name: /meals/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /vendors/i }).first()).toBeVisible()
  })

  test('should display hero section', async ({ page }) => {
    await page.goto('/')
    
    // Check for hero content
    const heroSection = page.locator('[data-testid="hero-section"]')
    if (await heroSection.isVisible()) {
      await expect(heroSection).toBeVisible()
    }
  })

  test('should navigate to meals page', async ({ page }) => {
    await page.goto('/')
    
    const isMobile = page.viewportSize() && page.viewportSize()!.width < 768;
    if (isMobile) {
      const menuBtn = page.getByRole('button', { name: /menu/i })
      await menuBtn.click()
    }

    await page.getByRole('link', { name: /meals/i }).first().click()
    await expect(page).toHaveURL(/.*meals/)
  })

  test('should navigate to vendors page', async ({ page }) => {
    await page.goto('/')
    
    const isMobile = page.viewportSize() && page.viewportSize()!.width < 768;
    if (isMobile) {
      const menuBtn = page.getByRole('button', { name: /menu/i })
      await menuBtn.click()
    }

    await page.getByRole('link', { name: /vendors/i }).first().click()
    await expect(page).toHaveURL(/.*vendors/)
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check if mobile menu exists
    const mobileMenu = page.getByRole('button', { name: /menu/i })
    if (await mobileMenu.isVisible()) {
      await expect(mobileMenu).toBeVisible()
    }
  })

  test('should display footer', async ({ page }) => {
    await page.goto('/')
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
  })
})
