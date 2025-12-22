import { test, expect } from '../fixtures'
import {
  CreateMeetingPage,
  FacilitatorSessionPage,
  JoinMeetingPage,
  ParticipantSessionPage
} from '../pages'

test.describe('Timer Functionality', () => {
  test.use({ storageState: 'e2e/.auth/user1.json' })

  test.describe('Timer Display', () => {
    test('timer displays correctly when question has time limit', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      // Create meeting with 10-second time limit (dev mode only)
      await createPage.createMeeting({
        title: 'Timer Display Test',
        questions: [{ text: 'Ten second question?', timeLimit: '10' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeeting()

      // Add a participant
      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Timer Tester')

      await facilitatorPage.waitForParticipants(1)

      // Start the question
      await expect(facilitatorPage.startQuestionButton).toBeVisible({ timeout: 15000 })
      await facilitatorPage.startQuestionButton.click()

      // Original: timer is displayed when question has time limit
      await expect(facilitatorPage.timerDisplay).toBeVisible({ timeout: 5000 })

      const participantSession = new ParticipantSessionPage(participantPage)
      await expect(participantSession.timerDisplay).toBeVisible({ timeout: 5000 })

      // Original: timer shows correct initial time
      const timerText = await facilitatorPage.timerDisplay.textContent()
      expect(timerText).toMatch(/0:\d{2}/)

      // Original: timer counts down
      const parseTime = (text: string | null) => {
        if (!text) return 0
        const match = text.match(/(\d+):(\d{2})/)
        if (!match) return 0
        return parseInt(match[1]) * 60 + parseInt(match[2])
      }

      const initialSeconds = parseTime(timerText)

      await expect
        .poll(async () => {
          const currentText = await facilitatorPage.timerDisplay.textContent()
          return parseTime(currentText)
        })
        .toBeLessThan(initialSeconds)

      await participantContext.close()
    })

    test('no timer is shown when question has no time limit', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      // Create meeting without time limit
      await createPage.createMeeting({
        title: 'No Timer Test',
        questions: [{ text: 'Unlimited question?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeeting()

      // Add a participant
      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'No Timer User')

      await facilitatorPage.waitForParticipants(1)

      // Start the question
      await expect(facilitatorPage.startQuestionButton).toBeVisible({ timeout: 15000 })
      await facilitatorPage.startQuestionButton.click()

      // Wait for the question to be active (reveal button appears)
      await expect(facilitatorPage.revealAnswersButton).toBeVisible({ timeout: 5000 })

      // Timer should NOT be visible (no time limit set)
      await expect(facilitatorPage.timerDisplay).not.toBeVisible()

      await participantContext.close()
    })
  })

  test.describe('Timer Expiration', () => {
    test('timer expiration behavior and early reveal', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      // Create meeting with 10-second time limit (dev mode only) for warning test
      await createPage.createMeeting({
        title: 'Timer Warning Test',
        questions: [{ text: 'Watch the timer turn red?', timeLimit: '10' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeeting()

      // Add a participant
      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Timer Watcher')

      await facilitatorPage.waitForParticipants(1)

      // Start the question
      await expect(facilitatorPage.startQuestionButton).toBeVisible({ timeout: 15000 })
      await facilitatorPage.startQuestionButton.click()

      // Original: timer turns red when below 10 seconds
      await expect(facilitatorPage.timerDisplay).toBeVisible({ timeout: 5000 })
      await expect(facilitatorPage.timerDisplay).toHaveClass(/text-red-600/)

      // Original: facilitator can reveal answers before timer expires
      const participantSession = new ParticipantSessionPage(participantPage)
      await participantSession.waitForQuestion()
      await participantSession.submitAnswer('Fast answer')

      await facilitatorPage.waitForAnswers(1, 1)
      await facilitatorPage.revealAnswersButton.click()

      // Answers should be revealed
      await expect(facilitatorPage.getRevealedAnswer('Fast answer')).toBeVisible()

      // Timer should no longer be visible after reveal
      await expect(facilitatorPage.timerDisplay).not.toBeVisible()

      await participantContext.close()
    })

    test('participant can still submit answer after timer expires', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      // Create meeting with 5-second time limit (dev mode only)
      await createPage.createMeeting({
        title: 'Timer Expiration Test',
        questions: [{ text: 'Will you answer in time?', timeLimit: '5' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeeting()

      // Add a participant
      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Late Responder')

      await facilitatorPage.waitForParticipants(1)

      // Start the question
      await expect(facilitatorPage.startQuestionButton).toBeVisible({ timeout: 15000 })
      await facilitatorPage.startQuestionButton.click()

      // Wait for timer to be visible
      const participantSession = new ParticipantSessionPage(participantPage)
      await expect(participantSession.timerDisplay).toBeVisible({ timeout: 5000 })

      // Wait for timer to expire by polling for 0:00
      await expect(participantSession.timerDisplay).toContainText('0:00', { timeout: 10000 })

      // Participant should still be able to submit (question not auto-closed)
      await participantSession.submitAnswer('Late answer after timer')

      // Answer should be submitted successfully
      await facilitatorPage.waitForAnswers(1, 1)

      await participantContext.close()
    })
  })
})
