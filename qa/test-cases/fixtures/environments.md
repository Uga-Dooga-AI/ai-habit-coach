# Fixtures — Environments

## Среды

### Development
- `pnpm start` + Expo Go
- Firebase: dev
- Supabase: dev

### Staging / Preview
- EAS Build `preview` profile
- TestFlight (iOS) / Internal Testing (Android)

### Production
- App Store / Google Play

## Edge case simulation

| Edge case | iOS | Android |
|-----------|-----|---------|
| Offline | Network Link Conditioner | Network → None |
| Time warp | System Settings → Date | `adb shell date` |
| Push test | `xcrun simctl push` | `adb shell am broadcast` |

## Android notification channels

- "Streak reminders" — для streak push
- "Achievements" — для achievement push
- Проверять в: Settings → Apps → AI Habit Coach → Notifications
