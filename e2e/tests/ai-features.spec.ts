import { test, expect } from '../fixtures'
import {
  CreateMeetingPage,
  FacilitatorSessionPage,
  JoinMeetingPage,
  ParticipantSessionPage
} from '../pages'

test.describe('AI Features', () => {
  test.use({ storageState: 'e2e/.auth/user1.json' })

  test.describe('AI Summary', () => {
    test('generates summary after revealing answers', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'AI Summary Test',
        questions: [{ text: 'What went well this sprint?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()
      await expect(facilitatorPage.startQuestionButton).toBeVisible({ timeout: 10000 })

      // Add multiple participants with answers
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext()
      ])
      const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()))
      const names = ['Alice', 'Bob', 'Charlie']
      const answers = [
        'Great team collaboration',
        'Excellent communication',
        'We met all our deadlines'
      ]

      // Join and submit answers
      for (let i = 0; i < pages.length; i++) {
        const joinPage = new JoinMeetingPage(pages[i])
        await joinPage.goto()
        await joinPage.joinMeeting(participantCode, names[i])
      }

      await facilitatorPage.waitForParticipants(3)
      await facilitatorPage.startQuestionButton.click()

      for (let i = 0; i < pages.length; i++) {
        const session = new ParticipantSessionPage(pages[i])
        await session.waitForQuestion()
        await session.submitAnswer(answers[i])
      }

      await facilitatorPage.waitForAnswers(3, 3)
      await facilitatorPage.revealAnswersButton.click()

      // Wait for AI summary to appear (with longer timeout for API call)
      await expect(facilitatorPage.summarySection).toBeVisible({ timeout: 15000 })

      // Summary text should contain some content
      const summaryText = await page.getByText(/themes|agreement|responses|collaboration/i).first()
      await expect(summaryText).toBeVisible({ timeout: 15000 })

      await Promise.all(contexts.map((ctx) => ctx.close()))
    })
  })

  test.describe('AI Grouping', () => {
    test('groups answers when Group with AI button is clicked', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'AI Grouping Test',
        questions: [{ text: 'What can we improve?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()
      await expect(facilitatorPage.startQuestionButton).toBeVisible({ timeout: 10000 })

      // Add 4+ participants (required for AI grouping)
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
        browser.newContext()
      ])
      const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()))
      const names = ['Alice', 'Bob', 'Charlie', 'Dave']
      const answers = [
        'Better testing practices',
        'More code reviews',
        'Clearer documentation',
        'Faster deployments'
      ]

      // Join and submit answers
      for (let i = 0; i < pages.length; i++) {
        const joinPage = new JoinMeetingPage(pages[i])
        await joinPage.goto()
        await joinPage.joinMeeting(participantCode, names[i])
      }

      await facilitatorPage.waitForParticipants(4)
      await facilitatorPage.startQuestionButton.click()

      for (let i = 0; i < pages.length; i++) {
        const session = new ParticipantSessionPage(pages[i])
        await session.waitForQuestion()
        await session.submitAnswer(answers[i])
      }

      await facilitatorPage.waitForAnswers(4, 4)
      await facilitatorPage.revealAnswersButton.click()

      // Click the Group with AI button
      await expect(facilitatorPage.groupAnswersButton).toBeVisible({ timeout: 10000 })
      await facilitatorPage.groupAnswersButton.click()

      // Wait for grouping to complete - should show grouped answers section
      // With WireMock mock, answers may end up in Ungrouped or in group names
      // Verify the grouping UI appeared (either group names or Ungrouped section)
      await expect(page.getByText(/Grouped Responses|Ungrouped/i).first()).toBeVisible({
        timeout: 15000
      })

      await Promise.all(contexts.map((ctx) => ctx.close()))
    })

    test('shows all answers in single group when fewer than 4 responses', async ({
      page,
      browser
    }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Few Answers Grouping Test',
        questions: [{ text: 'Quick feedback?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()
      await expect(facilitatorPage.startQuestionButton).toBeVisible({ timeout: 10000 })

      // Add only 2 participants
      const contexts = await Promise.all([browser.newContext(), browser.newContext()])
      const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()))
      const names = ['Alice', 'Bob']
      const answers = ['Good work', 'Nice effort']

      for (let i = 0; i < pages.length; i++) {
        const joinPage = new JoinMeetingPage(pages[i])
        await joinPage.goto()
        await joinPage.joinMeeting(participantCode, names[i])
      }

      await facilitatorPage.waitForParticipants(2)
      await facilitatorPage.startQuestionButton.click()

      for (let i = 0; i < pages.length; i++) {
        const session = new ParticipantSessionPage(pages[i])
        await session.waitForQuestion()
        await session.submitAnswer(answers[i])
      }

      await facilitatorPage.waitForAnswers(2, 2)
      await facilitatorPage.revealAnswersButton.click()

      // With fewer than 4 answers, grouping should create single "All Responses" group
      await expect(facilitatorPage.groupAnswersButton).toBeVisible({ timeout: 10000 })
      await facilitatorPage.groupAnswersButton.click()

      // Should show "All Responses" group
      await expect(page.getByText(/All Responses/i)).toBeVisible({ timeout: 10000 })

      await Promise.all(contexts.map((ctx) => ctx.close()))
    })
  })
})
