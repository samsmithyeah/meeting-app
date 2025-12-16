import { test, expect } from '../fixtures'
import { CreateMeetingPage, FacilitatorSessionPage } from '../pages'

test.describe('Meeting Creation', () => {
  test.use({ storageState: 'e2e/.auth/user1.json' })

  test('displays create meeting form', async ({ page }) => {
    const createPage = new CreateMeetingPage(page)
    await createPage.goto()

    await expect(page.getByRole('heading', { name: 'Create a Meeting' })).toBeVisible()
    await expect(createPage.titleInput).toBeVisible()
    await expect(createPage.showNamesCheckbox).toBeVisible()
    await expect(createPage.showNamesCheckbox).toBeChecked()
    await expect(createPage.getQuestionInput(0)).toBeVisible()
    await expect(createPage.createMeetingButton).toBeVisible()
  })

  test('shows error when title is empty', async ({ page }) => {
    const createPage = new CreateMeetingPage(page)
    await createPage.goto()

    await createPage.getQuestionInput(0).fill('Test question?')
    await createPage.createMeetingButton.click()

    await expect(createPage.errorMessage).toContainText('meeting title')
  })

  test('shows error when no questions provided', async ({ page }) => {
    const createPage = new CreateMeetingPage(page)
    await createPage.goto()

    await createPage.titleInput.fill('Test Meeting')
    await createPage.createMeetingButton.click()

    await expect(createPage.errorMessage).toContainText('at least one question')
  })

  test('can add multiple questions', async ({ page }) => {
    const createPage = new CreateMeetingPage(page)
    await createPage.goto()

    await createPage.addQuestionButton.click()
    await createPage.addQuestionButton.click()

    await expect(createPage.getQuestionInput(0)).toBeVisible()
    await expect(createPage.getQuestionInput(1)).toBeVisible()
    await expect(createPage.getQuestionInput(2)).toBeVisible()
  })

  test('can remove questions', async ({ page }) => {
    const createPage = new CreateMeetingPage(page)
    await createPage.goto()

    await createPage.addQuestionButton.click()
    await expect(createPage.getQuestionInput(1)).toBeVisible()

    await createPage.getRemoveButton(1).click()
    await expect(createPage.getQuestionInput(1)).not.toBeVisible()
  })

  test('cannot remove the last question', async ({ page }) => {
    const createPage = new CreateMeetingPage(page)
    await createPage.goto()

    // Should only have one question, no remove button visible
    await expect(page.getByRole('button', { name: 'Remove' })).not.toBeVisible()
  })

  test('can set question options', async ({ page }) => {
    const createPage = new CreateMeetingPage(page)
    await createPage.goto()

    await createPage.getAllowMultipleCheckbox(0).check()
    await expect(createPage.getAllowMultipleCheckbox(0)).toBeChecked()

    await createPage.getTimeLimitSelect(0).selectOption('60')
    await expect(createPage.getTimeLimitSelect(0)).toHaveValue('60')
  })

  test('can uncheck show participant names', async ({ page }) => {
    const createPage = new CreateMeetingPage(page)
    await createPage.goto()

    await createPage.showNamesCheckbox.uncheck()
    await expect(createPage.showNamesCheckbox).not.toBeChecked()
  })

  test('creates meeting and redirects to facilitator session', async ({ page }) => {
    const createPage = new CreateMeetingPage(page)
    await createPage.goto()

    await createPage.createMeeting({
      title: 'E2E Test Meeting',
      questions: [{ text: 'What is your favorite color?' }]
    })

    await expect(page).toHaveURL(/\/facilitate\/[A-Z0-9]{6}/)

    const facilitatorPage = new FacilitatorSessionPage(page)
    await expect(facilitatorPage.meetingTitle).toContainText('E2E Test Meeting')
  })

  test('creates meeting with multiple questions and options', async ({ page }) => {
    const createPage = new CreateMeetingPage(page)
    await createPage.goto()

    await createPage.createMeeting({
      title: 'Multi-Question Meeting',
      questions: [
        { text: 'Question 1', allowMultiple: true, timeLimit: '30' },
        { text: 'Question 2', timeLimit: '60' },
        { text: 'Question 3', allowMultiple: true }
      ],
      showNames: false
    })

    await expect(page).toHaveURL(/\/facilitate\/[A-Z0-9]{6}/)
  })

  test('navigates back to home', async ({ page }) => {
    const createPage = new CreateMeetingPage(page)
    await createPage.goto()

    await createPage.backToHomeLink.click()
    await expect(page).toHaveURL('/')
  })
})
