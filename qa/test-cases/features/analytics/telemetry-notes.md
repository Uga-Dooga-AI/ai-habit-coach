# Analytics — Telemetry Notes

## Event inventory

### App lifecycle
`screen_view`, `app_open`, `app_state_changed`

### Auth
`auth_state_changed` (SIGNED_IN / SIGNED_OUT)

### Onboarding
`onboarding_step_viewed`, `onboarding_completed`  
`experiment_exposure` (experiment: `onboarding_variant`)

### Habits
`habit_created`, `habit_updated`, `habit_deleted`  
`habit_completed`, `habit_skipped`

### Streaks
`achievement_unlocked`, `streak_reminder_sent`, `streak_broken`

### AI Coaching
`ai_coaching_request`, `ai_coaching_response`, `ai_coaching_error`  
`experiment_exposure` (experiment: `ai_model`)

### Paywall
`trial_started`, `trial_expired`, `paywall_viewed`, `paywall_dismissed`  
`purchase_initiated`, `purchase_completed`, `purchase_failed`  
`subscription_started`, `subscription_cancelled`, `subscription_restored`  
`experiment_exposure` (experiment: `paywall_cta_variant | paywall_price_display | nudge_style`)

### Sync
`sync_started`, `sync_completed`, `sync_failed`

## Composite tracker pattern

Firebase Analytics + AppMetrica принимают те же события через единый composite tracker.  
При отсутствии AppMetrica credentials: только Firebase.

## Remote Config experiments

| Experiment key | Варианты |
|---------------|---------|
| `onboarding_variant` | A/B |
| `ai_model` | claude-haiku-4-5 / claude-sonnet-4-6 |
| `paywall_cta_variant` | control / variant_a / variant_b |
| `paywall_price_display` | monthly_first / annual_first |
| `nudge_style` | gentle / motivational |

## Deferred

- Live Firebase Console, AppMetrica дашборд — отложены
- В core preview: metro / logcat console
