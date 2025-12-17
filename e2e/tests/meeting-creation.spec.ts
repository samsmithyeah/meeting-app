import { test, expect } from '../fixtures'
import { CreateMeetingPage, FacilitatorSessionPage } from '../pages'

test.describe('Meeting Creation', () => {
  test.use({ storageState: 'e2e/.auth/user1.json' })

  test('displays form and validates required fields', async ({ page }) => {
    const createPage = new CreateMeetingPage(page)
    await createPage.goto()

    // Original: displays create meeting form
    await expect(page.getByRole('heading', { name: 'Create a Meeting' })).toBeVisible()
    await expect(createPage.titleInput).toBeVisible()
    await expect(createPage.showNamesCheckbox).toBeVisible()
    await expect(createPage.showNamesCheckbox).toBeChecked()
    await expect(createPage.getQuestionInput(0)).toBeVisible()
    await expect(createPage.createMeetingButton).toBeVisible()

    // Original: shows error when title is empty
    await createPage.getQuestionInput(0).fill('Test question?')
    await createPage.createMeetingButton.click()
    await expect(createPage.errorMessage).toContainText('meeting title')

    // Clear and test question validation
    await createPage.titleInput.fill('Test Meeting')
    await createPage.getQuestionInput(0).fill('')

    // Original: shows error when no questions provided
    await createPage.createMeetingButton.click()
    await expect(createPage.errorMessage).toContainText('at least one question')
  })

  test('manages questions - add and remove', async ({ page }) => {
    const createPage = new CreateMeetingPage(page)
    await createPage.goto()

    // Original: can add multiple questions
    await createPage.addQuestionButton.click()
    await createPage.addQuestionButton.click()
    await expect(createPage.getQuestionInput(0)).toBeVisible()
    await expect(createPage.getQuestionInput(1)).toBeVisible()
    await expect(createPage.getQuestionInput(2)).toBeVisible()

    // Original: can remove questions
    await createPage.getRemoveButton(2).click()
    await expect(createPage.getQuestionInput(2)).not.toBeVisible()
    await expect(createPage.getQuestionInput(1)).toBeVisible()

    // Remove another question
    await createPage.getRemoveButton(1).click()
    await expect(createPage.getQuestionInput(1)).not.toBeVisible()

    // Original: cannot remove the last question
    await expect(page.getByRole('button', { name: 'Remove' })).not.toBeVisible()
  })

  test('configures question and meeting options', async ({ page }) => {
    const createPage = new CreateMeetingPage(page)
    await createPage.goto()

    // Original: can set question options
    await createPage.getAllowMultipleCheckbox(0).check()
    await expect(createPage.getAllowMultipleCheckbox(0)).toBeChecked()
    await createPage.getTimeLimitSelect(0).selectOption('60')
    await expect(createPage.getTimeLimitSelect(0)).toHaveValue('60')

    // Original: can uncheck show participant names
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
