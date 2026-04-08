# Paywall — Happy Path

---

## PAY-HP-01 — Trial активен

**Expected:** full access; `trial_started` event

---

## PAY-HP-02 — Premium gate срабатывает

**Expected:** paywall modal; планы из RevenueCat offerings; A/B variant применён  
**Analytics:** `paywall_viewed` (variant, offering_id)

---

## PAY-HP-03 — Покупка (RevenueCat Sandbox)

**Expected:** RevenueCat transaction; `purchase_completed`; premium access activated  
**Analytics:** `purchase_initiated`, `purchase_completed`, `subscription_started`

---

## PAY-HP-04 — Restore Purchases

**Expected:** RevenueCat restore; `subscription_restored`; premium активирован

---

## PAY-HP-05 — Dismiss paywall

**Expected:** `paywall_dismissed` (time_spent_sec, dismiss_method)

## Evidence

- Sandbox env:
- Logs:
