# Full Regression Pack — AI Habit Formation Coach

## Когда запускать

- RC, production release, изменения auth/Firebase/RevenueCat, AI coaching changes

## Checklist

### Bootstrap
- [ ] Cold start без сессии → auth
- [ ] Cold start с сессией → Home
- [ ] Firebase Analytics инициализирован

### Auth
- [ ] Email sign-in / sign-up
- [ ] Sign out; identity cleared

### Onboarding
- [ ] Habits selection
- [ ] Reminders setup
- [ ] A/B variant: `experiment_exposure` (onboarding_variant)

### Habit Creation
- [ ] Создать привычку всех типов
- [ ] Редактировать привычку
- [ ] Удалить привычку с tracking историей

### Habit Tracking
- [ ] Отметить выполнение 5 привычек
- [ ] Offline tracking → sync
- [ ] Calendar view в Progress

### Streaks & Achievements
- [ ] Стрик растёт при ежедневном выполнении
- [ ] Стрик сбрасывается при пропуске
- [ ] Achievement unlock + notification
- [ ] Push reminder (Android notification channel "Streak reminders")

### AI Coaching
- [ ] Запрос совета (Haiku)
- [ ] Remote Config смена модели (если доступен)
- [ ] Timeout handling

### Paywall
- [ ] Trial активен при sign-up
- [ ] Gate enforcement для free-tier
- [ ] RevenueCat sandbox purchase
- [ ] Restore purchases
- [ ] A/B: `paywall_cta_variant`, `paywall_price_display`

### Analytics
- [ ] `experiment_exposure` для всех A/B
- [ ] `habit_completed`, `ai_coaching_response` в логах
- [ ] AppMetrica (если credentials)

### Platform
- [ ] iOS: safe area, dark mode
- [ ] Android: back button, notification channels

## Pass summary

- Surface:
- Build:
- Owner:
- Дата:
- Результат:
