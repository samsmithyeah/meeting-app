import { Page, Locator } from '@playwright/test'

export class CreateMeetingPage {
  readonly page: Page
  readonly titleInput: Locator
  readonly showNamesCheckbox: Locator
  readonly createMeetingButton: Locator
  readonly addQuestionButton: Locator
  readonly backToHomeLink: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.titleInput = page.getByLabel('Meeting Title')
    this.showNamesCheckbox = page.getByLabel('Show participant names with answers')
    this.createMeetingButton = page.getByRole('button', { name: 'Create Meeting' })
    this.addQuestionButton = page.getByRole('button', { name: '+ Add Question' })
    this.backToHomeLink = page.getByRole('link', { name: /Back to Home/i })
    this.errorMessage = page.getByRole('alert')
  }

  async goto() {
    await this.page.goto('/create')
  }

  getQuestionInput(index: number): Locator {
    return this.page.getByPlaceholder('Enter your question').nth(index)
  }

  getAllowMultipleCheckbox(index: number): Locator {
    return this.page.getByLabel('Allow multiple answers').nth(index)
  }

  getTimeLimitSelect(index: number): Locator {
    return this.page.getByRole('combobox').nth(index)
  }

  getRemoveButton(index: number): Locator {
    return this.page.getByRole('button', { name: 'Remove' }).nth(index)
  }

  async createMeeting(options: {
    title: string
    questions: Array<{
      text: string
      allowMultiple?: boolean
      timeLimit?: string
    }>
    showNames?: boolean
  }) {
    await this.titleInput.fill(options.title)

    if (options.showNames === false) {
      await this.showNamesCheckbox.uncheck()
    }

    for (let i = 0; i < options.questions.length; i++) {
      const q = options.questions[i]
      if (i > 0) {
        await this.addQuestionButton.click()
      }
      await this.getQuestionInput(i).fill(q.text)
      if (q.allowMultiple) {
        await this.getAllowMultipleCheckbox(i).check()
      }
      if (q.timeLimit) {
        await this.getTimeLimitSelect(i).selectOption(q.timeLimit)
      }
    }

    await this.createMeetingButton.click()
    // Wait for navigation to facilitator session page and ensure page is fully loaded
    await this.page.waitForURL(/\/facilitate\//)
    await this.page.waitForLoadState('networkidle')
  }
}
