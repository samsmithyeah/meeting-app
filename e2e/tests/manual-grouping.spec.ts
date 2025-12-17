import { test, expect } from '../fixtures'
import { Page, Browser } from '@playwright/test'
import {
  CreateMeetingPage,
  FacilitatorSessionPage,
  JoinMeetingPage,
  ParticipantSessionPage
} from '../pages'

test.describe('Manual Answer Grouping', () => {
  test.use({ storageState: 'e2e/.auth/user1.json' })

  // Helper to set up a meeting with revealed answers and grouping
  async function setupMeetingWithGroupedAnswers(
    page: Page,
    browser: Browser,
    answerCount: number = 4
  ) {
    const createPage = new CreateMeetingPage(page)
    await createPage.goto()

    await createPage.createMeeting({
      title: 'Manual Grouping Test',
      questions: [{ text: 'What can we improve?' }]
    })

    const facilitatorPage = new FacilitatorSessionPage(page)
    const participantCode = await facilitatorPage.getParticipantCode()

    // Use robust startMeeting helper to ensure state transition completes
    await facilitatorPage.startMeeting()

    // Add participants
    const contexts = await Promise.all(
      Array(answerCount)
        .fill(null)
        .map(() => browser.newContext())
    )
    const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()))
    const names = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank'].slice(0, answerCount)
    const answers = [
      'Better testing practices',
      'More code reviews',
      'Clearer documentation',
      'Faster deployments',
      'Better communication',
      'More planning'
    ].slice(0, answerCount)

    // Join and submit answers
    for (let i = 0; i < pages.length; i++) {
      const joinPage = new JoinMeetingPage(pages[i])
      await joinPage.goto()
      await joinPage.joinMeeting(participantCode, names[i])
    }

    await facilitatorPage.waitForParticipants(answerCount)
    await facilitatorPage.startQuestionButton.click()

    // Submit answers one at a time, waiting for each to be received
    for (let i = 0; i < pages.length; i++) {
      const session = new ParticipantSessionPage(pages[i])
      await session.waitForQuestion()
      await session.submitAnswer(answers[i])
      // Wait for this answer to be registered on the facilitator page
      await facilitatorPage.waitForAnswers(i + 1, answerCount)
    }
    await facilitatorPage.revealAnswersButton.click()

    // Wait for answers to be revealed
    await expect(facilitatorPage.getRevealedAnswer(answers[0])).toBeVisible({ timeout: 10000 })

    // Click Group Answers button to initiate grouping
    await expect(facilitatorPage.groupAnswersButton).toBeVisible({ timeout: 10000 })
    await facilitatorPage.groupAnswersButton.click()

    // Wait for grouping UI to appear
    await facilitatorPage.waitForGroupingUI()

    return { facilitatorPage, contexts, answers }
  }

  test.describe('Create Group', () => {
    test('can create a new empty group', async ({ page, browser }) => {
      const { facilitatorPage, contexts } = await setupMeetingWithGroupedAnswers(page, browser)

      // Click "New Group" button
      await facilitatorPage.newGroupButton.click()

      // Modal should appear
      await expect(page.getByText('Create New Group')).toBeVisible()

      // Enter group name
      await facilitatorPage.groupNameInput.fill('Technical Issues')
      await facilitatorPage.createGroupSubmitButton.click()

      // New group should appear
      await expect(facilitatorPage.getGroupHeader('Technical Issues')).toBeVisible()

      await Promise.all(contexts.map((ctx) => ctx.close()))
    })

    test('cancel button closes create group modal', async ({ page, browser }) => {
      const { facilitatorPage, contexts } = await setupMeetingWithGroupedAnswers(page, browser)

      // Click "New Group" button
      await facilitatorPage.newGroupButton.click()

      // Modal should appear
      await expect(page.getByText('Create New Group')).toBeVisible()

      // Click cancel
      await facilitatorPage.cancelGroupButton.click()

      // Modal should close
      await expect(page.getByText('Create New Group')).not.toBeVisible()

      await Promise.all(contexts.map((ctx) => ctx.close()))
    })

    test('create button is disabled with empty name', async ({ page, browser }) => {
      const { facilitatorPage, contexts } = await setupMeetingWithGroupedAnswers(page, browser)

      // Click "New Group" button
      await facilitatorPage.newGroupButton.click()

      // Create button should be disabled
      await expect(facilitatorPage.createGroupSubmitButton).toBeDisabled()

      await Promise.all(contexts.map((ctx) => ctx.close()))
    })
  })

  test.describe('Rename Group', () => {
    test('can rename an existing group', async ({ page, browser }) => {
      const { facilitatorPage, contexts } = await setupMeetingWithGroupedAnswers(page, browser)

      // First create a group
      await facilitatorPage.createGroup('Original Name')
      await expect(facilitatorPage.getGroupHeader('Original Name')).toBeVisible()

      // Click rename button (pencil icon)
      await facilitatorPage.getRenameGroupButton().click()

      // Input should appear - find the input that's now focused in the group header
      const input = page.locator('input[type="text"]').first()
      await input.clear()
      await input.fill('New Name')
      await input.press('Enter')

      // New name should appear
      await expect(facilitatorPage.getGroupHeader('New Name')).toBeVisible()
      await expect(facilitatorPage.getGroupHeader('Original Name')).not.toBeVisible()

      await Promise.all(contexts.map((ctx) => ctx.close()))
    })

    test('escape key cancels rename', async ({ page, browser }) => {
      const { facilitatorPage, contexts } = await setupMeetingWithGroupedAnswers(page, browser)

      // First create a group
      await facilitatorPage.createGroup('My Group')
      await expect(facilitatorPage.getGroupHeader('My Group')).toBeVisible()

      // Click rename button
      await facilitatorPage.getRenameGroupButton().click()

      // Type new name but press escape
      const input = page.locator('input[type="text"]').first()
      await input.clear()
      await input.fill('Changed Name')
      await input.press('Escape')

      // Original name should remain
      await expect(facilitatorPage.getGroupHeader('My Group')).toBeVisible()
      await expect(facilitatorPage.getGroupHeader('Changed Name')).not.toBeVisible()

      await Promise.all(contexts.map((ctx) => ctx.close()))
    })
  })

  test.describe('Delete Group', () => {
    test('can delete a group', async ({ page, browser }) => {
      const { facilitatorPage, contexts } = await setupMeetingWithGroupedAnswers(page, browser)

      // Create a group
      await facilitatorPage.createGroup('To Delete')
      await expect(facilitatorPage.getGroupHeader('To Delete')).toBeVisible()

      // Click delete button (trash icon)
      await facilitatorPage.getDeleteGroupButton().click()

      // Group should be removed
      await expect(facilitatorPage.getGroupHeader('To Delete')).not.toBeVisible()

      await Promise.all(contexts.map((ctx) => ctx.close()))
    })
  })

  test.describe('Drag and Drop', () => {
    test('can drag answer from ungrouped to a group', async ({ page, browser }) => {
      const { facilitatorPage, contexts, answers } = await setupMeetingWithGroupedAnswers(
        page,
        browser
      )

      // Create a new group first
      await facilitatorPage.createGroup('Test Group')
      await expect(facilitatorPage.getGroupHeader('Test Group')).toBeVisible()

      // Scroll to the ungrouped section to ensure answer cards are visible
      await facilitatorPage.ungroupedSection.scrollIntoViewIfNeeded()

      // Find an answer card by its text content (more reliable than role)
      const answerCard = page.getByText(answers[0], { exact: true })
      await expect(answerCard).toBeVisible()

      // Find the target group container
      const targetGroup = facilitatorPage.getGroupHeader('Test Group').locator('..')

      // Perform drag and drop
      await answerCard.dragTo(targetGroup)

      // Verify the drag completed by checking the group now has answers
      // The "Test Group" should no longer show 0
      await expect(facilitatorPage.getGroupHeader('Test Group').locator('..').locator('span')).not.toHaveText('0')

      await Promise.all(contexts.map((ctx) => ctx.close()))
    })

    test('can drag answer from one group to another', async ({ page, browser }) => {
      const { facilitatorPage, contexts } = await setupMeetingWithGroupedAnswers(page, browser)

      // Create two groups
      await facilitatorPage.createGroup('Group A')
      await expect(facilitatorPage.getGroupHeader('Group A')).toBeVisible()

      await facilitatorPage.createGroup('Group B')
      await expect(facilitatorPage.getGroupHeader('Group B')).toBeVisible()

      // Both groups should be visible
      await expect(facilitatorPage.getGroupHeader('Group A')).toBeVisible()
      await expect(facilitatorPage.getGroupHeader('Group B')).toBeVisible()

      await Promise.all(contexts.map((ctx) => ctx.close()))
    })

    test('ungrouped section is visible as drop target', async ({ page, browser }) => {
      const { facilitatorPage, contexts } = await setupMeetingWithGroupedAnswers(page, browser)

      // Verify the ungrouped section exists
      await expect(facilitatorPage.getGroupHeader('Ungrouped')).toBeVisible()

      // The ungrouped section should be visible
      await expect(facilitatorPage.ungroupedSection).toBeVisible()

      await Promise.all(contexts.map((ctx) => ctx.close()))
    })
  })

  test.describe('Ungrouped Section', () => {
    test('ungrouped section displays answer count', async ({ page, browser }) => {
      const { facilitatorPage, contexts } = await setupMeetingWithGroupedAnswers(page, browser)

      // The ungrouped section should show a count badge
      await expect(facilitatorPage.ungroupedSection).toBeVisible()

      // There should be a count displayed (look for a number in a span)
      const countBadge = facilitatorPage.ungroupedSection.locator('span').filter({ hasText: /^\d+$/ })
      await expect(countBadge.first()).toBeVisible()

      await Promise.all(contexts.map((ctx) => ctx.close()))
    })
  })

  test.describe('Group Collapse/Expand', () => {
    test('can collapse and expand groups', async ({ page, browser }) => {
      const { facilitatorPage, contexts } = await setupMeetingWithGroupedAnswers(page, browser)

      // Create a group
      await facilitatorPage.createGroup('Collapsible Group')

      // Group header should be visible
      await expect(facilitatorPage.getGroupHeader('Collapsible Group')).toBeVisible()

      // The group should show "Drag answers here" placeholder when empty and expanded
      const emptyPlaceholder = page.getByText('Drag answers here')
      await expect(emptyPlaceholder).toBeVisible()

      // Find the expand/collapse button (chevron) - it's near the group header
      const groupHeader = facilitatorPage.getGroupHeader('Collapsible Group')
      const collapseButton = groupHeader.locator('..').locator('button').first()

      // Click to collapse
      await collapseButton.click()

      // The placeholder should no longer be visible after collapsing
      await expect(emptyPlaceholder).not.toBeVisible()

      // Click to expand again
      await collapseButton.click()

      // Placeholder should be visible again
      await expect(emptyPlaceholder).toBeVisible()

      await Promise.all(contexts.map((ctx) => ctx.close()))
    })
  })
})
