import { test, expect } from '../fixtures'
import { CreateMeetingPage, FacilitatorSessionPage, JoinMeetingPage, ParticipantSessionPage } from '../pages'

test.describe('Multi-User Interaction', () => {
  test.describe('Two Users - Facilitator and Participant', () => {
    test('user1 as facilitator, user2 as participant complete a meeting', async ({
      user1Page,
      user2Page
    }) => {
      // User1 creates a meeting
      const createPage = new CreateMeetingPage(user1Page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Two User Meeting',
        questions: [{ text: 'What is your role?' }, { text: 'What is your favorite food?' }],
        showNames: true
      })

      const facilitatorPage = new FacilitatorSessionPage(user1Page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      // User2 joins the meeting
      const joinPage = new JoinMeetingPage(user2Page)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'User Two')

      await facilitatorPage.waitForParticipants(1)

      // Question 1
      await facilitatorPage.startQuestionButton.click()

      const session = new ParticipantSessionPage(user2Page)
      await session.waitForQuestion()
      await session.submitAnswer('Participant')

      await facilitatorPage.waitForAnswers(1, 1)
      await facilitatorPage.revealAnswersButton.click()

      // Verify answer is shown with name
      await expect(facilitatorPage.getRevealedAnswer('Participant')).toBeVisible()
      await expect(user1Page.getByText('User Two')).toBeVisible()

      // Move to question 2
      await facilitatorPage.nextQuestionButton.click()

      // Start question 2
      await facilitatorPage.startQuestionButton.click()

      await session.waitForQuestion()
      await session.submitAnswer('Pizza')

      await facilitatorPage.waitForAnswers(1, 1)
      await facilitatorPage.revealAnswersButton.click()

      await expect(facilitatorPage.getRevealedAnswer('Pizza')).toBeVisible()

      // End meeting
      await facilitatorPage.endMeetingButton.click()
      await expect(user1Page).toHaveURL('/')
    })

    test('real-time participant count updates', async ({ user1Page, browser }) => {
      const createPage = new CreateMeetingPage(user1Page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Participant Count Test',
        questions: [{ text: 'Test?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(user1Page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      // Start with 0 participants
      await expect(facilitatorPage.participantCount).toContainText('0')

      // Add first participant
      const context1 = await browser.newContext()
      const page1 = await context1.newPage()
      const join1 = new JoinMeetingPage(page1)
      await join1.goto()
      await join1.joinMeeting(participantCode, 'P1')

      await facilitatorPage.waitForParticipants(1)
      await expect(facilitatorPage.participantCount).toContainText('1')

      // Add second participant
      const context2 = await browser.newContext()
      const page2 = await context2.newPage()
      const join2 = new JoinMeetingPage(page2)
      await join2.goto()
      await join2.joinMeeting(participantCode, 'P2')

      await facilitatorPage.waitForParticipants(2)
      await expect(facilitatorPage.participantCount).toContainText('2')

      // Add third participant
      const context3 = await browser.newContext()
      const page3 = await context3.newPage()
      const join3 = new JoinMeetingPage(page3)
      await join3.goto()
      await join3.joinMeeting(participantCode, 'P3')

      await facilitatorPage.waitForParticipants(3)
      await expect(facilitatorPage.participantCount).toContainText('3')

      await context1.close()
      await context2.close()
      await context3.close()
    })

    test('multiple participants submit answers simultaneously', async ({ user1Page, browser }) => {
      const createPage = new CreateMeetingPage(user1Page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Simultaneous Answers',
        questions: [{ text: 'What number are you thinking of?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(user1Page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      // Create 3 participants
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext()
      ])
      const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()))
      const names = ['Alice', 'Bob', 'Charlie']

      // Join all participants
      for (let i = 0; i < pages.length; i++) {
        const joinPage = new JoinMeetingPage(pages[i])
        await joinPage.goto()
        await joinPage.joinMeeting(participantCode, names[i])
      }

      await facilitatorPage.waitForParticipants(3)
      await facilitatorPage.startQuestionButton.click()

      // All participants submit answers
      const answers = ['42', '7', '13']
      for (let i = 0; i < pages.length; i++) {
        const session = new ParticipantSessionPage(pages[i])
        await session.waitForQuestion()
        await session.submitAnswer(answers[i])
      }

      await facilitatorPage.waitForAnswers(3, 3)
      await expect(facilitatorPage.revealAnswersButton).toContainText('3/3')

      await facilitatorPage.revealAnswersButton.click()

      // Verify all answers are revealed
      for (const answer of answers) {
        await expect(facilitatorPage.getRevealedAnswer(answer)).toBeVisible()
      }

      await Promise.all(contexts.map((ctx) => ctx.close()))
    })
  })

  test.describe('Anonymous vs Named Answers', () => {
    test('answers show names when showNames is enabled', async ({ user1Page, browser }) => {
      const createPage = new CreateMeetingPage(user1Page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Show Names Test',
        questions: [{ text: 'Who are you?' }],
        showNames: true
      })

      const facilitatorPage = new FacilitatorSessionPage(user1Page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Named User')

      await facilitatorPage.waitForParticipants(1)
      await facilitatorPage.startQuestionButton.click()

      const session = new ParticipantSessionPage(participantPage)
      await session.waitForQuestion()
      await session.submitAnswer('My answer here')

      await facilitatorPage.waitForAnswers(1, 1)
      await facilitatorPage.revealAnswersButton.click()

      // Should show the participant name with the answer
      await expect(user1Page.getByText('Named User')).toBeVisible()

      await participantContext.close()
    })

    test('answers are anonymous when showNames is disabled', async ({ user1Page, browser }) => {
      const createPage = new CreateMeetingPage(user1Page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Anonymous Test',
        questions: [{ text: 'Secret?' }],
        showNames: false
      })

      const facilitatorPage = new FacilitatorSessionPage(user1Page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Hidden User')

      await facilitatorPage.waitForParticipants(1)
      await facilitatorPage.startQuestionButton.click()

      const session = new ParticipantSessionPage(participantPage)
      await session.waitForQuestion()
      await session.submitAnswer('Anonymous answer')

      await facilitatorPage.waitForAnswers(1, 1)
      await facilitatorPage.revealAnswersButton.click()

      // Answer should be visible but name should not be shown
      await expect(facilitatorPage.getRevealedAnswer('Anonymous answer')).toBeVisible()
      // The name shouldn't appear next to the answer
      await expect(user1Page.getByText('Hidden User')).not.toBeVisible()

      await participantContext.close()
    })
  })

  test.describe('Duplicate Name Handling', () => {
    test('prevents joining with duplicate name', async ({ user1Page, browser }) => {
      const createPage = new CreateMeetingPage(user1Page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Duplicate Name Test',
        questions: [{ text: 'Test?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(user1Page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      // First participant joins
      const context1 = await browser.newContext()
      const page1 = await context1.newPage()
      const join1 = new JoinMeetingPage(page1)
      await join1.goto()
      await join1.joinMeeting(participantCode, 'DuplicateName')

      await facilitatorPage.waitForParticipants(1)

      // Second participant tries to join with same name
      const context2 = await browser.newContext()
      const page2 = await context2.newPage()
      const join2 = new JoinMeetingPage(page2)
      await join2.goto()
      await join2.codeInput.fill(participantCode)
      await join2.nameInput.fill('DuplicateName')
      await join2.joinButton.click()

      // Navigate to session
      await page2.waitForURL(`/session/${participantCode}`)

      // Should show error about duplicate name - match the specific error message pattern
      await expect(page2.getByText(/already taken.*choose a different name/i)).toBeVisible()

      await context1.close()
      await context2.close()
    })
  })

  test.describe('Meeting Lifecycle Events', () => {
    test('participant receives meeting ended event', async ({ user1Page, browser }) => {
      const createPage = new CreateMeetingPage(user1Page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'End Event Test',
        questions: [{ text: 'Final question?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(user1Page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      const participantContext = await browser.newContext()
      const participantPage = await participantContext.newPage()

      const joinPage = new JoinMeetingPage(participantPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'End User')

      await facilitatorPage.waitForParticipants(1)
      await facilitatorPage.startQuestionButton.click()

      const session = new ParticipantSessionPage(participantPage)
      await session.waitForQuestion()
      await session.submitAnswer('Last answer')

      await facilitatorPage.waitForAnswers(1, 1)
      await facilitatorPage.revealAnswersButton.click()

      // End the meeting
      await facilitatorPage.endMeetingButton.click()

      // Participant should be redirected to home
      await expect(participantPage).toHaveURL('/')

      await participantContext.close()
    })

    test('late joiner sees current meeting state', async ({ user1Page, browser }) => {
      const createPage = new CreateMeetingPage(user1Page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Late Joiner Test',
        questions: [{ text: 'First?' }, { text: 'Second?' }]
      })

      const facilitatorPage = new FacilitatorSessionPage(user1Page)
      const participantCode = await facilitatorPage.getParticipantCode()

      await facilitatorPage.startMeetingButton.click()

      // First participant joins and completes Q1
      const context1 = await browser.newContext()
      const page1 = await context1.newPage()
      const join1 = new JoinMeetingPage(page1)
      await join1.goto()
      await join1.joinMeeting(participantCode, 'Early Bird')

      await facilitatorPage.waitForParticipants(1)
      await facilitatorPage.startQuestionButton.click()

      const session1 = new ParticipantSessionPage(page1)
      await session1.waitForQuestion()
      await session1.submitAnswer('First answer')

      await facilitatorPage.waitForAnswers(1, 1)
      await facilitatorPage.revealAnswersButton.click()
      await facilitatorPage.nextQuestionButton.click()

      // Late joiner joins during Q2
      const context2 = await browser.newContext()
      const page2 = await context2.newPage()
      const join2 = new JoinMeetingPage(page2)
      await join2.goto()
      await join2.joinMeeting(participantCode, 'Late Comer')

      await facilitatorPage.waitForParticipants(2)

      // Start Q2
      await facilitatorPage.startQuestionButton.click()

      // Late joiner should see Q2
      const session2 = new ParticipantSessionPage(page2)
      await session2.waitForQuestion()
      await expect(page2.getByText('Second?')).toBeVisible()

      await context1.close()
      await context2.close()
    })
  })

  test.describe('Full Meeting Flow', () => {
    test('complete meeting with 2 authenticated users as facilitator and participant', async ({
      user1Page,
      user2Page
    }) => {
      // User 1 creates a complex meeting
      const createPage = new CreateMeetingPage(user1Page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Full Flow Integration Test',
        questions: [
          { text: 'What went well this sprint?', allowMultiple: true },
          { text: 'What can we improve?', allowMultiple: true },
          { text: 'Rate the sprint 1-10' }
        ],
        showNames: true
      })

      const facilitatorPage = new FacilitatorSessionPage(user1Page)
      const participantCode = await facilitatorPage.getParticipantCode()

      // Verify draft state
      await expect(facilitatorPage.qrCode).toBeVisible()
      await expect(facilitatorPage.startMeetingButton).toBeVisible()

      // Start meeting
      await facilitatorPage.startMeetingButton.click()

      // User 2 joins
      const joinPage = new JoinMeetingPage(user2Page)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Team Member')

      await facilitatorPage.waitForParticipants(1)

      const session = new ParticipantSessionPage(user2Page)

      // Q1: What went well (multiple answers)
      await expect(facilitatorPage.questionProgress).toContainText('Question 1 of 3')
      await facilitatorPage.startQuestionButton.click()

      await session.waitForQuestion()
      await session.submitAnswer('Good collaboration')
      await session.submitAnswer('Met all deadlines')
      await session.submitAnswer('Clear requirements')

      await facilitatorPage.waitForAnswers(1, 1)
      await facilitatorPage.revealAnswersButton.click()

      await expect(facilitatorPage.getRevealedAnswer('Good collaboration')).toBeVisible()
      await expect(facilitatorPage.getRevealedAnswer('Met all deadlines')).toBeVisible()
      await expect(facilitatorPage.getRevealedAnswer('Clear requirements')).toBeVisible()

      // Move to Q2
      await facilitatorPage.nextQuestionButton.click()
      await expect(facilitatorPage.questionProgress).toContainText('Question 2 of 3')

      // Q2: What can we improve
      await facilitatorPage.startQuestionButton.click()

      await session.waitForQuestion()
      await session.submitAnswer('More testing')
      await session.submitAnswer('Better documentation')

      await facilitatorPage.waitForAnswers(1, 1)
      await facilitatorPage.revealAnswersButton.click()

      await expect(facilitatorPage.getRevealedAnswer('More testing')).toBeVisible()
      await expect(facilitatorPage.getRevealedAnswer('Better documentation')).toBeVisible()

      // Move to Q3 (last question)
      await facilitatorPage.nextQuestionButton.click()
      await expect(facilitatorPage.questionProgress).toContainText('Question 3 of 3')

      // Q3: Rate the sprint
      await facilitatorPage.startQuestionButton.click()

      await session.waitForQuestion()
      await session.submitAnswer('8')

      await facilitatorPage.waitForAnswers(1, 1)
      await facilitatorPage.revealAnswersButton.click()

      await expect(facilitatorPage.getRevealedAnswer('8')).toBeVisible()

      // End meeting
      await expect(facilitatorPage.endMeetingButton).toBeVisible()
      await facilitatorPage.endMeetingButton.click()

      // Both users should be redirected to home
      await expect(user1Page).toHaveURL('/')
      await expect(user2Page).toHaveURL('/')
    })
  })
})
