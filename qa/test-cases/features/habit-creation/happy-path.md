# Habit Creation — Happy Path

---

## HAB-C-HP-01 — Создание привычки

**Шаги:** Habits → Add Habit → заполнить название, тип, частоту → Save  
**Expected:** привычка в списке; сохранена в SQLite + sync с Supabase  
**Analytics:** `habit_created` (habit_type, frequency)

---

## HAB-C-HP-02 — Редактирование привычки

**Шаги:** long press или edit icon → изменить название → Save  
**Expected:** привычка обновлена; история tracking не затронута  
**Analytics:** `habit_updated`

---

## HAB-C-HP-03 — Удаление привычки

**Шаги:** swipe-to-delete или удалить в edit mode  
**Expected:** привычка удалена; stреак для неё сброшен; нет orphan данных  
**Analytics:** `habit_deleted`

---

## HAB-C-HP-04 — Множество привычек

**Шаги:** создать 5+ привычек  
**Expected:** все отображаются в списке; порядок сохранён

## Evidence

- Screenshots:
- Logs:
