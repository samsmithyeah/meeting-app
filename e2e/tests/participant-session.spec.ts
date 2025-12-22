import { test, expect } from '../fixtures'
import {
  CreateMeetingPage,
  FacilitatorSessionPage,
  JoinMeetingPage,
  ParticipantSessionPage
} from '../pages'

test.describe('Participant Session', () => {
  test.use({ storageState: 'e2e/.auth/user1.json' })

  test.describe('Waiting State', () => {
    test('shows waiting messages and transitions when meeting starts', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Waiting State Test',
        questions: [{ text: 'Test?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      // Join as participant
      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Waiting User')

      const session = new ParticipantSessionPage(participantPage)

      // Original: shows waiting message when meeting not started
      await expect(session.waitingForMeetingMessage).toBeVisible()
      await expect(session.meetingTitle).toContainText('Waiting State Test')
      await expect(session.participantName).toContainText('Joined as Waiting User')

      // Start meeting
      await facilitatorPage.startMeetingButton.click()

      // Original: transitions to waiting for question when meeting starts
      await expect(participantPage.getByText("You're in!")).toBeVisible()
      await expect(session.waitingForQuestionMessage).toBeVisible()

      await participantContext.close()
    })
  })

  test.describe('Answering Questions', () => {
    test('shows question, submits answer, and allows multiple answers', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Multiple Answers Test',
        questions: [{ text: 'List your hobbies', allowMultiple: true }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Hobby User')

      await facilitatorPage.waitForParticipants(1)
      await facilitatorPage.startQuestionButton.click()

      const session = new ParticipantSessionPage(participantPage)

      // Original: shows question when facilitator starts it
      await session.waitForQuestion()
      await expect(participantPage.getByText('List your hobbies')).toBeVisible()
      await expect(session.answerInput).toBeVisible()
      await expect(session.submitAnswerButton).toBeVisible()

      // Original: can submit answer + shows answered count
      await session.submitAnswer('Reading')
      await expect(session.getMyAnswerItem('Reading')).toBeVisible()
      await expect(session.answeredCountText).toBeVisible()

      // Original: can submit multiple answers when allowed
      await session.submitAnswer('Gaming')
      await expect(session.getMyAnswerItem('Gaming')).toBeVisible()

      await session.submitAnswer('Cooking')
      await expect(session.getMyAnswerItem('Cooking')).toBeVisible()

      await participantContext.close()
    })

    test('can edit and delete answers during question', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Edit Delete Test',
        questions: [{ text: 'Your answer?', allowMultiple: true }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Edit User')

      await facilitatorPage.waitForParticipants(1)
      await facilitatorPage.startQuestionButton.click()

      const session = new ParticipantSessionPage(participantPage)
      await session.waitForQuestion()

      // Submit initial answer
      await session.submitAnswer('Original')
      await expect(session.getMyAnswerItem('Original')).toBeVisible()

      // Original: can edit answer during question
      await session.getEditButton(0).click()
      await participantPage.locator('textarea').first().fill('Edited')
      await participantPage.getByRole('button', { name: 'Save' }).click()

      await expect(session.getMyAnswerItem('Edited')).toBeVisible()
      await expect(session.getMyAnswerItem('Original')).not.toBeVisible()

      // Submit another answer to test delete
      await session.submitAnswer('To Delete')
      await expect(session.getMyAnswerItem('To Delete')).toBeVisible()

      // Original: can delete answer during question
      await session.getDeleteButton(1).click()
      await expect(session.getMyAnswerItem('To Delete')).not.toBeVisible()

      await participantContext.close()
    })
  })

  test.describe('Answer Reveal', () => {
    test('shows revealed answers and waiting for facilitator message', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Reveal Test',
        questions: [{ text: 'What is your name?' }],
        showNames: true
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      // Add two participants
      const participant1Context = await browser.newContext()
      const participant1Page = await participant1Context.newPage()

      const join1 = new JoinMeetingPage(participant1Page)
      await join1.goto()
      await join1.joinMeeting(participantCode, 'Alice')

      const participant2Context = await browser.newContext()
      const participant2Page = await participant2Context.newPage()

      const join2 = new JoinMeetingPage(participant2Page)
      await join2.goto()
      await join2.joinMeeting(participantCode, 'Bob')

      await facilitatorPage.waitForParticipants(2)
      await facilitatorPage.startQuestionButton.click()

      // Both submit answers
      const session1 = new ParticipantSessionPage(participant1Page)
      await session1.waitForQuestion()
      await session1.submitAnswer('I am Alice')

      const session2 = new ParticipantSessionPage(participant2Page)
      await session2.waitForQuestion()
      await session2.submitAnswer('I am Bob')

      await facilitatorPage.waitForAnswers(2, 2)
      await facilitatorPage.revealAnswersButton.click()

      // Original: shows revealed answers from all participants
      await session1.waitForReveal()
      await expect(session1.getRevealedAnswer('I am Alice')).toBeVisible()
      await expect(session1.getRevealedAnswer('I am Bob')).toBeVisible()

      await session2.waitForReveal()
      await expect(session2.getRevealedAnswer('I am Alice')).toBeVisible()
      await expect(session2.getRevealedAnswer('I am Bob')).toBeVisible()

      // Original: shows waiting for facilitator message after reveal
      await expect(session1.waitingForFacilitatorMessage).toBeVisible()
      await expect(session2.waitingForFacilitatorMessage).toBeVisible()

      await participant1Context.close()
      await participant2Context.close()
    })
  })

  test.describe('Timer', () => {
    test('shows timer countdown when question has time limit', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Timer Test',
        questions: [{ text: 'Quick answer?', timeLimit: '30' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Timer User')

      await facilitatorPage.waitForParticipants(1)
      await facilitatorPage.startQuestionButton.click()

      const session = new ParticipantSessionPage(participantPage)
      await session.waitForQuestion()

      // Timer should be visible
      await expect(session.timerDisplay).toBeVisible()

      await participantContext.close()
    })
  })

  test.describe('Session Navigation', () => {
    test('redirects to join page if no participant name in session', async ({ page }) => {
      // Clear session storage and try to access session directly
      await page.goto('/session/ABCDEF')

      await expect(page).toHaveURL(/\/join\/ABCDEF/)
    })
  })
})
