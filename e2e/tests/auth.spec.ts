import { test, expect } from '@playwright/test'
import { LoginPage, SignupPage, HomePage } from '../pages'

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('displays form elements and validates input', async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.goto()

      // Original: displays login form with all elements
      await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()
      await expect(loginPage.emailInput).toBeVisible()
      await expect(loginPage.passwordInput).toBeVisible()
      await expect(loginPage.signInButton).toBeVisible()
      await expect(loginPage.googleButton).toBeVisible()
      await expect(loginPage.signUpLink).toBeVisible()
      await expect(loginPage.backToHomeLink).toBeVisible()

      // Original: shows validation error for empty email
      await loginPage.emailInput.focus()
      await loginPage.emailInput.blur()
      await expect(page.getByText('Email is required')).toBeVisible()

      // Original: shows validation error for invalid email format
      await loginPage.emailInput.fill('invalid-email')
      await loginPage.emailInput.blur()
      await expect(page.getByText('Please enter a valid email address')).toBeVisible()

      // Original: shows validation error for empty password
      await loginPage.passwordInput.focus()
      await loginPage.passwordInput.blur()
      await expect(page.getByText('Password is required')).toBeVisible()
    })

    test('successful login redirects to home', async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.goto()

      const password = process.env.TEST_USER_PASSWORD
      if (!password) throw new Error('TEST_USER_PASSWORD required')

      await loginPage.login('user1@example.com', password)
      await expect(page).toHaveURL('/')
    })

    test('shows error for invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.goto()

      await loginPage.login('user1@example.com', 'wrongpassword')
      await expect(loginPage.errorMessage).toBeVisible()
    })

    test('redirects to specified page after login', async ({ page }) => {
      const password = process.env.TEST_USER_PASSWORD
      if (!password) throw new Error('TEST_USER_PASSWORD required')

      await page.goto('/login?redirect=/create')
      const loginPage = new LoginPage(page)

      await loginPage.login('user1@example.com', password)
      await expect(page).toHaveURL('/create')
    })

    test('navigation links work correctly', async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.goto()

      // Original: navigates to signup page
      await loginPage.signUpLink.click()
      await expect(page).toHaveURL(/\/signup/)

      // Original: navigates back to home
      await loginPage.goto()
      await loginPage.backToHomeLink.click()
      await expect(page).toHaveURL('/')
    })
  })

  test.describe('Signup Page', () => {
    test('displays form elements and validates input', async ({ page }) => {
      const signupPage = new SignupPage(page)
      await signupPage.goto()

      // Original: displays signup form with all elements
      await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible()
      await expect(signupPage.nameInput).toBeVisible()
      await expect(signupPage.emailInput).toBeVisible()
      await expect(signupPage.passwordInput).toBeVisible()
      await expect(signupPage.confirmPasswordInput).toBeVisible()
      await expect(signupPage.signUpButton).toBeVisible()
      await expect(signupPage.googleButton).toBeVisible()
      await expect(signupPage.signInLink).toBeVisible()

      // Original: shows validation error for short name
      await signupPage.nameInput.fill('A')
      await signupPage.nameInput.blur()
      await expect(page.getByText('Name must be at least 2 characters')).toBeVisible()

      // Original: shows validation error for short password
      await signupPage.passwordInput.fill('12345')
      await signupPage.passwordInput.blur()
      await expect(page.getByText('Password must be at least 6 characters')).toBeVisible()

      // Original: shows validation error for mismatched passwords
      await signupPage.passwordInput.fill('password123')
      await signupPage.confirmPasswordInput.fill('differentpassword')
      await signupPage.confirmPasswordInput.blur()
      await expect(page.getByText('Passwords do not match')).toBeVisible()
    })

    test('navigates to login page', async ({ page }) => {
      const signupPage = new SignupPage(page)
      await signupPage.goto()

      await signupPage.signInLink.click()
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Authenticated User', () => {
    test('can access authenticated pages and sees correct home state', async ({ browser }) => {
      const context = await browser.newContext({
        storageState: 'e2e/.auth/user1.json'
      })
      const page = await context.newPage()

      // Original: home page does not show sign in required text
      const homePage = new HomePage(page)
      await homePage.goto()
      await expect(homePage.signInRequiredText).not.toBeVisible()

      // Original: can access create meeting page when authenticated
      await page.goto('/create')
      await expect(page.getByRole('heading', { name: 'Create a Meeting' })).toBeVisible()

      await context.close()
    })
  })

  test.describe('Unauthenticated User', () => {
    test('is restricted from authenticated pages', async ({ page }) => {
      // Original: home page shows sign in required text
      const homePage = new HomePage(page)
      await homePage.goto()
      await expect(homePage.signInRequiredText).toBeVisible()

      // Original: redirects to login when accessing create meeting page
      await page.goto('/create')
      await expect(page).toHaveURL(/\/login\?redirect=/)
    })
  })
})
