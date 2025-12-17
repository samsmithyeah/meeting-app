import { test, expect } from '../fixtures'
import { JoinMeetingPage, CreateMeetingPage, FacilitatorSessionPage } from '../pages'

test.describe('Meeting Join', () => {
  test.describe('Join Page UI', () => {
    test('displays form and validates input correctly', async ({ page }) => {
      const joinPage = new JoinMeetingPage(page)
      await joinPage.goto()

      // Original: displays join form with all elements
      await expect(page.getByRole('heading', { name: 'Join a Meeting' })).toBeVisible()
      await expect(joinPage.codeInput).toBeVisible()
      await expect(joinPage.nameInput).toBeVisible()
      await expect(joinPage.joinButton).toBeVisible()
      await expect(joinPage.backToHomeLink).toBeVisible()

      // Original: code input converts to uppercase
      await joinPage.codeInput.fill('abc123')
      await expect(joinPage.codeInput).toHaveValue('ABC123')

      // Original: code input removes non-alphanumeric characters
      await joinPage.codeInput.fill('')
      await joinPage.codeInput.pressSequentially('ABC-123!')
      await expect(joinPage.codeInput).toHaveValue('ABC123')

      // Original: button is disabled for invalid code length
      await joinPage.codeInput.fill('ABC')
      await joinPage.nameInput.fill('Test User')
      await expect(joinPage.joinButton).toBeDisabled()

      // Original: button is disabled when name is missing
      await joinPage.codeInput.fill('ABC123')
      await joinPage.nameInput.fill('')
      await expect(joinPage.joinButton).toBeDisabled()
    })

    test('navigation and auth links work correctly', async ({ page }) => {
      const joinPage = new JoinMeetingPage(page)
      await joinPage.goto()

      // Original: shows sign in link for unauthenticated users
      await expect(joinPage.signInLink).toBeVisible()

      // Original: navigates back to home
      await joinPage.backToHomeLink.click()
      await expect(page).toHaveURL('/')
    })
  })

  test.describe('Join with Code from URL', () => {
    test.use({ storageState: 'e2e/.auth/user1.json' })

    let participantCode: string

    test.beforeEach(async ({ page }) => {
      // Create a meeting first to get a valid code
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Join Test Meeting',
        questions: [{ text: 'Test question?' }]
      })

      await page.waitForURL(/\/facilitate\/[A-Z0-9]{6}/)
      const facilitatorPage = new FacilitatorSessionPage(page)
      participantCode = await facilitatorPage.getParticipantCode()
    })

    test('pre-fills code, shows meeting info, and auto-fills name', async ({ page }) => {
      const joinPage = new JoinMeetingPage(page)
      await joinPage.goto(participantCode)

      // Original: pre-fills code from URL
      await expect(joinPage.codeInput).toHaveValue(participantCode)

      // Original: shows meeting found message for valid code
      await expect(joinPage.meetingFoundMessage).toBeVisible()
      await expect(joinPage.meetingFoundMessage).toContainText('Join Test Meeting')

      // Original: auto-fills name from authenticated user profile
      await expect(async () => {
        const nameValue = await joinPage.nameInput.inputValue()
        expect(nameValue.length).toBeGreaterThan(0)
      }).toPass({ timeout: 5000 })
    })
  })

  test.describe('Join Meeting Flow', () => {
    test.use({ storageState: 'e2e/.auth/user1.json' })

    let participantCode: string

    test.beforeEach(async ({ page }) => {
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Join Flow Test Meeting',
        questions: [{ text: 'Test question?' }]
      })

      await page.waitForURL(/\/facilitate\/[A-Z0-9]{6}/)
      const facilitatorPage = new FacilitatorSessionPage(page)
      participantCode = await facilitatorPage.getParticipantCode()
    })

    test('joins meeting successfully or shows error for invalid code', async ({ page, browser }) => {
      // Original: successfully joins meeting and redirects to session
      const context = await browser.newContext()
      const newPage = await context.newPage()

      const joinPage = new JoinMeetingPage(newPage)
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, 'Test Participant')

      await expect(newPage).toHaveURL(`/session/${participantCode}`)
      await expect(newPage.getByText('Joined as Test Participant')).toBeVisible()

      await context.close()

      // Original: shows error for invalid meeting code
      // Don't use joinMeeting() here since it throws on "Meeting not found"
      const invalidJoinPage = new JoinMeetingPage(page)
      await invalidJoinPage.goto()
      await invalidJoinPage.codeInput.fill('XXXXXX')
      await invalidJoinPage.nameInput.fill('Test User')
      await invalidJoinPage.joinButton.click()

      await expect(invalidJoinPage.errorMessage).toBeVisible()
    })

    test('redirects to facilitator view when using facilitator code', async ({ page }) => {
      // Create a meeting first
      const createPage = new CreateMeetingPage(page)
      await createPage.goto()

      await createPage.createMeeting({
        title: 'Facilitator Code Test',
        questions: [{ text: 'Test?' }]
      })

      // Wait for redirect to facilitator page and extract the code
      await page.waitForURL(/\/facilitate\/[A-Z0-9]{6}/)
      const url = page.url()
      const facilitatorCode = url.split('/').pop()!

      // Try to join with facilitator code
      const joinPage = new JoinMeetingPage(page)
      await joinPage.goto()

      // Type the code character by character to trigger onChange properly
      await joinPage.codeInput.pressSequentially(facilitatorCode)

      // Should redirect to facilitator view (allow time for API call)
      await expect(page).toHaveURL(`/facilitate/${facilitatorCode}`, { timeout: 10000 })
    })
  })
})
