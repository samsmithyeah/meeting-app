import { Page, Locator } from '@playwright/test'

export class JoinMeetingPage {
  readonly page: Page
  readonly codeInput: Locator
  readonly nameInput: Locator
  readonly joinButton: Locator
  readonly backToHomeLink: Locator
  readonly errorMessage: Locator
  readonly meetingFoundMessage: Locator
  readonly signInLink: Locator

  constructor(page: Page) {
    this.page = page
    this.codeInput = page.getByLabel('Meeting Code')
    this.nameInput = page.getByLabel('Your Name')
    this.joinButton = page.getByRole('button', { name: 'Join Meeting' })
    this.backToHomeLink = page.getByRole('link', { name: /Back to Home/i })
    this.errorMessage = page.getByRole('alert')
    this.meetingFoundMessage = page.getByRole('status')
    this.signInLink = page.getByRole('link', { name: 'Sign in' })
  }

  async goto(code?: string) {
    if (code) {
      await this.page.goto(`/join/${code}`)
    } else {
      await this.page.goto('/join')
    }
  }

  async joinMeeting(code: string, name: string) {
    await this.codeInput.fill(code)
    await this.nameInput.fill(name)
    await this.joinButton.click()
  }
}
