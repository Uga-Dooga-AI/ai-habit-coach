# Analytics — Edge Cases

---

## ANA-EC-01 — AppMetrica без credentials → graceful degradation; Firebase продолжает работать

## ANA-EC-02 — Firebase без config → app работает без analytics; нет краша

## ANA-EC-03 — Double event firing (двойной тап) → `habit_completed` ровно 1 раз

## ANA-EC-04 — Events offline → буферизируются; отправляются при восстановлении сети

## Evidence

- Logs:
