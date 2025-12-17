import { test, expect } from '../fixtures'
import { Page, Browser } from '@playwright/test'
import {
  CreateMeetingPage,
  FacilitatorSessionPage,
  JoinMeetingPage,
  ParticipantSessionPage
} from '../pages'

test.describe('AI Error Handling', () => {
  test.use({ storageState: 'e2e/.auth/user1.json' })

  // Helper to set up a meeting with revealed answers
  async function setupMeetingWithAnswers(
    page: Page,
    browser: Browser,
    answers: string[]
  ) {
    const createPage = new CreateMeetingPage(page)
    await createPage.goto()

    await createPage.createMeeting({
      title: 'AI Error Test',
      questions: [{ text: 'ERROR_TRIGGER question for testing?' }]
    })

    const facilitatorPage = new FacilitatorSessionPage(page)
    const participantCode = await facilitatorPage.getParticipantCode()

    // Use robust startMeeting helper to ensure state transition completes
    await facilitatorPage.startMeeting()

    // Add participants
    const contexts = await Promise.all(answers.map(() => browser.newContext()))
    const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()))

    // Join and submit answers
    for (let i = 0; i < pages.length; i++) {
      const joinPage = new JoinMeetingPage(pages[i])
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, `User ${i + 1}`)
    }

    await facilitatorPage.waitForParticipants(answers.length)
    await facilitatorPage.startQuestionButton.click()

    // Submit answers one at a time, waiting for each to be received
    for (let i = 0; i < pages.length; i++) {
      const session = new ParticipantSessionPage(pages[i])
      await session.waitForQuestion()
      await session.submitAnswer(answers[i])
      // Wait for this answer to be registered on the facilitator page
      await facilitatorPage.waitForAnswers(i + 1, answers.length)
    }

    return { facilitatorPage, contexts, participantCode }
  }

  test.describe('AI Summary Errors', () => {
    test('handles AI summary errors gracefully', async ({ page, browser }) => {
      // This test requires WireMock to be running with the error mapping
      const answers = ['ERROR_TRIGGER answer 1', 'ERROR_TRIGGER answer 2']
      const { facilitatorPage, contexts } = await setupMeetingWithAnswers(page, browser, answers)

      // Reveal answers - this triggers AI summary generation
      await facilitatorPage.revealAnswersButton.click()

      // Original: shows error notification when AI summary fails
      // Answers should be revealed even if AI fails
      await expect(facilitatorPage.getRevealedAnswer(answers[0])).toBeVisible({ timeout: 10000 })

      // Error notification should appear
      await expect(facilitatorPage.errorNotification).toBeVisible({ timeout: 20000 })

      // Error message should indicate AI summary issue
      await expect(facilitatorPage.errorNotification).toContainText(/summary|AI|error/i)

      // Original: error notification can be dismissed
      await facilitatorPage.dismissError()
      await expect(facilitatorPage.errorNotification).not.toBeVisible()

      // Original: meeting continues normally after AI error
      // End Meeting button should be available
      await expect(facilitatorPage.endMeetingButton).toBeVisible({ timeout: 10000 })

      // End the meeting
      await facilitatorPage.endMeetingButton.click()
      await expect(page).toHaveURL('/')

      await Promise.all(contexts.map((ctx) => ctx.close()))
    })
  })

  test.describe('AI Grouping Errors', () => {
    test('handles AI grouping errors gracefully', async ({ page, browser }) => {
      // Need 4+ answers for AI grouping to be attempted
      const answers = [
        'ERROR_TRIGGER answer 1',
        'ERROR_TRIGGER answer 2',
        'ERROR_TRIGGER answer 3',
        'ERROR_TRIGGER answer 4'
      ]
      const { facilitatorPage, contexts } = await setupMeetingWithAnswers(page, browser, answers)

      // Reveal answers first
      await facilitatorPage.revealAnswersButton.click()

      // Wait for answers to be revealed
      await expect(facilitatorPage.getRevealedAnswer(answers[0])).toBeVisible({ timeout: 10000 })

      // Click Group Answers button
      await expect(facilitatorPage.groupAnswersButton).toBeVisible({ timeout: 10000 })
      await facilitatorPage.groupAnswersButton.click()

      // Original: shows error notification when AI grouping fails
      await expect(facilitatorPage.errorNotification).toBeVisible({ timeout: 20000 })

      // Original: grouping button remains enabled after error
      await facilitatorPage.dismissError()

      // Group Answers button should still be visible and enabled (for retry)
      await expect(facilitatorPage.groupAnswersButton).toBeVisible()
      await expect(facilitatorPage.groupAnswersButton).toBeEnabled()

      await Promise.all(contexts.map((ctx) => ctx.close()))
    })
  })

  test.describe('Error Notification UI', () => {
    test('error notification has proper structure and styling', async ({ page, browser }) => {
      const answers = ['ERROR_TRIGGER answer 1', 'ERROR_TRIGGER answer 2', 'ERROR_TRIGGER answer 3']
      const { facilitatorPage, contexts } = await setupMeetingWithAnswers(page, browser, answers)

      // Reveal answers to trigger error
      await facilitatorPage.revealAnswersButton.click()

      // Wait for error notification
      await expect(facilitatorPage.errorNotification).toBeVisible({ timeout: 20000 })

      // Original: error notification has dismiss button
      const closeButton = facilitatorPage.errorNotification.locator('button')
      await expect(closeButton).toBeVisible()

      // Original: error notification displays correct styling
      await expect(facilitatorPage.errorNotification).toHaveAttribute('role', 'alert')

      await Promise.all(contexts.map((ctx) => ctx.close()))
    })
  })
})
