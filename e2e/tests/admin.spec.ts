import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'admin@example.com'
const ADMIN_PASSWORD = 'changeme_admin_password'

async function loginAsAdmin(page: any) {
  await page.goto('/login')
  await page.fill('input[type="email"]', ADMIN_EMAIL)
  await page.fill('input[type="password"]', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/.*admin\/tenants/)
}

test.describe('Admin — Tenants', () => {
  test('affiche la page tenants', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.locator('h1')).toContainText(/tenant/i)
  })

  test('créer un tenant', async ({ page }) => {
    await loginAsAdmin(page)
    await page.click('button:has-text("Nouveau tenant")')
    await page.fill('input[placeholder=""], input:near(label:has-text("Nom"))', 'Salon Test E2E')
    // Trouver champ Nom et compte caisse
    const inputs = page.locator('.modal-content input, form input')
    await inputs.nth(0).fill('Salon Test E2E')
    await inputs.nth(1).fill('1010')
    await page.click('button:has-text("Enregistrer")')
    await expect(page.locator('td:has-text("Salon Test E2E")')).toBeVisible({ timeout: 5000 })
  })

  test('modifier un tenant', async ({ page }) => {
    await loginAsAdmin(page)
    // Cherche la ligne du tenant créé précédemment
    const row = page.locator('tr:has-text("Salon Test E2E")')
    await row.locator('button:has-text("Modifier")').click()
    const inputs = page.locator('.modal-content input, form input')
    await inputs.nth(0).fill('Salon Test E2E Modifié')
    await page.click('button:has-text("Enregistrer")')
    await expect(page.locator('td:has-text("Salon Test E2E Modifié")')).toBeVisible({ timeout: 5000 })
  })

  test('supprimer un tenant', async ({ page }) => {
    await loginAsAdmin(page)
    page.on('dialog', d => d.accept())
    const row = page.locator('tr:has-text("Salon Test E2E Modifié")')
    await row.locator('button:has-text("Supprimer")').click()
    await expect(page.locator('td:has-text("Salon Test E2E Modifié")')).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Admin — Import catalogue', () => {
  test('affiche la page import', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/import')
    await expect(page.locator('h1')).toContainText(/import/i)
    await expect(page.locator('select')).toBeVisible()
    await expect(page.locator('input[type="file"]')).toBeVisible()
  })
})
