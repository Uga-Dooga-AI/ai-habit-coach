# Analytics — Happy Path

---

## ANA-HP-01 — Firebase bootstrap

**Expected:** Firebase Analytics инициализирован; нет ошибок в console

---

## ANA-HP-02 — Screen view tracking

**Expected:** `screen_view` для Home, Progress, Insights, Settings

---

## ANA-HP-03 — Experiment exposure

**Expected:** `experiment_exposure` при первом открытии paywall или onboarding с A/B variant

---

## ANA-HP-04 — AppMetrica init (если credentials)

**Expected:** AppMetrica инициализирован; события попадают в обоих провайдеров через composite tracker

## Evidence

- Logs:
