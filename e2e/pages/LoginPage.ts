import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly signInButton: Locator
  readonly googleButton: Locator
  readonly signUpLink: Locator
  readonly backToHomeLink: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.getByLabel('Email')
    this.passwordInput = page.getByLabel('Password')
    this.signInButton = page.getByRole('button', { name: 'Sign In' })
    this.googleButton = page.getByRole('button', { name: /Continue with Google/i })
    this.signUpLink = page.getByRole('link', { name: 'Sign up' })
    this.backToHomeLink = page.getByRole('link', { name: /Back to Home/i })
    this.errorMessage = page.getByRole('alert')
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.signInButton.click()
  }
}
