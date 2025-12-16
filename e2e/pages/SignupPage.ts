import { Page, Locator } from '@playwright/test'

export class SignupPage {
  readonly page: Page
  readonly nameInput: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly confirmPasswordInput: Locator
  readonly signUpButton: Locator
  readonly googleButton: Locator
  readonly signInLink: Locator
  readonly backToHomeLink: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.nameInput = page.getByLabel('Full Name')
    this.emailInput = page.getByLabel('Email')
    this.passwordInput = page.getByLabel('Password', { exact: true })
    this.confirmPasswordInput = page.getByLabel('Confirm Password')
    this.signUpButton = page.getByRole('button', { name: 'Create Account' })
    this.googleButton = page.getByRole('button', { name: /Continue with Google/i })
    this.signInLink = page.getByRole('link', { name: 'Sign in' })
    this.backToHomeLink = page.getByRole('link', { name: /Back to Home/i })
    this.errorMessage = page.getByRole('alert')
  }

  async goto() {
    await this.page.goto('/signup')
  }

  async signup(name: string, email: string, password: string, confirmPassword?: string) {
    await this.nameInput.fill(name)
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.confirmPasswordInput.fill(confirmPassword ?? password)
    await this.signUpButton.click()
  }
}
