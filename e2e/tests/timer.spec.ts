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
    test('timer is displayed when question has time limit', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      // Create meeting with 5-second time limit (dev mode only)
      await createPage.createMeeting({
        title: 'Timer Test',
        questions: [{ text: 'Quick question?', timeLimit: '5' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      // Use robust startMeeting helper
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

      // Timer should be visible on both facilitator and participant pages
      await expect(facilitatorPage.timerDisplay).toBeVisible({ timeout: 5000 })

      const participantSession = new ParticipantSessionPage(participantPage)
      await expect(participantSession.timerDisplay).toBeVisible({ timeout: 5000 })

      await participantContext.close()
    })

    test('timer shows correct initial time', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      // Create meeting with 10-second time limit (dev mode only)
      await createPage.createMeeting({
        title: 'Timer Initial Value Test',
        questions: [{ text: 'Ten second question?', timeLimit: '10' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      // Use robust startMeeting helper
      await facilitatorPage.startMeeting()

      // Add a participant
      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Timer Checker')

      await facilitatorPage.waitForParticipants(1)

      // Start the question
      await expect(facilitatorPage.startQuestionButton).toBeVisible({ timeout: 15000 })
      await facilitatorPage.startQuestionButton.click()

      // Timer should show approximately 0:10 (allow for slight delay)
      await expect(facilitatorPage.timerDisplay).toBeVisible({ timeout: 5000 })

      // The timer text should be in "0:XX" format
      const timerText = await facilitatorPage.timerDisplay.textContent()
      expect(timerText).toMatch(/0:\d{2}/)

      await participantContext.close()
    })

    test('timer counts down', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      // Use 10-second timer for countdown test (dev mode only)
      await createPage.createMeeting({
        title: 'Timer Countdown Test',
        questions: [{ text: 'Count down question?', timeLimit: '10' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      // Use robust startMeeting helper
      await facilitatorPage.startMeeting()

      // Add a participant
      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Countdown Watcher')

      await facilitatorPage.waitForParticipants(1)

      // Start the question
      await expect(facilitatorPage.startQuestionButton).toBeVisible({ timeout: 15000 })
      await facilitatorPage.startQuestionButton.click()

      // Wait for timer to appear
      await expect(facilitatorPage.timerDisplay).toBeVisible({ timeout: 5000 })

      // Get initial time
      const initialText = await facilitatorPage.timerDisplay.textContent()

      // Parse time helper
      const parseTime = (text: string | null) => {
        if (!text) return 0
        const match = text.match(/(\d+):(\d{2})/)
        if (!match) return 0
        return parseInt(match[1]) * 60 + parseInt(match[2])
      }

      const initialSeconds = parseTime(initialText)

      // Wait for timer to change using polling instead of fixed timeout
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

      // Use robust startMeeting helper
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
    // Note: Uses 5-second timer (dev mode only) for faster E2E tests
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

      // Use robust startMeeting helper
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

    test('timer turns red when below 10 seconds', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      // Create meeting with 10-second time limit (dev mode only)
      // Timer turns red at <=10 seconds, so it should be red almost immediately
      await createPage.createMeeting({
        title: 'Timer Warning Test',
        questions: [{ text: 'Watch the timer turn red?', timeLimit: '10' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      // Use robust startMeeting helper
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

      // Timer should be visible and have red color class (10 seconds <= 10 threshold)
      await expect(facilitatorPage.timerDisplay).toBeVisible({ timeout: 5000 })
      await expect(facilitatorPage.timerDisplay).toHaveClass(/text-red-600/)

      await participantContext.close()
    })

    test('facilitator can reveal answers before timer expires', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      // Create meeting with 10-second time limit (dev mode only)
      await createPage.createMeeting({
        title: 'Early Reveal Test',
        questions: [{ text: 'Can answers be revealed early?', timeLimit: '10' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      // Use robust startMeeting helper
      await facilitatorPage.startMeeting()

      // Add a participant
      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Quick Responder')

      await facilitatorPage.waitForParticipants(1)

      // Start the question
      await expect(facilitatorPage.startQuestionButton).toBeVisible({ timeout: 15000 })
      await facilitatorPage.startQuestionButton.click()

      // Wait for timer to appear
      await expect(facilitatorPage.timerDisplay).toBeVisible({ timeout: 5000 })

      // Submit answer quickly
      const participantSession = new ParticipantSessionPage(participantPage)
      await participantSession.waitForQuestion()
      await participantSession.submitAnswer('Fast answer')

      await facilitatorPage.waitForAnswers(1, 1)

      // Reveal answers before timer expires
      await facilitatorPage.revealAnswersButton.click()

      // Answers should be revealed
      await expect(facilitatorPage.getRevealedAnswer('Fast answer')).toBeVisible()

      // Timer should no longer be visible after reveal
      await expect(facilitatorPage.timerDisplay).not.toBeVisible()

      await participantContext.close()
    })
  })
})
