# Fixtures — Test Data

## Habits seed data

### Smoke
- 1 привычка любого типа

### Streak feature pack
- 7 дней последовательного tracking (для achievement unlock)
- Запись с пропуском (для streak reset test)

### AI Coaching feature pack
- 3+ привычек разных типов (для персонализации)

## Как сидировать

### Способ 1: Вручную через app

### Способ 2: Supabase direct insert
```sql
INSERT INTO habit_completions (user_id, habit_id, completed_at)
SELECT '<test-user-id>', '<habit-id>', NOW() - (generate_series || ' days')::interval
FROM generate_series(1, 7);
```

## Очистка

1. Удалить habit_completions для test user в Supabase
2. Удалить habits для test user
3. Очистить SQLite (sign out или app reinstall)
