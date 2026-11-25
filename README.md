# Playwright + TypeScript: SauceDemo UI & Restful Booker API

[![Playwright Tests](../../actions/workflows/playwright.yml/badge.svg)](../../actions/workflows/playwright.yml)

| Набір | Ціль | Тести |
|---|---|---|
| UI | https://www.saucedemo.com (`standard_user`) | логін, каталог, сортування, кошик, чекаут + 3 негативні |
| API | https://restful-booker.herokuapp.com | auth → create → update → delete → 404 + 3 негативні |

## Запуск

```bash
npm ci
npx playwright install chromium
npm test            # усе
npm run test:ui     # тільки UI
npm run test:api    # тільки API
npx playwright test --grep @negative
npm run report      # HTML-звіт
```

## CI
GitHub Actions (`.github/workflows/playwright.yml`) запускається на кожен push і PR.
HTML-звіт — артефакт `playwright-report` на сторінці run'у; при падінні додатково `test-results` з trace.

## Робота з AI-агентом
Все, що стосується агента, лежить у [`.claude/`](.claude):
- [`CLAUDE.md`](.claude/CLAUDE.md) — інструкції та правила проєкту
- [`skills/`](.claude/skills) — скіли: `add-ui-test`, `add-api-test`, `debug-failing-test`
- [`prompts/PROMPTS.md`](.claude/prompts/PROMPTS.md) — ключові промпти
- [`AI_WORKLOG.md`](.claude/AI_WORKLOG.md) — журнал роботи агента
