# Paywall — Telemetry Notes

## Events

| Событие | Поля |
|---------|------|
| `trial_started` | source |
| `trial_expired` | converted |
| `paywall_viewed` | source, variant, offering_id |
| `paywall_dismissed` | time_spent_sec, dismiss_method |
| `purchase_initiated` | product_id, plan |
| `purchase_completed` | product_id, plan |
| `purchase_failed` | reason |
| `subscription_started` | plan, is_trial_conversion |
| `subscription_cancelled` | plan |
| `subscription_restored` | plan |
| `experiment_exposure` | experiment: paywall_cta_variant \| paywall_price_display \| nudge_style |

## AppMetrica revenue

- `revenue_received` → AppMetrica (если credentials настроены)
