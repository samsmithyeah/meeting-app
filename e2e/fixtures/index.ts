import { test as base, Page, BrowserContext } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Auth state file paths
export const user1AuthFile = path.join(__dirname, '../.auth/user1.json')
export const user2AuthFile = path.join(__dirname, '../.auth/user2.json')

// Extended test fixture with multiple authenticated contexts
type MultiUserFixtures = {
  user1Context: BrowserContext
  user1Page: Page
  user2Context: BrowserContext
  user2Page: Page
}

export const test = base.extend<MultiUserFixtures>({
  user1Context: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: user1AuthFile })
    await use(context)
    await context.close()
  },
  user1Page: async ({ user1Context }, use) => {
    const page = await user1Context.newPage()
    await use(page)
  },
  user2Context: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: user2AuthFile })
    await use(context)
    await context.close()
  },
  user2Page: async ({ user2Context }, use) => {
    const page = await user2Context.newPage()
    await use(page)
  }
})

export { expect } from '@playwright/test'
