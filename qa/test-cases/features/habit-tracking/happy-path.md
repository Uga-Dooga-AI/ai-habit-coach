# Habit Tracking — Happy Path

---

## HAB-T-HP-01 — Отметить привычку выполненной

**Шаги:** Home → тапнуть checkbox на привычке  
**Expected:** привычка отмечена; streak обновлён; SQLite запись создана  
**Analytics:** `habit_completed` (habit_id, streak_day)

---

## HAB-T-HP-02 — История (Progress tab)

**Шаги:** открыть Progress → просмотреть calendar view  
**Expected:** дни с выполнением отмечены; completion rate корректен

---

## HAB-T-HP-03 — Отмена выполнения (undo)

**Шаги:** повторный тап на checkbox (если undo поддерживается)  
**Expected:** привычка uncheck'd; streak пересчитан

---

## HAB-T-HP-04 — Offline tracking

**Шаги:** выключить сеть → отметить привычку → включить сеть  
**Expected:** запись в SQLite → sync с Supabase при восстановлении

## Evidence

- Logs:
