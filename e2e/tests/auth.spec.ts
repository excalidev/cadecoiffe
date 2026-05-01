import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'admin@example.com'
const ADMIN_PASSWORD = 'changeme_admin_password'

test('redirect to login quand non authentifié', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/.*login/)
})

test('login échoue avec mauvais credentials', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'wrong@example.com')
  await page.fill('input[type="password"]', 'wrongpassword')
  await page.click('button[type="submit"]')
  await expect(page.locator('.error, [class*="error"]')).toBeVisible()
})

test('login admin réussi et redirection vers /admin/tenants', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', ADMIN_EMAIL)
  await page.fill('input[type="password"]', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/.*admin\/tenants/, { timeout: 5000 })
})

test('logout redirige vers login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', ADMIN_EMAIL)
  await page.fill('input[type="password"]', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/.*admin\/tenants/)
  await page.click('button:has-text("Déconnexion"), a:has-text("Déconnexion")')
  await expect(page).toHaveURL(/.*login/)
})
