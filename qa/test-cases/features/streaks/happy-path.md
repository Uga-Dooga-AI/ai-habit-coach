# Streaks — Happy Path

---

## STR-HP-01 — Стрик растёт при ежедневном выполнении

**Expected:** streak counter +1 каждый день

---

## STR-HP-02 — Achievement при достижении порога (7/30/100 дней)

**Expected:** achievement badge; в-app уведомление; push (если разрешён)  
**Analytics:** `achievement_unlocked` (achievement_key, streak_days)

---

## STR-HP-03 — Streak reminder push

**Expected:** push в назначенное время; тап открывает Habits tab  
**Analytics:** `streak_reminder_sent`

---

## STR-HP-04 — Android notification channels

**Platform:** Android  
**Expected:** streak reminders → канал "Streak reminders"; achievements → канал "Achievements"

## Evidence

- Logs:
