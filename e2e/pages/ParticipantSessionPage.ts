import { Page, Locator } from '@playwright/test'

export class ParticipantSessionPage {
  readonly page: Page
  readonly meetingTitle: Locator
  readonly participantName: Locator
  readonly waitingForMeetingMessage: Locator
  readonly waitingForQuestionMessage: Locator
  readonly currentQuestionText: Locator
  readonly answerInput: Locator
  readonly submitAnswerButton: Locator
  readonly answeredCountText: Locator
  readonly waitingForFacilitatorMessage: Locator
  readonly timerDisplay: Locator

  constructor(page: Page) {
    this.page = page
    this.meetingTitle = page.getByRole('banner').getByRole('heading', { level: 1 })
    this.participantName = page.getByText(/Joined as/)
    this.waitingForMeetingMessage = page.getByRole('status').filter({ hasText: 'Waiting for meeting to start...' })
    this.waitingForQuestionMessage = page.getByRole('status').filter({ hasText: 'Waiting for the next question...' })
    this.currentQuestionText = page.getByRole('heading', { level: 2 }).first()
    // Match both "Type your answer..." and "Add another answer..."
    this.answerInput = page.getByPlaceholder(/answer/i)
    this.submitAnswerButton = page.getByRole('button', { name: /Submit|Add Answer/i })
    this.answeredCountText = page.getByText(/\d+\/\d+ participants have answered/)
    this.waitingForFacilitatorMessage = page.getByRole('status').filter({ hasText: 'Waiting for facilitator to continue...' })
    this.timerDisplay = page.getByRole('timer')
  }

  async goto(code: string) {
    await this.page.goto(`/session/${code}`)
  }

  async submitAnswer(text: string) {
    await this.answerInput.fill(text)
    await this.submitAnswerButton.click()
  }

  async waitForQuestion() {
    await this.answerInput.waitFor({ state: 'visible', timeout: 30000 })
  }

  async waitForReveal() {
    await this.waitingForFacilitatorMessage.waitFor({ state: 'visible', timeout: 30000 })
  }

  getMyAnswerItem(text: string): Locator {
    return this.page.getByText(text, { exact: true })
  }

  getEditButton(answerIndex: number): Locator {
    return this.page.getByTitle('Edit').nth(answerIndex)
  }

  getDeleteButton(answerIndex: number): Locator {
    return this.page.getByTitle('Delete').nth(answerIndex)
  }

  getRevealedAnswer(text: string): Locator {
    return this.page.getByText(text)
  }
}
