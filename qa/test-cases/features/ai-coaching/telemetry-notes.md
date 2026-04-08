# AI Coaching — Telemetry Notes

## Events

| Событие | Поля |
|---------|------|
| `ai_coaching_request` | habits_count, model |
| `ai_coaching_response` | model, latency_ms, token_count |
| `ai_coaching_error` | error_type, model |
| `experiment_exposure` | experiment: ai_model |

## Notes

- Claude API вызов: через Supabase edge function (Firebase Auth ID token в header)
- Модель: Firebase Remote Config `ai_model` → claude-haiku-4-5 / claude-sonnet-4-6
- Latency цель: Haiku < 3 сек; Sonnet < 8 сек
