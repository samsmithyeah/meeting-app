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
    // Wait for successful navigation to session page
    await this.page.waitForURL(`/session/${code}`)
    // Wait for success or error state
    const result = await Promise.race([
      this.page.getByText("You're in!").waitFor({ timeout: 10000 }).then(() => 'success'),
      this.page.getByText('Waiting for meeting to start...').waitFor({ timeout: 10000 }).then(() => 'success'),
      this.page.getByText('Meeting not found').waitFor({ timeout: 10000 }).then(() => 'not_found')
    ])
    if (result === 'not_found') {
      throw new Error('Failed to join meeting: Meeting not found')
    }
  }
}
