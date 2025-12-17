import { test, expect } from '../fixtures'
import { CreateMeetingPage, FacilitatorSessionPage, JoinMeetingPage } from '../pages'

test.describe('Facilitator Session', () => {
  test.use({ storageState: 'e2e/.auth/user1.json' })

  test.describe('Draft Meeting State', () => {
    test('displays all draft meeting elements correctly', async ({ page }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'My Test Meeting',
        questions: [{ text: 'Test question?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)

      // Original: shows QR code and join link when meeting not started
      await expect(facilitatorPage.qrCode).toBeVisible()
      await expect(facilitatorPage.copyJoinLinkButton).toBeVisible()
      await expect(facilitatorPage.startMeetingButton).toBeVisible()

      // Original: displays meeting title and facilitator view label
      await expect(facilitatorPage.meetingTitle).toContainText('My Test Meeting')
      await expect(page.getByText('Facilitator View')).toBeVisible()

      // Original: shows share button with participant code
      await expect(facilitatorPage.shareButton).toBeVisible()
      const shareText = await facilitatorPage.shareButton.textContent()
      expect(shareText).toMatch(/Share:\s*[A-Z0-9]{6}/)

      // Original: copy join link button is clickable
      await expect(facilitatorPage.copyJoinLinkButton).toBeEnabled()
      await facilitatorPage.copyJoinLinkButton.click()
      await expect(facilitatorPage.copyJoinLinkButton).toBeVisible()
    })
  })

  test.describe('Start Meeting', () => {
    test('transitions to active state with correct UI', async ({ page }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Progress Test',
        questions: [{ text: 'Question 1?' }, { text: 'Question 2?' }, { text: 'Question 3?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)

      // Original: start meeting button transitions to active state
      await facilitatorPage.startMeetingButton.click()
      await expect(facilitatorPage.questionProgress).toBeVisible()
      await expect(facilitatorPage.startQuestionButton).toBeVisible()

      // Original: shows correct question progress indicator
      await expect(facilitatorPage.questionProgress).toContainText('Question 1 of 3')

      // Original: start question button is disabled when no participants
      await expect(facilitatorPage.startQuestionButton).toBeDisabled()
    })
  })

  test.describe('Question Flow with Participant', () => {
    test('participant joins, answer submitted, and count updates', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Answer Count Test',
        questions: [{ text: 'What is your answer?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      // Add participant in another context
      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Participant 1')

      // Original: participant count updates when participant joins
      await facilitatorPage.waitForParticipants(1)
      await expect(facilitatorPage.participantCount).toContainText('1')

      // Original: can start question when participants present
      await facilitatorPage.startQuestionButton.click()
      await expect(facilitatorPage.revealAnswersButton).toBeVisible()

      // Original: shows answer count during question
      await participantPage.getByPlaceholder(/your answer/i).waitFor()
      await participantPage.getByPlaceholder(/your answer/i).fill('My answer')
      await participantPage.getByRole('button', { name: 'Submit' }).click()

      await facilitatorPage.waitForAnswers(1, 1)
      await expect(facilitatorPage.revealAnswersButton).toContainText('1/1')

      await participantContext.close()
    })
  })

  test.describe('Multiple Questions Flow', () => {
    test('navigates through questions and ends meeting', async ({ page, browser }) => {
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

      // Original: can navigate through multiple questions
      await expect(facilitatorPage.nextQuestionButton).toBeVisible()
      await facilitatorPage.nextQuestionButton.click()
      await expect(facilitatorPage.questionProgress).toContainText('Question 2 of 2')

      // Q2: Start, submit, reveal
      await facilitatorPage.startQuestionButton.click()
      await participantPage.getByPlaceholder(/answer/i).waitFor()
      await participantPage.getByPlaceholder(/answer/i).fill('Answer 2')
      await participantPage.getByRole('button', { name: 'Submit' }).click()

      await facilitatorPage.waitForAnswers(1, 1)
      await facilitatorPage.revealAnswersButton.click()

      // Original: end meeting button appears on last question
      await expect(facilitatorPage.endMeetingButton).toBeVisible()
      await expect(facilitatorPage.nextQuestionButton).not.toBeVisible()

      // Original: end meeting redirects to home
      await facilitatorPage.endMeetingButton.click()
      await expect(page).toHaveURL('/')

      await participantContext.close()
    })
  })
})
