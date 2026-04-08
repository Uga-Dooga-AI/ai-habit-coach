# Paywall — Edge Cases

---

## PAY-EC-01 — Trial истёк → gates активны

## PAY-EC-02 — Отменённая подписка (sandbox revoke) → premium access убран

## PAY-EC-03 — Failed purchase (cancel на OS диалоге) → `purchase_failed`; нет краша

## PAY-EC-04 — Offline при покупке → ошибка сети; нет краша

## PAY-EC-05 — RevenueCat offerings не загрузились → fallback UI; нет пустого экрана

## PAY-EC-06 — A/B variant: paywall_cta_variant = control vs variant_a → разный CTA текст

## Evidence

- Logs:
