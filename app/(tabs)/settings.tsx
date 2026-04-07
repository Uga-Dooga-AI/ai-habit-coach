import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/hooks/use-auth';
import { useHabitStore } from '@/stores/habit-store';
import { updateProfile } from '@/services/habits';
import { useSubscription } from '@/hooks/use-subscription';
import { useAnalytics, AnalyticsEvents } from '@/services/analytics';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

interface TimePickerModalProps {
  visible: boolean;
  title: string;
  value: string | null;
  onSave: (time: string) => void;
  onClear: () => void;
  onClose: () => void;
}

function TimePickerModal({ visible, title, value, onSave, onClear, onClose }: TimePickerModalProps) {
  const initialHour = value ? value.split(':')[0] : '08';
  const initialMinute = value ? value.split(':')[1] : '00';
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>

          <View style={styles.timePickers}>
            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>Hour</Text>
              <FlatList
                data={HOURS}
                keyExtractor={(h) => h}
                style={styles.pickerList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.pickerItem, item === hour && styles.pickerItemSelected]}
                    onPress={() => setHour(item)}
                  >
                    <Text style={[styles.pickerItemText, item === hour && styles.pickerItemTextSelected]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>

            <Text style={styles.timeSep}>:</Text>

            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>Min</Text>
              <FlatList
                data={MINUTES}
                keyExtractor={(m) => m}
                style={styles.pickerList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.pickerItem, item === minute && styles.pickerItemSelected]}
                    onPress={() => setMinute(item)}
                  >
                    <Text style={[styles.pickerItemText, item === minute && styles.pickerItemTextSelected]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => onSave(`${hour}:${minute}`)}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { state } = useAuth();
  const signOut = useAuthStore((s) => s.signOut);
  const { profile } = useHabitStore();
  const { tier, isPremium } = useSubscription();
  const analytics = useAnalytics();

  const [quietStart, setQuietStart] = useState<string | null>(profile?.quietHoursStart ?? null);
  const [quietEnd, setQuietEnd] = useState<string | null>(profile?.quietHoursEnd ?? null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const userEmail = state.status === 'signed_in'
    ? (state.user.isAnonymous ? 'Anonymous' : (state.user.email ?? 'Signed in'))
    : 'Not signed in';

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  useEffect(() => {
    const ev = AnalyticsEvents.Settings.settingsOpened();
    analytics.logEvent(ev.name, ev.params);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveQuietHours = async (start: string | null, end: string | null) => {
    if (!profile) return;
    try {
      await updateProfile(profile.id, {
        quietHoursStart: start,
        quietHoursEnd: end,
      });
      if (start !== null && end !== null) {
        const startHour = parseInt(start.split(':')[0], 10);
        const endHour = parseInt(end.split(':')[0], 10);
        const ev = AnalyticsEvents.Settings.quietHoursConfigured(startHour, endHour);
        analytics.logEvent(ev.name, ev.params);
      }
    } catch (e) {
      console.warn('saveQuietHours error:', e);
    }
  };

  const handleSignOut = () => {
    const logoutEv = AnalyticsEvents.Settings.logoutTapped();
    analytics.logEvent(logoutEv.name, logoutEv.params);
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will sign you out. Full account deletion requires contacting support. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out & Request Deletion',
          style: 'destructive',
          onPress: async () => {
            const deleteEv = AnalyticsEvents.Settings.accountDeleted('user_request');
            analytics.logEvent(deleteEv.name, deleteEv.params);
            await signOut();
          },
        },
      ],
    );
  };

  const tierLabel = tier === 'free' ? 'Free' : tier === 'trial' ? 'Trial' : 'Premium';
  const tierColor = isPremium ? '#6C63FF' : '#8B8FA8';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
          <View style={styles.sectionCard}>
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>Quiet Hours Start</Text>
                <Text style={styles.rowSub}>No reminders before this time</Text>
              </View>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={styles.timeButtonText}>{quietStart ?? 'Not set'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>Quiet Hours End</Text>
                <Text style={styles.rowSub}>Reminders resume after this time</Text>
              </View>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={styles.timeButtonText}>{quietEnd ?? 'Not set'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Subscription */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>SUBSCRIPTION</Text>
          <View style={styles.sectionCard}>
            <View style={styles.row}>
              <Text style={styles.rowTitle}>Current Plan</Text>
              <View style={[styles.tierBadge, { backgroundColor: isPremium ? '#F4F3FF' : '#F1F5F9' }]}>
                <Text style={[styles.tierBadgeText, { color: tierColor }]}>{tierLabel}</Text>
              </View>
            </View>
            {!isPremium && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => router.push({ pathname: '/paywall', params: { source: 'settings' } })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.rowTitle, { color: '#6C63FF' }]}>Manage Subscription</Text>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ACCOUNT</Text>
          <View style={styles.sectionCard}>
            <View style={styles.row}>
              <Text style={styles.rowTitle}>Email</Text>
              <Text style={styles.rowValue}>{userEmail}</Text>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.row} onPress={handleSignOut} activeOpacity={0.7}>
              <Text style={[styles.rowTitle, { color: '#EF4444' }]}>Sign Out</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.row} onPress={handleDeleteAccount} activeOpacity={0.7}>
              <Text style={[styles.rowTitle, { color: '#EF4444' }]}>Delete Account</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ABOUT</Text>
          <View style={styles.sectionCard}>
            <View style={styles.row}>
              <Text style={styles.rowTitle}>App Version</Text>
              <Text style={styles.rowValue}>{appVersion}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <TimePickerModal
        visible={showStartPicker}
        title="Quiet Hours Start"
        value={quietStart}
        onClose={() => setShowStartPicker(false)}
        onClear={() => {
          setQuietStart(null);
          setShowStartPicker(false);
          saveQuietHours(null, quietEnd);
        }}
        onSave={(time) => {
          setQuietStart(time);
          setShowStartPicker(false);
          saveQuietHours(time, quietEnd);
        }}
      />

      <TimePickerModal
        visible={showEndPicker}
        title="Quiet Hours End"
        value={quietEnd}
        onClose={() => setShowEndPicker(false)}
        onClear={() => {
          setQuietEnd(null);
          setShowEndPicker(false);
          saveQuietHours(quietStart, null);
        }}
        onSave={(time) => {
          setQuietEnd(time);
          setShowEndPicker(false);
          saveQuietHours(quietStart, time);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  scroll: { padding: 20, paddingBottom: 48 },
  screenTitle: { fontSize: 28, fontWeight: '800', color: '#1A1B2E', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B8FA8',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EAF2',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#1A1B2E' },
  rowSub: { fontSize: 12, color: '#8B8FA8', marginTop: 2 },
  rowValue: { fontSize: 14, color: '#8B8FA8' },
  chevron: { fontSize: 20, color: '#C0C3D3', fontWeight: '300' },
  divider: { height: 1, backgroundColor: '#F1F3FB', marginHorizontal: 16 },
  timeButton: {
    backgroundColor: '#F4F3FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E8EAF2',
  },
  timeButtonText: { fontSize: 14, fontWeight: '600', color: '#6C63FF' },
  tierBadge: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tierBadgeText: { fontSize: 13, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1B2E', marginBottom: 20, textAlign: 'center' },
  timePickers: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 },
  pickerCol: { alignItems: 'center' },
  pickerLabel: { fontSize: 12, color: '#8B8FA8', fontWeight: '600', marginBottom: 8 },
  pickerList: { height: 160, width: 64 },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickerItemSelected: { backgroundColor: '#F4F3FF' },
  pickerItemText: { fontSize: 16, color: '#6B6F8A', fontWeight: '500' },
  pickerItemTextSelected: { color: '#6C63FF', fontWeight: '700' },
  timeSep: { fontSize: 24, fontWeight: '700', color: '#1A1B2E', marginTop: 20 },
  modalActions: { flexDirection: 'row', gap: 8 },
  clearBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8EAF2',
    alignItems: 'center',
  },
  clearBtnText: { fontSize: 14, color: '#8B8FA8', fontWeight: '600' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8EAF2',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, color: '#6B6F8A', fontWeight: '600' },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
});
