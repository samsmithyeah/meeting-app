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

      await facilitatorPage.startMeeting()
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
    test('groups answers based on answer count', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'AI Grouping Test',
        questions: [{ text: 'What can we improve?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeeting()
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

      // Original: groups answers when Group with AI button is clicked
      await expect(facilitatorPage.groupAnswersButton).toBeVisible({ timeout: 10000 })
      await facilitatorPage.groupAnswersButton.click()

      // Wait for grouping to complete - should show grouped answers section
      await expect(page.getByText(/Grouped Responses|Ungrouped/i).first()).toBeVisible({
        timeout: 15000
      })

      await Promise.all(contexts.map((ctx) => ctx.close()))

      // Now test with fewer answers
      const createPage2 = new CreateMeetingPage(page)
      await createPage2.goto()

      await createPage2.createMeeting({
        title: 'Few Answers Grouping Test',
        questions: [{ text: 'Quick feedback?' }]
      })

      const facilitatorPage2 = new FacilitatorSessionPage(page)
      const participantCode2 = await facilitatorPage2.getParticipantCode()

      await facilitatorPage2.startMeeting()
      await expect(facilitatorPage2.startQuestionButton).toBeVisible({ timeout: 10000 })

      // Add only 2 participants
      const contexts2 = await Promise.all([browser.newContext(), browser.newContext()])
      const pages2 = await Promise.all(contexts2.map((ctx) => ctx.newPage()))
      const names2 = ['Alice', 'Bob']
      const answers2 = ['Good work', 'Nice effort']

      for (let i = 0; i < pages2.length; i++) {
        const joinPage = new JoinMeetingPage(pages2[i])
        await joinPage.goto()
        await joinPage.joinMeeting(participantCode2, names2[i])
      }

      await facilitatorPage2.waitForParticipants(2)
      await facilitatorPage2.startQuestionButton.click()

      for (let i = 0; i < pages2.length; i++) {
        const session = new ParticipantSessionPage(pages2[i])
        await session.waitForQuestion()
        await session.submitAnswer(answers2[i])
      }

      await facilitatorPage2.waitForAnswers(2, 2)
      await facilitatorPage2.revealAnswersButton.click()

      // Original: shows all answers in single group when fewer than 4 responses
      await expect(facilitatorPage2.groupAnswersButton).toBeVisible({ timeout: 10000 })
      await facilitatorPage2.groupAnswersButton.click()

      // Should show "All Responses" group
      await expect(page.getByText(/All Responses/i)).toBeVisible({ timeout: 10000 })

      await Promise.all(contexts2.map((ctx) => ctx.close()))
    })
  })
})
