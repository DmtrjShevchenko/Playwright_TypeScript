---
name: debug-failing-test
description: Diagnose a failing or flaky Playwright test in this project (locally or in GitHub Actions) using traces, screenshots and the HTML report, then fix the root cause. Use when a test is red, flaky, or CI failed.
---

# Розібрати падіння тесту

1. **Відтвори локально**: `npx playwright test <file>:<line> --project=<ui|api> --retries=0`.
   Флакі? `--repeat-each=5 --workers=1`.
2. **Подивись артефакти**: `test-results/<test>/trace.zip` → `npx playwright show-trace <path>`;
   скріншот/відео там же; загальний звіт — `npm run report`.
   У CI: артефакти `playwright-report` (завжди) і `test-results` (тільки при падінні) на сторінці run'у.
3. **Класифікуй причину**:
   - змінився локатор/текст на сайті → оновити Page Object / `ERRORS`;
   - гонка (assert до появи стану) → замінити на web-first `expect(...).toHave...`;
   - залежність між тестами / спільні дані → ізолювати;
   - зовнішній сервіс недоступний (5xx, таймаут Heroku) → не "лагодити" тест, зафіксувати в worklog;
   - реальний баг продукту → залишити тест червоним або `test.fail()` з коментарем і посиланням.
4. **Не можна**: збільшувати таймаути навмання, додавати `waitForTimeout`, послаблювати assertion, щоб "позеленіло".
5. Після фіксу — прогін 3+ разів, запис у `.claude/AI_WORKLOG.md` (симптом → причина → фікс).
