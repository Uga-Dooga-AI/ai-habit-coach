# Auth — Edge Cases

---

## AUTH-EC-01 — Неверный пароль → ошибка, нет краша

## AUTH-EC-02 — Offline sign-in → ошибка сети

## AUTH-EC-03 — Firebase token refresh (30+ мин в фоне) → автообновление

## AUTH-EC-04 — Sign out при pending AI coaching request → запрос отменяется; нет crash

## Evidence

- Logs:
