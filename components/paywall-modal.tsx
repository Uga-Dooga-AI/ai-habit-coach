import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  reason?: string;
}

export function PaywallModal({ visible, onClose, reason }: PaywallModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/paywall');
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.iconBox}>
          <Text style={styles.icon}>⭐</Text>
        </View>

        <Text style={styles.title}>Upgrade to Premium</Text>

        {reason ? (
          <Text style={styles.reason}>{reason}</Text>
        ) : (
          <Text style={styles.reason}>
            You&apos;ve reached the 3-habit limit on the free plan.
          </Text>
        )}

        <View style={styles.features}>
          <Text style={styles.featureItem}>♾️ Unlimited habits</Text>
          <Text style={styles.featureItem}>🤖 Weekly AI insights</Text>
          <Text style={styles.featureItem}>🔗 Habit stacking</Text>
        </View>

        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={handleUpgrade}
          activeOpacity={0.85}
        >
          <Text style={styles.upgradeButtonText}>Upgrade to Premium →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dismissBtn} onPress={onClose}>
          <Text style={styles.dismissText}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E8EAF2',
    borderRadius: 2,
    marginBottom: 24,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#F4F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: { fontSize: 36 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1B2E',
    marginBottom: 10,
    textAlign: 'center',
  },
  reason: {
    fontSize: 14,
    color: '#6B6F8A',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  features: {
    backgroundColor: '#F8F9FF',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    gap: 8,
    marginBottom: 24,
  },
  featureItem: {
    fontSize: 14,
    color: '#1A1B2E',
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dismissBtn: { paddingVertical: 8 },
  dismissText: { fontSize: 14, color: '#8B8FA8' },
});
