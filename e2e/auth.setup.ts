import { test as setup } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const user1AuthFile = path.join(__dirname, '.auth/user1.json')
const user2AuthFile = path.join(__dirname, '.auth/user2.json')

setup('authenticate user1', async ({ page }) => {
  const email = 'user1@example.com'
  const password = process.env.TEST_USER_PASSWORD

  if (!password) {
    throw new Error('TEST_USER_PASSWORD environment variable is required')
  }

  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()

  // Wait for successful login - redirected to home
  await page.waitForURL('/')

  await page.context().storageState({ path: user1AuthFile })
})

setup('authenticate user2', async ({ page }) => {
  const email = 'user2@example.com'
  const password = process.env.TEST_USER_PASSWORD

  if (!password) {
    throw new Error('TEST_USER_PASSWORD environment variable is required')
  }

  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()

  // Wait for successful login - redirected to home
  await page.waitForURL('/')

  await page.context().storageState({ path: user2AuthFile })
})
