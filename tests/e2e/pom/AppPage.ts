import type { Page, Locator } from '@playwright/test';

/**
 * Page Object Model para o protótipo FlowTest.
 * Abstrai seletores e ações comuns de navegação.
 */
export class AppPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
  }

  /** Navega para uma seção clicando no item da sidebar pelo texto exato. */
  async navigateTo(label: string) {
    await this.page.getByText(label, { exact: true }).first().click();
  }

  /** Verifica se o texto principal da página está visível. */
  async hasHeading(text: string | RegExp): Promise<boolean> {
    return this.page.getByText(text).first().isVisible();
  }

  /** Retorna todos os botões visíveis na página. */
  get buttons(): Locator {
    return this.page.getByRole('button');
  }

  /** Retorna erros JS capturados durante a navegação. */
  captureErrors(): string[] {
    const errors: string[] = [];
    this.page.on('pageerror', (e) => errors.push(e.message));
    return errors;
  }
}
