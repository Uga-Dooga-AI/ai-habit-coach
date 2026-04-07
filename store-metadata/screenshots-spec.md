# Screenshot Specifications

## App Store (iOS)

### Required Sizes
| Device | Resolution | Aspect |
|--------|-----------|--------|
| iPhone 6.7" (15 Pro Max) | 1290 x 2796 px | Required |
| iPhone 6.5" (14 Plus) | 1284 x 2778 px | Optional (falls back to 6.7") |
| iPad Pro 12.9" (6th gen) | 2048 x 2732 px | Only if targeting iPad |

### Screenshot Count
- Minimum: 3 per device size
- Maximum: 10 per device size
- Recommended: 5-6

### Recommended Screenshot Sequence (iPhone 6.7")
1. **Hero / Dashboard** — Daily habit list with streaks and completion status. Caption: "Track your daily habits at a glance"
2. **AI Coaching Insights** — Weekly AI analysis screen with personalized recommendations. Caption: "Get AI-powered coaching insights"
3. **Progress Heatmap** — 6-week activity heatmap with completion rates. Caption: "Visualize your progress over time"
4. **Onboarding Goals** — Goal selection screen showing categories. Caption: "Set goals that matter to you"
5. **Habit Stacking** — Habit chain view with AI suggestions. Caption: "Stack habits for maximum impact"
6. **Smart Reminders** — Notification setup with reminder times. Caption: "Smart reminders keep you on track"

### Design Guidelines
- Use device frames (iPhone 15 Pro Max mockup)
- Background color: #F8F9FF or gradient from brand palette (#6C63FF to #4840BB)
- Caption font: SF Pro Display Bold, 28-32pt, white or #1A1B2E
- Keep captions concise (5-8 words)
- Show real app content, not placeholder data

---

## Google Play (Android)

### Required Sizes
| Asset | Resolution | Notes |
|-------|-----------|-------|
| Phone screenshots | 1080 x 1920 px (min) | Up to 2160 x 3840 |
| Feature graphic | 1024 x 500 px | Required, shown at top of listing |

### Screenshot Count
- Minimum: 2
- Maximum: 8
- Recommended: 5-6

### Recommended Screenshot Sequence (Phone)
Same sequence as iOS, adapted to Android frames (Pixel 8 Pro mockup).

### Feature Graphic (1024 x 500 px)
- App icon centered or left-aligned
- App name: "AI Habit Coach"
- Tagline: "Build lasting habits with AI coaching"
- Background: Brand gradient (#6C63FF to #4840BB)
- Keep text minimal — Google overlays the app name and developer name

---

## Production Notes

### Tools to Generate
- Figma or Sketch for device frame mockups
- Screenshots can be captured from simulator (iPhone 15 Pro Max, Pixel 8 Pro)
- Use Xcode Simulator at 1x for exact resolution matching
- Use Android Studio emulator with matching resolution

### File Format
- PNG (preferred) or JPEG
- No alpha channel for App Store
- RGB color space
- No rounded corners on screenshots (stores add them automatically)
