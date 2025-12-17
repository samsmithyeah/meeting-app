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
    test('shows waiting message when meeting not started', async ({ page, browser }) => {
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
      await expect(session.waitingForMeetingMessage).toBeVisible()
      await expect(session.meetingTitle).toContainText('Waiting State Test')
      await expect(session.participantName).toContainText('Joined as Waiting User')

      await participantContext.close()
    })

    test('transitions to waiting for question when meeting starts', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Transition Test',
        questions: [{ text: 'Test?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      // Join as participant
      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Transition User')

      const session = new ParticipantSessionPage(participantPage)
      await expect(session.waitingForMeetingMessage).toBeVisible()

      // Start meeting
      await facilitatorPage.startMeetingButton.click()

      // Participant should see "You're in!" message
      await expect(participantPage.getByText("You're in!")).toBeVisible()
      await expect(session.waitingForQuestionMessage).toBeVisible()

      await participantContext.close()
    })
  })

  test.describe('Answering Questions', () => {
    test('shows question when facilitator starts it', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Question Display Test',
        questions: [{ text: 'What is your favorite color?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      // Join as participant
      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Color User')

      await facilitatorPage.waitForParticipants(1)

      const session = new ParticipantSessionPage(participantPage)

      // Start question
      await facilitatorPage.startQuestionButton.click()

      await session.waitForQuestion()
      await expect(participantPage.getByText('What is your favorite color?')).toBeVisible()
      await expect(session.answerInput).toBeVisible()
      await expect(session.submitAnswerButton).toBeVisible()

      await participantContext.close()
    })

    test('can submit answer', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Submit Answer Test',
        questions: [{ text: 'What is 2+2?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Math User')

      await facilitatorPage.waitForParticipants(1)
      await facilitatorPage.startQuestionButton.click()

      const session = new ParticipantSessionPage(participantPage)
      await session.waitForQuestion()

      await session.submitAnswer('4')

      // Should show the submitted answer
      await expect(session.getMyAnswerItem('4')).toBeVisible()
      // Should show answered count
      await expect(session.answeredCountText).toBeVisible()

      await participantContext.close()
    })

    test('can submit multiple answers when allowed', async ({ page, browser }) => {
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
      await session.waitForQuestion()

      await session.submitAnswer('Reading')
      await expect(session.getMyAnswerItem('Reading')).toBeVisible()

      await session.submitAnswer('Gaming')
      await expect(session.getMyAnswerItem('Gaming')).toBeVisible()

      await session.submitAnswer('Cooking')
      await expect(session.getMyAnswerItem('Cooking')).toBeVisible()

      await participantContext.close()
    })

    test('can edit answer during question', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Edit Answer Test',
        questions: [{ text: 'Your answer?' }]
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

      await session.submitAnswer('Original')
      await expect(session.getMyAnswerItem('Original')).toBeVisible()

      // Edit the answer - when editing, a separate textarea appears inside the answer card
      await session.getEditButton(0).click()
      // The edit form has an autoFocused textarea
      await participantPage.locator('textarea').first().fill('Edited')
      await participantPage.getByRole('button', { name: 'Save' }).click()

      await expect(session.getMyAnswerItem('Edited')).toBeVisible()
      await expect(session.getMyAnswerItem('Original')).not.toBeVisible()

      await participantContext.close()
    })

    test('can delete answer during question', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Delete Answer Test',
        questions: [{ text: 'Your answer?', allowMultiple: true }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Delete User')

      await facilitatorPage.waitForParticipants(1)
      await facilitatorPage.startQuestionButton.click()

      const session = new ParticipantSessionPage(participantPage)
      await session.waitForQuestion()

      await session.submitAnswer('To Delete')
      await expect(session.getMyAnswerItem('To Delete')).toBeVisible()

      await session.getDeleteButton(0).click()
      await expect(session.getMyAnswerItem('To Delete')).not.toBeVisible()

      await participantContext.close()
    })
  })

  test.describe('Answer Reveal', () => {
    test('shows revealed answers from all participants', async ({ page, browser }) => {
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

      // Both participants should see all answers
      await session1.waitForReveal()
      await expect(session1.getRevealedAnswer('I am Alice')).toBeVisible()
      await expect(session1.getRevealedAnswer('I am Bob')).toBeVisible()

      await session2.waitForReveal()
      await expect(session2.getRevealedAnswer('I am Alice')).toBeVisible()
      await expect(session2.getRevealedAnswer('I am Bob')).toBeVisible()

      await participant1Context.close()
      await participant2Context.close()
    })

    test('shows waiting for facilitator message after reveal', async ({ page, browser }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Wait Message Test',
        questions: [{ text: 'Test?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Wait User')

      await facilitatorPage.waitForParticipants(1)
      await facilitatorPage.startQuestionButton.click()

      const session = new ParticipantSessionPage(participantPage)
      await session.waitForQuestion()
      await session.submitAnswer('Done')

      await facilitatorPage.waitForAnswers(1, 1)
      await facilitatorPage.revealAnswersButton.click()

      await expect(session.waitingForFacilitatorMessage).toBeVisible()

      await participantContext.close()
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
