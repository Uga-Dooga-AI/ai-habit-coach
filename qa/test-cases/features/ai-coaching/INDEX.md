# Feature Pack: AI Coaching

## Описание

Claude LLM (Haiku/Sonnet) через Supabase edge function. Персонализированные советы по привычкам. Модель выбирается через Firebase Remote Config.

## Файлы пака

- `happy-path.md` — запрос совета, ответ Claude, персонализация
- `edge-cases.md` — timeout, offline, смена модели через Remote Config
- `telemetry-notes.md`

## Риск-уровень

**Средний.** Зависит от внешнего LLM API (latency/rate limits). Firebase Remote Config определяет модель.

## Platform note

- Claude Haiku: быстрее/дешевле — для мобильного UX
- Claude Sonnet: качественнее — для premium tier (если разделение есть)
- Remote Config key: `ai_model` (claude-haiku-* / claude-sonnet-*)
