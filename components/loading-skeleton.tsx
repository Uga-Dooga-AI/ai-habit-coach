import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

function SkeletonPulse({ style }: { style?: object }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.bone, style, { opacity }]} />;
}

export function HabitCardSkeleton() {
  return (
    <View style={styles.card} accessibilityLabel="Loading habit">
      <View style={styles.cardLeft}>
        <SkeletonPulse style={styles.iconBone} />
        <View style={styles.cardInfo}>
          <SkeletonPulse style={styles.nameBone} />
          <SkeletonPulse style={styles.categoryBone} />
        </View>
      </View>
      <SkeletonPulse style={styles.actionBone} />
    </View>
  );
}

export function HabitListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View accessibilityLabel="Loading habits">
      {Array.from({ length: count }, (_, i) => (
        <HabitCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function StatCardSkeleton() {
  return (
    <View style={styles.statCard} accessibilityLabel="Loading statistic">
      <SkeletonPulse style={styles.statIconBone} />
      <SkeletonPulse style={styles.statValueBone} />
      <SkeletonPulse style={styles.statLabelBone} />
    </View>
  );
}

export function ProgressSkeleton() {
  return (
    <View style={styles.progressContainer} accessibilityLabel="Loading progress">
      <View style={styles.statsRow}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </View>
      <View style={styles.rateCard}>
        <SkeletonPulse style={styles.rateLabelBone} />
        <SkeletonPulse style={styles.rateValueBone} />
        <SkeletonPulse style={styles.rateBarBone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bone: { backgroundColor: '#E8EAF2', borderRadius: 6 },

  // Habit card skeleton
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E8EAF2',
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardInfo: { flex: 1, gap: 8 },
  iconBone: { width: 40, height: 40, borderRadius: 12 },
  nameBone: { width: '60%', height: 14 },
  categoryBone: { width: '35%', height: 10 },
  actionBone: { width: 64, height: 32, borderRadius: 10 },

  // Stat card skeleton
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8EAF2',
    gap: 8,
  },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statIconBone: { width: 28, height: 28, borderRadius: 14 },
  statValueBone: { width: 40, height: 24 },
  statLabelBone: { width: 52, height: 10 },

  // Progress skeleton
  progressContainer: { gap: 4 },
  rateCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8EAF2',
    gap: 10,
  },
  rateLabelBone: { width: '50%', height: 14 },
  rateValueBone: { width: 60, height: 28 },
  rateBarBone: { width: '100%', height: 8, borderRadius: 4 },
});
