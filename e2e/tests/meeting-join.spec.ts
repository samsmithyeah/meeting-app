import { test, expect } from '../fixtures'
import { JoinMeetingPage, CreateMeetingPage, FacilitatorSessionPage } from '../pages'

test.describe('Meeting Join', () => {
  test.describe('Join Page UI', () => {
    test('displays join form with all elements', async ({ page }) => {
      const joinPage = new JoinMeetingPage(page)
      await joinPage.goto()

      await expect(page.getByRole('heading', { name: 'Join a Meeting' })).toBeVisible()
      await expect(joinPage.codeInput).toBeVisible()
      await expect(joinPage.nameInput).toBeVisible()
      await expect(joinPage.joinButton).toBeVisible()
      await expect(joinPage.backToHomeLink).toBeVisible()
    })

    test('code input converts to uppercase', async ({ page }) => {
      const joinPage = new JoinMeetingPage(page)
      await joinPage.goto()

      await joinPage.codeInput.fill('abc123')
      await expect(joinPage.codeInput).toHaveValue('ABC123')
    })

    test('code input removes non-alphanumeric characters', async ({ page }) => {
      const joinPage = new JoinMeetingPage(page)
      await joinPage.goto()

      // Type characters one by one to trigger onChange properly
      await joinPage.codeInput.pressSequentially('ABC-123!')
      await expect(joinPage.codeInput).toHaveValue('ABC123')
    })

    test('button is disabled for invalid code length', async ({ page }) => {
      const joinPage = new JoinMeetingPage(page)
      await joinPage.goto()

      await joinPage.codeInput.fill('ABC')
      await joinPage.nameInput.fill('Test User')

      // Button should be disabled when code is incomplete
      await expect(joinPage.joinButton).toBeDisabled()
    })

    test('button is disabled when name is missing', async ({ page }) => {
      const joinPage = new JoinMeetingPage(page)
      await joinPage.goto()

      await joinPage.codeInput.fill('ABC123')
      // Don't fill name

      // Button should be disabled when name is empty
      await expect(joinPage.joinButton).toBeDisabled()
    })


    test('navigates back to home', async ({ page }) => {
      const joinPage = new JoinMeetingPage(page)
      await joinPage.goto()

      await joinPage.backToHomeLink.click()
      await expect(page).toHaveURL('/')
    })

    test('shows sign in link for unauthenticated users', async ({ page }) => {
      const joinPage = new JoinMeetingPage(page)
      await joinPage.goto()

      await expect(joinPage.signInLink).toBeVisible()
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

    test('pre-fills code from URL', async ({ page }) => {
      const joinPage = new JoinMeetingPage(page)
      await joinPage.goto(participantCode)

      await expect(joinPage.codeInput).toHaveValue(participantCode)
    })

    test('shows meeting found message for valid code', async ({ page }) => {
      const joinPage = new JoinMeetingPage(page)
      await joinPage.goto(participantCode)

      await expect(joinPage.meetingFoundMessage).toBeVisible()
      await expect(joinPage.meetingFoundMessage).toContainText('Join Test Meeting')
    })

    test('auto-fills name from authenticated user profile', async ({ page }) => {
      const joinPage = new JoinMeetingPage(page)
      await joinPage.goto(participantCode)

      // Wait for name to be auto-filled from user profile (may take a moment to load)
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

    test('successfully joins meeting and redirects to session', async ({ browser }) => {
      // Use a new context without auth state
      const context = await browser.newContext()
      const page = await context.newPage()

      const joinPage = new JoinMeetingPage(page)
      await joinPage.goto()

      await joinPage.joinMeeting(participantCode, 'Test Participant')

      await expect(page).toHaveURL(`/session/${participantCode}`)
      await expect(page.getByText('Joined as Test Participant')).toBeVisible()

      await context.close()
    })

    test('shows error for invalid meeting code', async ({ page }) => {
      const joinPage = new JoinMeetingPage(page)
      await joinPage.goto()

      await joinPage.joinMeeting('XXXXXX', 'Test User')

      await expect(joinPage.errorMessage).toBeVisible()
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
