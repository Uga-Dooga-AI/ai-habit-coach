# Analytics Event Schema

Reference document for all tracked analytics events in AI Habit Coach.
Source of truth: `services/analytics/events.ts`

## Providers

| Provider | Status | Notes |
|----------|--------|-------|
| Firebase Analytics / GA4 | Deferred | Waiting for UGAAAAA-229 (Firebase credentials) |
| AppMetrica | Deferred | Waiting for UGAAAAA-230 (AppMetrica credentials) |
| StubTracker | Active (dev) | No-op in development builds |

Both providers are wired via `CompositeTracker`. In deferred mode the
`FirebaseAnalyticsTracker` and `AppMetricaTracker` silently no-op when
native SDKs are not installed.

## Remote Config Parameters

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `habit_catalog_items` | string | `default` | Catalog variant |
| `ai_model_haiku` | string | `claude-haiku-4-5-20251001` | AI model for quick tasks |
| `ai_model_sonnet` | string | `claude-sonnet-4-6` | AI model for insights |
| `reminders_enabled` | string | `true` | Feature flag |
| `weekly_insights_enabled` | string | `true` | Feature flag |
| `onboarding_variant` | string | `control` | A/B: onboarding flow |
| `paywall_cta_variant` | string | `a` | A/B: CTA copy (`a`=control, `b`=variant) |
| `paywall_price_display` | string | `monthly_first` | A/B: price card order |
| `active_experiment_ids` | string | `` | Comma-separated active experiment IDs |

All A/B variant values are pushed as user properties to AppMetrica on
every session start so events can be segmented by variant.

## User Properties

| Property | When Set | Source |
|----------|----------|--------|
| `subscription_tier` | On subscription load / change | `useUserPropertySync` |
| `habit_count` | On habit list change | `useUserPropertySync` |
| `streak_current` | — | Reserved for future use |
| `onboarding_complete` | On profile load | `useUserPropertySync` |
| `nudge_style` | — | Reserved for future use |
| `timezone` | On session start | `useUserPropertySync` |
| `days_since_install` | — | Reserved for future use |
| `platform` | On session start | `useUserPropertySync` |
| `onboarding_variant` | On Remote Config fetch | Root layout bridge |
| `paywall_cta_variant` | On Remote Config fetch | Root layout bridge |
| `paywall_price_display` | On Remote Config fetch | Root layout bridge |

## Events

### Onboarding (10 events)

| Event Name | Key Params | Fired From |
|------------|------------|------------|
| `onboarding_started` | — | `onboarding/index.tsx` |
| `onboarding_step_completed` | `step_name`, `step_index`, `step_total` | All onboarding screens |
| `onboarding_goals_set` | `goal_count`, `goal_types` | `onboarding/index.tsx` |
| `onboarding_schedule_set` | `wake_time`, `sleep_time` | — (reserved) |
| `onboarding_habits_selected` | `habit_count`, `suggested_count`, `custom_count` | `onboarding/habits.tsx` |
| `onboarding_notification_permission` | `granted` | `onboarding/reminder.tsx` |
| `onboarding_completed` | `duration_sec`, `habits_selected` | `onboarding/reminder.tsx` |
| `onboarding_skipped` | `step_name`, `step_index` | — (reserved) |
| `habit_template_selected` | `template_id`, `template_name` | `onboarding/habits.tsx` |
| `custom_habit_created` | `habit_name` | `onboarding/habits.tsx` |

### Habits (8 events)

| Event Name | Key Params | Fired From |
|------------|------------|------------|
| `habit_created` | `habit_id`, `category`, `frequency`, `is_ai_suggested`, `source` | — (via addHabit) |
| `habit_completed` | `habit_id`, `category`, `streak_count`, `time_of_day` | `(tabs)/index.tsx` |
| `habit_skipped` | `habit_id`, `category`, `skip_reason`, `streak_count` | `(tabs)/index.tsx` |
| `habit_edited` | `habit_id`, `fields_changed` | `edit-habit/[id].tsx` |
| `habit_archived` | `habit_id`, `category`, `total_completions`, `days_active` | `(tabs)/index.tsx`, `edit-habit/[id].tsx` |
| `habit_deleted` | `habit_id`, `category`, `total_completions`, `days_active` | `(tabs)/index.tsx`, `edit-habit/[id].tsx` |
| `habit_reactivated` | `habit_id`, `category`, `days_inactive` | — (reserved) |
| `habit_limit_hit` | — | `(tabs)/index.tsx` |

### Streaks (4 events)

| Event Name | Key Params | Fired From |
|------------|------------|------------|
| `streak_incremented` | `streak_count`, `habit_count_completed` | `(tabs)/index.tsx` |
| `streak_milestone` | `streak_count`, `milestone_type` | `(tabs)/index.tsx` (7/14/21/30 day) |
| `streak_broken` | `previous_streak`, `habits_missed` | — (reserved) |
| `streak_recovered` | `recovery_method`, `previous_streak` | — (reserved) |

### AI (7 events)

| Event Name | Key Params | Fired From |
|------------|------------|------------|
| `ai_suggestion_shown` | `suggestion_type`, `context` | — (reserved) |
| `ai_suggestion_accepted` | `suggestion_type`, `suggestion_id` | — (reserved) |
| `ai_suggestion_dismissed` | `suggestion_type`, `suggestion_id`, `dismiss_reason` | — (reserved) |
| `ai_insight_generated` | `insight_type`, `habits_analyzed` | `(tabs)/insights.tsx` |
| `ai_insight_viewed` | `insight_type`, `insight_id`, `view_duration_sec` | — (reserved) |
| `ai_recommendation_tapped` | `recommendation_type`, `recommendation_id` | — (reserved) |
| `ai_coaching_message_shown` | `message_type`, `context` | `(tabs)/index.tsx` |

### Nudges / Reminders (7 events)

| Event Name | Key Params | Fired From |
|------------|------------|------------|
| `reminder_set` | `habit_id`, `reminder_time`, `is_ai_optimal` | `onboarding/reminder.tsx` |
| `reminder_triggered` | `habit_id`, `nudge_style`, `is_optimal_time` | — (push handler) |
| `reminder_opened` | `habit_id`, `response_time_sec`, `nudge_style` | — (push handler) |
| `reminder_snoozed` | `habit_id`, `snooze_duration_min` | — (reserved) |
| `reminder_dismissed` | `habit_id`, `nudge_style` | — (reserved) |
| `nudge_style_changed` | `old_style`, `new_style`, `scope` | — (reserved) |
| `nudge_frequency_changed` | `old_frequency`, `new_frequency` | — (reserved) |

### Stacking (7 events)

| Event Name | Key Params | Fired From |
|------------|------------|------------|
| `stack_created` | `stack_id`, `habit_count`, `is_ai_suggested` | — (reserved) |
| `stack_ai_suggested` | `stack_id`, `habit_count`, `anchor_habit_category` | — (reserved) |
| `stack_accepted` | `stack_id`, `habit_count` | — (reserved) |
| `stack_rejected` | `stack_id`, `reject_reason` | — (reserved) |
| `stack_reordered` | `stack_id` | — (reserved) |
| `stack_completed` | `stack_id`, `habits_completed`, `habits_total`, `duration_sec` | — (reserved) |
| `stack_partial` | `stack_id`, `habits_completed`, `habits_total` | — (reserved) |

### Paywall (12 events)

| Event Name | Key Params | Fired From |
|------------|------------|------------|
| `paywall_shown` | `source`, `trigger_feature` | `(tabs)/index.tsx`, `paywall.tsx` |
| `paywall_cta_tapped` | `plan`, `cta_variant` | `paywall.tsx` |
| `paywall_dismissed` | `source`, `view_duration_sec` | `(tabs)/index.tsx`, `paywall.tsx` |
| `trial_activated` | `plan_id`, `trial_duration_days`, `source` | `paywall.tsx` |
| `trial_converted` | `plan_id`, `trial_duration_days` | — (server-side) |
| `trial_expired` | `plan_id`, `trial_duration_days` | — (server-side) |
| `subscription_started` | `plan_id`, `price`, `currency`, `period`, `source`, `is_trial_conversion` | `paywall.tsx` |
| `subscription_restored` | `plan_id` | `paywall.tsx` |
| `subscription_renewed` | `plan_id`, `price`, `currency`, `period`, `renewal_count` | — (server-side) |
| `subscription_cancelled` | `plan_id`, `cancel_reason`, `days_subscribed` | — (server-side) |
| `subscription_expired` | `plan_id`, `was_trial`, `days_subscribed` | — (server-side) |
| `purchase_restored` | `plan_id`, `original_purchase_date` | — (reserved) |

### Revenue (2 events)

| Event Name | Key Params | Fired From |
|------------|------------|------------|
| `purchase_completed` | `product_id`, `price`, `currency`, `transaction_id` | — (RevenueCat webhook) |
| `revenue_event` | `value`, `currency` | — (RevenueCat webhook) |

### Push Notifications (5 events)

| Event Name | Key Params | Fired From |
|------------|------------|------------|
| `push_permission_requested` | — | — (reserved) |
| `push_permission_granted` | — | — (reserved) |
| `push_permission_denied` | — | — (reserved) |
| `push_received` | `notification_type` | — (push handler) |
| `push_opened` | `notification_type`, `response_time_sec` | — (push handler) |

### Progress (5 events)

| Event Name | Key Params | Fired From |
|------------|------------|------------|
| `dashboard_viewed` | `active_habits`, `streak_current`, `completion_rate_7d` | `(tabs)/index.tsx`, `(tabs)/progress.tsx` |
| `weekly_insight_viewed` | `insight_id`, `period`, `view_duration_sec` | `(tabs)/insights.tsx` |
| `progress_chart_interacted` | `chart_type`, `interaction_type` | — (reserved) |
| `goal_progress_viewed` | `goal_type`, `progress_percent` | — (reserved) |
| `export_requested` | `format` | — (reserved) |

### Errors (6 events)

| Event Name | Key Params | Fired From |
|------------|------------|------------|
| `api_request_failed` | `endpoint_group`, `http_status`, `failure_reason` | — (reserved) |
| `sync_failed` | `sync_type`, `failure_reason` | — (reserved) |
| `offline_mode_entered` | `reason` | — (reserved) |
| `offline_mode_exited` | `offline_duration_sec` | — (reserved) |
| `background_sync_completed` | `sync_type`, `duration_ms`, `records_synced` | — (reserved) |
| `fatal_user_flow_error` | `flow_name`, `error_code` | — (reserved) |

### Settings (5 events)

| Event Name | Key Params | Fired From |
|------------|------------|------------|
| `settings_opened` | — | `(tabs)/settings.tsx` |
| `quiet_hours_configured` | `start_hour`, `end_hour` | `(tabs)/settings.tsx` |
| `notification_toggled` | `habit_id`, `enabled` | `edit-habit/[id].tsx` |
| `account_deleted` | `reason` | `(tabs)/settings.tsx` |
| `logout_tapped` | — | `(tabs)/settings.tsx` |

### Experiment (2 events)

| Event Name | Key Params | Fired From |
|------------|------------|------------|
| `experiment_exposure` | `experiment_id`, `variant` | Root layout (Remote Config bridge) |
| `experiment_conversion` | `experiment_id`, `variant`, `conversion_type` | — (reserved) |

## AppMetrica Enrichment

Every event sent to AppMetrica is automatically enriched with
`active_experiments` (comma-separated experiment IDs from Remote Config)
via `AppMetricaTracker.enrichParams()`.

## Coverage Status

- **Wired**: Onboarding, Habits, Streaks (incremented + milestone), AI coaching/insights, Paywall, Settings, Progress, Experiment exposure
- **Reserved**: Stacking, Push handlers, Server-side subscription lifecycle, Error tracking, AI suggestions
- **Deferred**: Firebase credentials (UGAAAAA-229), AppMetrica credentials (UGAAAAA-230)
