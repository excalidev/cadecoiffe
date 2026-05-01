import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost',
    ...devices['Desktop Chrome'],
  },
  reporter: 'list',
  timeout: 15000,
})
