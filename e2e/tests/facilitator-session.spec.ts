import { test, expect } from '../fixtures'
import { CreateMeetingPage, FacilitatorSessionPage, JoinMeetingPage } from '../pages'

test.describe('Facilitator Session', () => {
  test.use({ storageState: 'e2e/.auth/user1.json' })

  test.describe('Draft Meeting State', () => {
    test('shows QR code and join link when meeting not started', async ({ page }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Draft State Test',
        questions: [{ text: 'Test question?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      await expect(facilitatorPage.qrCode).toBeVisible()
      await expect(facilitatorPage.copyJoinLinkButton).toBeVisible()
      await expect(facilitatorPage.startMeetingButton).toBeVisible()
    })

    test('displays meeting title and facilitator view label', async ({ page }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'My Test Meeting',
        questions: [{ text: 'Test?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      await expect(facilitatorPage.meetingTitle).toContainText('My Test Meeting')
      await expect(page.getByText('Facilitator View')).toBeVisible()
    })

    test('shows share button with participant code', async ({ page }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Share Test',
        questions: [{ text: 'Test?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      await expect(facilitatorPage.shareButton).toBeVisible()

      const shareText = await facilitatorPage.shareButton.textContent()
      expect(shareText).toMatch(/Share:\s*[A-Z0-9]{6}/)
    })

    test('copy join link button is clickable', async ({ page }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Copy Link Test',
        questions: [{ text: 'Test?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)

      // Verify the copy button exists and is enabled
      await expect(facilitatorPage.copyJoinLinkButton).toBeVisible()
      await expect(facilitatorPage.copyJoinLinkButton).toBeEnabled()

      // Click the button - the clipboard API may fail in headless mode,
      // but at least verify the button is clickable without errors
      await facilitatorPage.copyJoinLinkButton.click()

      // Button should still be visible after click
      await expect(facilitatorPage.copyJoinLinkButton).toBeVisible()
    })
  })

  test.describe('Start Meeting', () => {
    test('start meeting button transitions to active state', async ({ page }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Start Meeting Test',
        questions: [{ text: 'Test question?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      await facilitatorPage.startMeetingButton.click()

      // Should now show question controls instead of QR code
      await expect(facilitatorPage.questionProgress).toBeVisible()
      await expect(facilitatorPage.startQuestionButton).toBeVisible()
    })

    test('shows correct question progress indicator', async ({ page }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Progress Test',
        questions: [
          { text: 'Question 1?' },
          { text: 'Question 2?' },
          { text: 'Question 3?' }
        ]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      await facilitatorPage.startMeetingButton.click()

      await expect(facilitatorPage.questionProgress).toContainText('Question 1 of 3')
    })

    test('start question button is disabled when no participants', async ({ page }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'No Participants Test',
        questions: [{ text: 'Test?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      await facilitatorPage.startMeetingButton.click()

      await expect(facilitatorPage.startQuestionButton).toBeDisabled()
    })
  })

  test.describe('Question Flow with Participant', () => {
    test('participant count updates when participant joins', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Participant Count Test',
        questions: [{ text: 'Test question?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      // Join as participant in another context
      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Participant 1')

      // Wait for participant to connect
      await facilitatorPage.waitForParticipants(1)
      await expect(facilitatorPage.participantCount).toContainText('1')

      await participantContext.close()
    })

    test('can start question when participants present', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Start Question Test',
        questions: [{ text: 'What do you think?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      // Add participant
      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Participant 1')

      await facilitatorPage.waitForParticipants(1)

      // Start question
      await facilitatorPage.startQuestionButton.click()

      // Reveal answers button should now be visible
      await expect(facilitatorPage.revealAnswersButton).toBeVisible()

      await participantContext.close()
    })

    test('shows answer count during question', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Answer Count Test',
        questions: [{ text: 'What is your answer?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      // Add participant and submit answer
      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Answerer')

      await facilitatorPage.waitForParticipants(1)
      await facilitatorPage.startQuestionButton.click()

      // Wait for participant to see question
      await participantPage.getByPlaceholder(/your answer/i).waitFor()
      await participantPage.getByPlaceholder(/your answer/i).fill('My answer')
      await participantPage.getByRole('button', { name: 'Submit' }).click()

      // Check reveal button shows count
      await facilitatorPage.waitForAnswers(1, 1)
      await expect(facilitatorPage.revealAnswersButton).toContainText('1/1')

      await participantContext.close()
    })
  })

  test.describe('Multiple Questions Flow', () => {
    test('can navigate through multiple questions', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Multi Question Flow',
        questions: [{ text: 'Question 1?' }, { text: 'Question 2?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      // Add participant
      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Multi Q User')

      await facilitatorPage.waitForParticipants(1)

      // Q1: Start, submit, reveal
      await facilitatorPage.startQuestionButton.click()
      await participantPage.getByPlaceholder(/your answer/i).waitFor()
      await participantPage.getByPlaceholder(/your answer/i).fill('Answer 1')
      await participantPage.getByRole('button', { name: 'Submit' }).click()

      await facilitatorPage.waitForAnswers(1, 1)
      await facilitatorPage.revealAnswersButton.click()

      // Next question button should appear
      await expect(facilitatorPage.nextQuestionButton).toBeVisible()
      await facilitatorPage.nextQuestionButton.click()

      // Should now be on Q2
      await expect(facilitatorPage.questionProgress).toContainText('Question 2 of 2')

      await participantContext.close()
    })

    test('end meeting button appears on last question', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Last Question Test',
        questions: [{ text: 'Only question?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      // Add participant
      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Last Q User')

      await facilitatorPage.waitForParticipants(1)

      // Start, submit, reveal
      await facilitatorPage.startQuestionButton.click()
      await participantPage.getByPlaceholder(/your answer/i).waitFor()
      await participantPage.getByPlaceholder(/your answer/i).fill('Final answer')
      await participantPage.getByRole('button', { name: 'Submit' }).click()

      await facilitatorPage.waitForAnswers(1, 1)
      await facilitatorPage.revealAnswersButton.click()

      // End meeting button should appear instead of next question
      await expect(facilitatorPage.endMeetingButton).toBeVisible()
      await expect(facilitatorPage.nextQuestionButton).not.toBeVisible()

      await participantContext.close()
    })

    test('end meeting redirects to home', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'End Meeting Test',
        questions: [{ text: 'End test?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'End User')

      await facilitatorPage.waitForParticipants(1)
      await facilitatorPage.startQuestionButton.click()

      await participantPage.getByPlaceholder(/your answer/i).waitFor()
      await participantPage.getByPlaceholder(/your answer/i).fill('Done')
      await participantPage.getByRole('button', { name: 'Submit' }).click()

      await facilitatorPage.waitForAnswers(1, 1)
      await facilitatorPage.revealAnswersButton.click()
      await facilitatorPage.endMeetingButton.click()

      await expect(page).toHaveURL('/')

      await participantContext.close()
    })
  })
})
