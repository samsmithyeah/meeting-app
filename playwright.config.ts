import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env') })

export default defineConfig({
  testDir: './e2e/tests',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'setup',
      testDir: './e2e',
      testMatch: /auth\.setup\.ts/
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup']
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      ...process.env,
      OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || '',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'sk-test-key-for-wiremock'
    }
  }
})
