# Habit Creation — Edge Cases

---

## HAB-C-EC-01 — Пустое название → валидация, не создаётся

## HAB-C-EC-02 — Дублирующее название → предупреждение или разрешено (зафиксировать поведение)

## HAB-C-EC-03 — Создание в offline → SQLite; sync при восстановлении сети

## HAB-C-EC-04 — Удаление привычки с 30+ днями tracking → данные tracking тоже удаляются корректно (нет orphan записей)

## HAB-C-EC-05 — Premium habit template для free-tier → paywall

## Evidence

- Logs:
