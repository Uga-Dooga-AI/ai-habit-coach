# Smoke — Critical Paths

## Entry points

- Surface: iOS Simulator (primary) + Android Emulator
- Starting state: test-аккаунт из `fixtures/accounts.md`

## Cases

### SC-CP-01 — Вход (email/password через Firebase Auth)

**Expected:** Home tab; Firebase session активна  
**Analytics:** `auth_state_changed`

---

### SC-CP-02 — Создание привычки

**Шаги:** Habits tab → Add Habit → выбрать тип → Save  
**Expected:** привычка появилась в списке; сохранена в SQLite  
**Analytics:** `habit_created`

---

### SC-CP-03 — Отметка выполнения привычки

**Шаги:** тапнуть checkbox на привычке  
**Expected:** отмечена; streak +1 (если первый раз сегодня)  
**Analytics:** `habit_completed`

---

### SC-CP-04 — AI Coaching (Claude)

**Шаги:** открыть AI Coach → запросить совет  
**Expected:** Claude ответ возвращается; нет timeout/краша  
**Analytics:** `ai_coaching_request`, `ai_coaching_response`

---

### SC-CP-05 — Paywall gate (free-tier)

**Шаги:** попытаться открыть premium habit или advanced insights  
**Expected:** paywall modal; `paywall_viewed` event

---

### SC-CP-06 — Sign Out

**Expected:** Firebase session cleared; auth экран

## Evidence

- Прогон на: [ ] iOS  [ ] Android
- Owner:
- Дата:
