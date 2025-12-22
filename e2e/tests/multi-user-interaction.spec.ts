import { test, expect } from '../fixtures'
import {
  CreateMeetingPage,
  FacilitatorSessionPage,
  JoinMeetingPage,
  ParticipantSessionPage
} from '../pages'

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
    test('answers show or hide names based on showNames setting', async ({ user1Page, browser }) => {
      // First test: showNames enabled
      const createPage1 = new CreateMeetingPage(user1Page)
      await createPage1.goto()

      await createPage1.createMeeting({
        title: 'Show Names Test',
        questions: [{ text: 'Who are you?' }],
        showNames: true
      })

      const facilitatorPage1 = new FacilitatorSessionPage(user1Page)
      const participantCode1 = await facilitatorPage1.getParticipantCode()

      await facilitatorPage1.startMeetingButton.click()

      const participantContext1 = await browser.newContext()
      const participantPage1 = await participantContext1.newPage()

      const joinPage1 = new JoinMeetingPage(participantPage1)
      await joinPage1.goto()
      await joinPage1.joinMeeting(participantCode1, 'Named User')

      await facilitatorPage1.waitForParticipants(1)
      await facilitatorPage1.startQuestionButton.click()

      const session1 = new ParticipantSessionPage(participantPage1)
      await session1.waitForQuestion()
      await session1.submitAnswer('My answer here')

      await facilitatorPage1.waitForAnswers(1, 1)
      await facilitatorPage1.revealAnswersButton.click()

      // Original: answers show names when showNames is enabled
      await expect(user1Page.getByText('Named User')).toBeVisible()

      await participantContext1.close()

      // Second test: showNames disabled
      const createPage2 = new CreateMeetingPage(user1Page)
      await createPage2.goto()

      await createPage2.createMeeting({
        title: 'Anonymous Test',
        questions: [{ text: 'Secret?' }],
        showNames: false
      })

      const facilitatorPage2 = new FacilitatorSessionPage(user1Page)
      const participantCode2 = await facilitatorPage2.getParticipantCode()

      await facilitatorPage2.startMeetingButton.click()

      const participantContext2 = await browser.newContext()
      const participantPage2 = await participantContext2.newPage()

      const joinPage2 = new JoinMeetingPage(participantPage2)
      await joinPage2.goto()
      await joinPage2.joinMeeting(participantCode2, 'Hidden User')

      await facilitatorPage2.waitForParticipants(1)
      await facilitatorPage2.startQuestionButton.click()

      const session2 = new ParticipantSessionPage(participantPage2)
      await session2.waitForQuestion()
      await session2.submitAnswer('Anonymous answer')

      await facilitatorPage2.waitForAnswers(1, 1)
      await facilitatorPage2.revealAnswersButton.click()

      // Original: answers are anonymous when showNames is disabled
      await expect(facilitatorPage2.getRevealedAnswer('Anonymous answer')).toBeVisible()
      await expect(user1Page.getByText('Hidden User')).not.toBeVisible()

      await participantContext2.close()
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
    test('participant receives meeting ended event and late joiner sees state', async ({
      user1Page,
      browser
    }) => {
      // Part 1: Test meeting ended event
      const createPage1 = new CreateMeetingPage(user1Page)
      await createPage1.goto()

      await createPage1.createMeeting({
        title: 'End Event Test',
        questions: [{ text: 'Final question?' }]
      })

      const facilitatorPage1 = new FacilitatorSessionPage(user1Page)
      const participantCode1 = await facilitatorPage1.getParticipantCode()

      await facilitatorPage1.startMeetingButton.click()

      const participantContext1 = await browser.newContext()
      const participantPage1 = await participantContext1.newPage()

      const joinPage1 = new JoinMeetingPage(participantPage1)
      await joinPage1.goto()
      await joinPage1.joinMeeting(participantCode1, 'End User')

      await facilitatorPage1.waitForParticipants(1)
      await facilitatorPage1.startQuestionButton.click()

      const session1 = new ParticipantSessionPage(participantPage1)
      await session1.waitForQuestion()
      await session1.submitAnswer('Last answer')

      await facilitatorPage1.waitForAnswers(1, 1)
      await facilitatorPage1.revealAnswersButton.click()

      // End the meeting
      await facilitatorPage1.endMeetingButton.click()

      // Original: participant receives meeting ended event
      await expect(participantPage1).toHaveURL('/')

      await participantContext1.close()

      // Part 2: Test late joiner sees current meeting state
      const createPage2 = new CreateMeetingPage(user1Page)
      await createPage2.goto()

      await createPage2.createMeeting({
        title: 'Late Joiner Test',
        questions: [{ text: 'First?' }, { text: 'Second?' }]
      })

      const facilitatorPage2 = new FacilitatorSessionPage(user1Page)
      const participantCode2 = await facilitatorPage2.getParticipantCode()

      await facilitatorPage2.startMeetingButton.click()

      // First participant joins and completes Q1
      const context1 = await browser.newContext()
      const page1 = await context1.newPage()
      const join1 = new JoinMeetingPage(page1)
      await join1.goto()
      await join1.joinMeeting(participantCode2, 'Early Bird')

      await facilitatorPage2.waitForParticipants(1)
      await facilitatorPage2.startQuestionButton.click()

      const session1a = new ParticipantSessionPage(page1)
      await session1a.waitForQuestion()
      await session1a.submitAnswer('First answer')

      await facilitatorPage2.waitForAnswers(1, 1)
      await facilitatorPage2.revealAnswersButton.click()
      await facilitatorPage2.nextQuestionButton.click()

      // Late joiner joins during Q2
      const context2 = await browser.newContext()
      const page2 = await context2.newPage()
      const join2 = new JoinMeetingPage(page2)
      await join2.goto()
      await join2.joinMeeting(participantCode2, 'Late Comer')

      await facilitatorPage2.waitForParticipants(2)

      // Start Q2
      await facilitatorPage2.startQuestionButton.click()

      // Original: late joiner sees current meeting state
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
