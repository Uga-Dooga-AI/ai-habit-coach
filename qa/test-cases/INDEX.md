# AI Habit Formation Coach — Test Case Index

## Ownership

- Product: AI Habit Formation Coach (Expo / React Native)
- Test Design Owner: QA Specialist
- QA Execution Owner: QA Specialist
- QA Automation Owner: не назначен
- Release Gate Owner: Director of Quality & Testing

## Surfaces

- iOS: Expo / React Native
- Android: Expo / React Native

## Suites

- Smoke: `qa/test-cases/smoke/`
  - `app-startup.md` — boot, auth bootstrap, analytics init
  - `critical-paths.md` — вход, создание привычки, трекинг, AI коуч, paywall
- Feature packs: `qa/test-cases/features/`
  - `auth/` — Firebase Auth (email, OAuth), sign-out
  - `habit-creation/` — создание, редактирование, удаление привычки
  - `habit-tracking/` — отметка выполнения, история, локальное хранение (SQLite)
  - `streaks/` — стрики, ачивки, уведомления, таймзоны
  - `ai-coaching/` — Claude AI (Haiku/Sonnet), персонализированные советы, Remote Config
  - `paywall/` — trial, RevenueCat, premium gates, покупка/восстановление
  - `analytics/` — Firebase Analytics, AppMetrica, эксперименты
- Regression: `qa/test-cases/regression/`
- Fixtures: `qa/test-cases/fixtures/`

## Release-critical flows

- Авторизация (Firebase Auth)
- Создание и трекинг привычки
- AI coaching response (Claude via Supabase edge function)
- Paywall → RevenueCat покупка
- Streak уведомления

## Current review-mode path

- Test accounts: см. `fixtures/accounts.md`
- Firebase Auth: email/password для test accounts
- RevenueCat sandbox: Xcode sandbox или Google Play test

## Notes

- AI coaching: Claude Haiku/Sonnet — модель выбирается через Firebase Remote Config
- Firebase Auth (не Supabase Auth как у Soul Journal — другой auth провайдер)
- Supabase используется только для хранения данных (не auth)
- Android notification channels: "Streak reminders", "Achievements"
