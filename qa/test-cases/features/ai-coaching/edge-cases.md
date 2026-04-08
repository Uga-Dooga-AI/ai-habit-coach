# AI Coaching — Edge Cases

---

## AIC-EC-01 — Timeout (Supabase edge function > 10 сек)

**Expected:** loading state показан; timeout ошибка; retry кнопка; нет краша

---

## AIC-EC-02 — Offline при запросе AI совета

**Expected:** ошибка "No internet"; нет silent fail; нет краша

---

## AIC-EC-03 — Claude rate limit

**Expected:** корректное error message; не exponential crash loop

---

## AIC-EC-04 — Пустой список привычек → AI Coach

**Expected:** generic onboarding совет; не пустой экран / краш

---

## AIC-EC-05 — AI Coaching для free-tier (если premium only)

**Expected:** paywall если Sonnet только для premium; Haiku для free

---

## AIC-EC-06 — Firebase Auth token истёк во время запроса

**Expected:** token refresh → retry; нет 401 краша

## Evidence

- Logs:
