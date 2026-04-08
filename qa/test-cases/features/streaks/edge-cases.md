# Streaks — Edge Cases

---

## STR-EC-01 — Пропуск дня → стрик сбрасывается (per-habit)

## STR-EC-02 — Timezone change → стрик пересчитывается корректно

## STR-EC-03 — Midnight rollover: 23:59 и 00:01 → разные дни; стрик не сбрасывается

## STR-EC-04 — Push permission отозван → нет краша; push не приходит

## STR-EC-05 — Несколько привычек: у каждой свой стрик

## Evidence

- Logs:
