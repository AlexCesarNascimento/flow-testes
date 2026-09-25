import { test, expect } from '@playwright/test';
import { AppPage } from './pom/AppPage.js';

const NAV_SECTIONS = [
  'Visão geral',
  'Recorder',
  'Flows',
  'Ações',
  'Dados',
  'Dispositivos',
  'Execuções',
  'Matriz',
] as const;

test.describe('Navegação global', () => {
  test('protótipo carrega sem erros JavaScript', async ({ page }) => {
    const app = new AppPage(page);
    const errors = app.captureErrors();
    await app.goto();
    await expect(page.getByText('FlowTest')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('sidebar exibe todas as seções de navegação', async ({ page }) => {
    const app = new AppPage(page);
    await app.goto();
    for (const section of NAV_SECTIONS) {
      await expect(page.getByText(section).first()).toBeVisible();
    }
  });

  test('Visão geral renderiza cards de início rápido', async ({ page }) => {
    const app = new AppPage(page);
    await app.goto();
    await app.navigateTo('Visão geral');
    await expect(page.getByText('Recorder')).toBeVisible();
    await expect(page.getByText('Flows')).toBeVisible();
  });

  test('Recorder renderiza painel de dispositivo', async ({ page }) => {
    const app = new AppPage(page);
    await app.goto();
    await app.navigateTo('Recorder');
    await expect(page.getByText('Recorder').first()).toBeVisible();
    await expect(app.buttons.first()).toBeVisible();
  });

  test('Flows renderiza paleta de blocos', async ({ page }) => {
    const app = new AppPage(page);
    await app.goto();
    await app.navigateTo('Flows');
    await expect(page.getByText('Flows').first()).toBeVisible();
  });

  test('Dados exibe abas de dataset', async ({ page }) => {
    const app = new AppPage(page);
    await app.goto();
    await app.navigateTo('Dados');
    await expect(page.getByText('Dados')).toBeVisible();
    await expect(page.getByText('Datasets').first()).toBeVisible();
  });

  test('página tem pelo menos um botão visível em toda seção', async ({
    page,
  }) => {
    const app = new AppPage(page);
    await app.goto();
    for (const section of ['Visão geral', 'Recorder', 'Flows', 'Dados']) {
      await app.navigateTo(section);
      await expect(app.buttons.first()).toBeVisible();
    }
  });
});
