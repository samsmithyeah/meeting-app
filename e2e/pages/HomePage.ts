import { Page, Locator } from '@playwright/test'

export class HomePage {
  readonly page: Page
  readonly title: Locator
  readonly createMeetingLink: Locator
  readonly joinMeetingLink: Locator
  readonly authButton: Locator
  readonly signInRequiredText: Locator

  constructor(page: Page) {
    this.page = page
    this.title = page.getByRole('heading', { name: 'Meeting Facilitator' })
    this.createMeetingLink = page.getByRole('link', { name: 'Create a Meeting' })
    this.joinMeetingLink = page.getByRole('link', { name: 'Join a Meeting' })
    this.authButton = page.getByRole('button', { name: /sign|account/i })
    this.signInRequiredText = page.getByText('Requires sign in')
  }

  async goto() {
    await this.page.goto('/')
  }
}
