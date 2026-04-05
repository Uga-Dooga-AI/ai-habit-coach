export type AnalyticsEvent = {
  name: string;
  params: Record<string, string | number | boolean>;
};

function event(name: string, params: Record<string, string | number | boolean> = {}): AnalyticsEvent {
  return { name, params };
}

export const AnalyticsEvents = {
  Onboarding: {
    onboardingStarted: (): AnalyticsEvent =>
      event('onboarding_started'),

    onboardingStepCompleted: (stepName: string, stepIndex: number, stepTotal: number): AnalyticsEvent =>
      event('onboarding_step_completed', { step_name: stepName, step_index: stepIndex, step_total: stepTotal }),

    onboardingGoalsSet: (goalCount: number, goalTypes: string): AnalyticsEvent =>
      event('onboarding_goals_set', { goal_count: goalCount, goal_types: goalTypes }),

    onboardingScheduleSet: (wakeTime: string, sleepTime: string): AnalyticsEvent =>
      event('onboarding_schedule_set', { wake_time: wakeTime, sleep_time: sleepTime }),

    onboardingHabitsSelected: (habitCount: number, suggestedCount: number, customCount: number): AnalyticsEvent =>
      event('onboarding_habits_selected', { habit_count: habitCount, suggested_count: suggestedCount, custom_count: customCount }),

    onboardingNotificationPermission: (granted: boolean): AnalyticsEvent =>
      event('onboarding_notification_permission', { granted }),

    onboardingCompleted: (durationSec: number, habitsSelected: number): AnalyticsEvent =>
      event('onboarding_completed', { duration_sec: durationSec, habits_selected: habitsSelected }),

    onboardingSkipped: (stepName: string, stepIndex: number): AnalyticsEvent =>
      event('onboarding_skipped', { step_name: stepName, step_index: stepIndex }),
  },

  Habits: {
    habitCreated: (habitId: string, category: string, frequency: string, hasCue: boolean, hasReward: boolean, isAiSuggested: boolean, source: string): AnalyticsEvent =>
      event('habit_created', { habit_id: habitId, category, frequency, has_cue: hasCue, has_reward: hasReward, is_ai_suggested: isAiSuggested, source }),

    habitCompleted: (habitId: string, category: string, streakCount: number, timeOfDay: string, completionTimeSec: number): AnalyticsEvent =>
      event('habit_completed', { habit_id: habitId, category, streak_count: streakCount, time_of_day: timeOfDay, completion_time_sec: completionTimeSec }),

    habitSkipped: (habitId: string, category: string, skipReason: string, streakCount: number): AnalyticsEvent =>
      event('habit_skipped', { habit_id: habitId, category, skip_reason: skipReason, streak_count: streakCount }),

    habitEdited: (habitId: string, fieldsChanged: string): AnalyticsEvent =>
      event('habit_edited', { habit_id: habitId, fields_changed: fieldsChanged }),

    habitArchived: (habitId: string, category: string, totalCompletions: number, daysActive: number): AnalyticsEvent =>
      event('habit_archived', { habit_id: habitId, category, total_completions: totalCompletions, days_active: daysActive }),

    habitDeleted: (habitId: string, category: string, totalCompletions: number, daysActive: number): AnalyticsEvent =>
      event('habit_deleted', { habit_id: habitId, category, total_completions: totalCompletions, days_active: daysActive }),

    habitReactivated: (habitId: string, category: string, daysInactive: number): AnalyticsEvent =>
      event('habit_reactivated', { habit_id: habitId, category, days_inactive: daysInactive }),
  },

  Streaks: {
    streakIncremented: (streakCount: number, habitCountCompleted: number): AnalyticsEvent =>
      event('streak_incremented', { streak_count: streakCount, habit_count_completed: habitCountCompleted }),

    streakMilestone: (streakCount: number, milestoneType: string): AnalyticsEvent =>
      event('streak_milestone', { streak_count: streakCount, milestone_type: milestoneType }),

    streakBroken: (previousStreak: number, habitsMissed: number): AnalyticsEvent =>
      event('streak_broken', { previous_streak: previousStreak, habits_missed: habitsMissed }),

    streakRecovered: (recoveryMethod: string, previousStreak: number): AnalyticsEvent =>
      event('streak_recovered', { recovery_method: recoveryMethod, previous_streak: previousStreak }),
  },

  AI: {
    aiSuggestionShown: (suggestionType: string, context: string): AnalyticsEvent =>
      event('ai_suggestion_shown', { suggestion_type: suggestionType, context }),

    aiSuggestionAccepted: (suggestionType: string, suggestionId: string): AnalyticsEvent =>
      event('ai_suggestion_accepted', { suggestion_type: suggestionType, suggestion_id: suggestionId }),

    aiSuggestionDismissed: (suggestionType: string, suggestionId: string, dismissReason: string): AnalyticsEvent =>
      event('ai_suggestion_dismissed', { suggestion_type: suggestionType, suggestion_id: suggestionId, dismiss_reason: dismissReason }),

    aiInsightGenerated: (insightType: string, habitsAnalyzed: number): AnalyticsEvent =>
      event('ai_insight_generated', { insight_type: insightType, habits_analyzed: habitsAnalyzed }),

    aiInsightViewed: (insightType: string, insightId: string, viewDurationSec: number): AnalyticsEvent =>
      event('ai_insight_viewed', { insight_type: insightType, insight_id: insightId, view_duration_sec: viewDurationSec }),

    aiRecommendationTapped: (recommendationType: string, recommendationId: string): AnalyticsEvent =>
      event('ai_recommendation_tapped', { recommendation_type: recommendationType, recommendation_id: recommendationId }),

    aiCoachingMessageShown: (messageType: string, context: string): AnalyticsEvent =>
      event('ai_coaching_message_shown', { message_type: messageType, context }),
  },

  Nudges: {
    reminderSet: (habitId: string, reminderTime: string, isAiOptimal: boolean): AnalyticsEvent =>
      event('reminder_set', { habit_id: habitId, reminder_time: reminderTime, is_ai_optimal: isAiOptimal }),

    reminderTriggered: (habitId: string, nudgeStyle: string, isOptimalTime: boolean): AnalyticsEvent =>
      event('reminder_triggered', { habit_id: habitId, nudge_style: nudgeStyle, is_optimal_time: isOptimalTime }),

    reminderOpened: (habitId: string, responseTimeSec: number, nudgeStyle: string): AnalyticsEvent =>
      event('reminder_opened', { habit_id: habitId, response_time_sec: responseTimeSec, nudge_style: nudgeStyle }),

    reminderSnoozed: (habitId: string, snoozeDurationMin: number): AnalyticsEvent =>
      event('reminder_snoozed', { habit_id: habitId, snooze_duration_min: snoozeDurationMin }),

    reminderDismissed: (habitId: string, nudgeStyle: string): AnalyticsEvent =>
      event('reminder_dismissed', { habit_id: habitId, nudge_style: nudgeStyle }),

    nudgeStyleChanged: (oldStyle: string, newStyle: string, scope: string): AnalyticsEvent =>
      event('nudge_style_changed', { old_style: oldStyle, new_style: newStyle, scope }),

    nudgeFrequencyChanged: (oldFrequency: string, newFrequency: string): AnalyticsEvent =>
      event('nudge_frequency_changed', { old_frequency: oldFrequency, new_frequency: newFrequency }),
  },

  Stacking: {
    stackCreated: (stackId: string, habitCount: number, isAiSuggested: boolean): AnalyticsEvent =>
      event('stack_created', { stack_id: stackId, habit_count: habitCount, is_ai_suggested: isAiSuggested }),

    stackAiSuggested: (stackId: string, habitCount: number, anchorHabitCategory: string): AnalyticsEvent =>
      event('stack_ai_suggested', { stack_id: stackId, habit_count: habitCount, anchor_habit_category: anchorHabitCategory }),

    stackAccepted: (stackId: string, habitCount: number): AnalyticsEvent =>
      event('stack_accepted', { stack_id: stackId, habit_count: habitCount }),

    stackRejected: (stackId: string, rejectReason: string): AnalyticsEvent =>
      event('stack_rejected', { stack_id: stackId, reject_reason: rejectReason }),

    stackReordered: (stackId: string): AnalyticsEvent =>
      event('stack_reordered', { stack_id: stackId }),

    stackCompleted: (stackId: string, habitsCompleted: number, habitsTotal: number, durationSec: number): AnalyticsEvent =>
      event('stack_completed', { stack_id: stackId, habits_completed: habitsCompleted, habits_total: habitsTotal, duration_sec: durationSec }),

    stackPartial: (stackId: string, habitsCompleted: number, habitsTotal: number): AnalyticsEvent =>
      event('stack_partial', { stack_id: stackId, habits_completed: habitsCompleted, habits_total: habitsTotal }),
  },

  Paywall: {
    paywallShown: (source: string, triggerFeature: string): AnalyticsEvent =>
      event('paywall_shown', { source, trigger_feature: triggerFeature }),

    paywallDismissed: (source: string, viewDurationSec: number): AnalyticsEvent =>
      event('paywall_dismissed', { source, view_duration_sec: viewDurationSec }),

    trialActivated: (planId: string, trialDurationDays: number, source: string): AnalyticsEvent =>
      event('trial_activated', { plan_id: planId, trial_duration_days: trialDurationDays, source }),

    subscriptionStarted: (planId: string, price: number, currency: string, period: string, source: string, isTrialConversion: boolean): AnalyticsEvent =>
      event('subscription_started', { plan_id: planId, price, currency, period, source, is_trial_conversion: isTrialConversion }),

    subscriptionRenewed: (planId: string, price: number, currency: string, period: string, renewalCount: number): AnalyticsEvent =>
      event('subscription_renewed', { plan_id: planId, price, currency, period, renewal_count: renewalCount }),

    subscriptionCancelled: (planId: string, cancelReason: string, daysSubscribed: number): AnalyticsEvent =>
      event('subscription_cancelled', { plan_id: planId, cancel_reason: cancelReason, days_subscribed: daysSubscribed }),

    subscriptionExpired: (planId: string, wasTrial: boolean, daysSubscribed: number): AnalyticsEvent =>
      event('subscription_expired', { plan_id: planId, was_trial: wasTrial, days_subscribed: daysSubscribed }),

    purchaseRestored: (planId: string, originalPurchaseDate: string): AnalyticsEvent =>
      event('purchase_restored', { plan_id: planId, original_purchase_date: originalPurchaseDate }),
  },

  Revenue: {
    purchaseCompleted: (productId: string, price: number, currency: string, transactionId: string): AnalyticsEvent =>
      event('purchase_completed', { product_id: productId, price, currency, transaction_id: transactionId }),

    revenueEvent: (value: number, currency: string): AnalyticsEvent =>
      event('revenue_event', { value, currency }),
  },

  Push: {
    pushPermissionRequested: (): AnalyticsEvent =>
      event('push_permission_requested'),

    pushPermissionGranted: (): AnalyticsEvent =>
      event('push_permission_granted'),

    pushPermissionDenied: (): AnalyticsEvent =>
      event('push_permission_denied'),

    pushReceived: (notificationType: string): AnalyticsEvent =>
      event('push_received', { notification_type: notificationType }),

    pushOpened: (notificationType: string, responseTimeSec: number): AnalyticsEvent =>
      event('push_opened', { notification_type: notificationType, response_time_sec: responseTimeSec }),
  },

  Progress: {
    dashboardViewed: (activeHabits: number, streakCurrent: number, completionRate7d: number): AnalyticsEvent =>
      event('dashboard_viewed', { active_habits: activeHabits, streak_current: streakCurrent, completion_rate_7d: completionRate7d }),

    weeklyInsightViewed: (insightId: string, period: string, viewDurationSec: number): AnalyticsEvent =>
      event('weekly_insight_viewed', { insight_id: insightId, period, view_duration_sec: viewDurationSec }),

    progressChartInteracted: (chartType: string, interactionType: string): AnalyticsEvent =>
      event('progress_chart_interacted', { chart_type: chartType, interaction_type: interactionType }),

    goalProgressViewed: (goalType: string, progressPercent: number): AnalyticsEvent =>
      event('goal_progress_viewed', { goal_type: goalType, progress_percent: progressPercent }),

    exportRequested: (format: string): AnalyticsEvent =>
      event('export_requested', { format }),
  },

  Errors: {
    apiRequestFailed: (endpointGroup: string, httpStatus: number, failureReason: string): AnalyticsEvent =>
      event('api_request_failed', { endpoint_group: endpointGroup, http_status: httpStatus, failure_reason: failureReason }),

    syncFailed: (syncType: string, failureReason: string): AnalyticsEvent =>
      event('sync_failed', { sync_type: syncType, failure_reason: failureReason }),

    offlineModeEntered: (reason: string): AnalyticsEvent =>
      event('offline_mode_entered', { reason }),

    offlineModeExited: (offlineDurationSec: number): AnalyticsEvent =>
      event('offline_mode_exited', { offline_duration_sec: offlineDurationSec }),

    backgroundSyncCompleted: (syncType: string, durationMs: number, recordsSynced: number): AnalyticsEvent =>
      event('background_sync_completed', { sync_type: syncType, duration_ms: durationMs, records_synced: recordsSynced }),

    fatalUserFlowError: (flowName: string, errorCode: string): AnalyticsEvent =>
      event('fatal_user_flow_error', { flow_name: flowName, error_code: errorCode }),
  },

  Experiment: {
    experimentExposure: (experimentId: string, variant: string): AnalyticsEvent =>
      event('experiment_exposure', { experiment_id: experimentId, variant }),

    experimentConversion: (experimentId: string, variant: string, conversionType: string): AnalyticsEvent =>
      event('experiment_conversion', { experiment_id: experimentId, variant, conversion_type: conversionType }),
  },
} as const;
