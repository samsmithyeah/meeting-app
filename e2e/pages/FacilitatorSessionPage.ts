import { Page, Locator } from '@playwright/test'

export class FacilitatorSessionPage {
  readonly page: Page
  readonly meetingTitle: Locator
  readonly participantCount: Locator
  readonly shareButton: Locator
  readonly startMeetingButton: Locator
  readonly startQuestionButton: Locator
  readonly revealAnswersButton: Locator
  readonly nextQuestionButton: Locator
  readonly endMeetingButton: Locator
  readonly groupAnswersButton: Locator
  readonly qrCode: Locator
  readonly copyJoinLinkButton: Locator
  readonly questionProgress: Locator
  readonly currentQuestionText: Locator
  readonly answersReceivedSection: Locator
  readonly errorNotification: Locator
  readonly summarySection: Locator

  constructor(page: Page) {
    this.page = page
    this.meetingTitle = page.getByRole('banner').getByRole('heading', { level: 1 })
    // The count and "participants" text are in separate spans inside a div
    this.participantCount = page.getByRole('banner').locator('div').filter({ hasText: /participants/ }).first()
    this.shareButton = page.getByRole('button', { name: /Share:/ })
    this.startMeetingButton = page.getByRole('button', { name: 'Start Meeting' })
    this.startQuestionButton = page.getByRole('button', { name: 'Start Question' })
    this.revealAnswersButton = page.getByRole('button', { name: /Reveal Answers/ })
    this.nextQuestionButton = page.getByRole('button', { name: 'Next Question' })
    this.endMeetingButton = page.getByRole('button', { name: 'End Meeting' })
    this.groupAnswersButton = page.getByRole('button', { name: /Group Answers/i })
    this.qrCode = page.locator('svg').filter({ has: page.locator('title') }).first()
    this.copyJoinLinkButton = page.getByRole('button', { name: 'Copy Join Link' })
    this.questionProgress = page.getByText(/Question \d+ of \d+/)
    this.currentQuestionText = page.getByRole('heading', { level: 2 }).first()
    this.answersReceivedSection = page.getByRole('heading', { name: /Answers Received/ })
    this.errorNotification = page.getByRole('alert')
    this.summarySection = page.getByRole('region', { name: 'AI Summary' })
  }

  async goto(code: string) {
    await this.page.goto(`/facilitate/${code}`)
  }

  async getParticipantCode(): Promise<string> {
    const shareText = await this.shareButton.textContent()
    const match = shareText?.match(/Share:\s*(\w+)/)
    return match ? match[1] : ''
  }

  async waitForParticipants(count: number) {
    await this.page.waitForFunction(
      (expectedCount) => {
        const text = document.body.innerText
        const match = text.match(/(\d+)\s*participants?/)
        return match && parseInt(match[1]) >= expectedCount
      },
      count,
      { timeout: 30000 }
    )
  }

  async waitForAnswers(count: number, total: number) {
    await this.page.waitForFunction(
      ({ count, total }) => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const revealBtn = buttons.find((b) => b.textContent?.includes('Reveal Answers'))
        return revealBtn?.textContent?.includes(`${count}/${total}`)
      },
      { count, total },
      { timeout: 30000 }
    )
  }

  getAnswerCard(index: number): Locator {
    return this.page.getByRole('article').nth(index)
  }

  getRevealedAnswer(text: string): Locator {
    // Use exact match to avoid matching answer text in other elements like Share button codes
    return this.page.getByText(text, { exact: true })
  }
}
