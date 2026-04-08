# Auth — Telemetry Notes

## Events

| Событие | Когда |
|---------|-------|
| `auth_state_changed` | Sign in / sign out |

## Identity setup (после sign-in)

- Firebase Analytics: `setUserId`
- AppMetrica: `setUserProfileId`

## Deferred

- Live Firebase/AppMetrica — отложено; проверяем по console
