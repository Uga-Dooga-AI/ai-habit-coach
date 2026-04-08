# Smoke — App Startup

## Entry points

- Build: dev build или TestFlight / Android Internal Testing
- Surface: iOS Simulator + Android Emulator
- Starting state: нет активной сессии

## Smoke cases

### SC-BOOT-01 — Холодный старт без сессии

**Expected:** auth экран без краша; Firebase Auth инициализирован

---

### SC-BOOT-02 — Холодный старт с сессией

**Expected:** Home/Habits tab; пользователь не выброшен на auth

---

### SC-BOOT-03 — Firebase Analytics bootstrap

**Expected:** Firebase Analytics инициализирован; нет `FirebaseApp not configured` в логах

---

### SC-BOOT-04 — Навигация по вкладкам (5 tabs)

**Шаги:** войти → убедиться в наличии Home, Explore, Progress, Insights, Settings  
**Expected:** все 5 вкладок доступны без краша

---

### SC-BOOT-05 — AppMetrica init (если credentials настроены)

**Expected:** AppMetrica инициализирован; если нет — graceful degradation без краша

## Evidence

- Logs:
- Прогон на: [ ] iOS Simulator  [ ] Android Emulator
