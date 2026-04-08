# Auth — Happy Path

---

## AUTH-HP-01 — Sign In (email/password)

**Expected:** Home tab; Firebase currentUser установлен; analytics identity set  
**Analytics:** `auth_state_changed` (SIGNED_IN)

---

## AUTH-HP-02 — Sign Up

**Expected:** аккаунт создан; пользователь попадает на onboarding или Home  
**Analytics:** `auth_state_changed` (SIGNED_IN)

---

## AUTH-HP-03 — Sign Out

**Expected:** Firebase сессия cleared; auth экран; analytics identity reset  
**Analytics:** `auth_state_changed` (SIGNED_OUT)

## Evidence

- Screenshots:
- Logs:
