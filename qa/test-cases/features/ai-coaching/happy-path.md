# AI Coaching — Happy Path

---

## AIC-HP-01 — Запрос совета от AI Coach

**Starting state:** авторизован, есть 1+ привычек  
**Шаги:** открыть AI Coach tab/section → запросить совет  
**Expected:** Claude ответ возвращается (< 10 сек для Haiku); текст отображается без краша  
**Analytics:** `ai_coaching_request`, `ai_coaching_response` (model, latency_ms)

---

## AIC-HP-02 — Персонализация по привычкам

**Starting state:** несколько привычек с разными типами  
**Expected:** совет релевантен конкретным привычкам пользователя (не generic)

---

## AIC-HP-03 — Смена модели через Remote Config (Haiku → Sonnet)

**Шаги:** изменить Remote Config `ai_model` → перезапустить app  
**Expected:** новая модель используется; `experiment_exposure` event; качество ответов улучшилось

---

## AIC-HP-04 — История советов

**Expected:** предыдущие советы доступны в chat history (если реализовано)

## Evidence

- Screenshots:
- Response latency:
- Model used:
