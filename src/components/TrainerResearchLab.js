
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@pokedex_research_progress';

const DEFAULT_PROGRESS = {
  careerPoints: 0,
  correctAnswers: 0,
  hintlessCorrect: 0,
  bestStreak: 0,
  achievements: [],
};

const ACHIEVEMENTS = [
  {
    id: 'first-catch',
    title: 'First Discovery',
    description: 'Answer your first Pokémon question correctly.',
    icon: '★',
    unlocked: (progress) => progress.correctAnswers >= 1,
  },
  {
    id: 'ten-discoveries',
    title: 'Curious Researcher',
    description: 'Identify 10 Pokémon correctly.',
    icon: '◆',
    unlocked: (progress) => progress.correctAnswers >= 10,
  },
  {
    id: 'five-streak',
    title: 'Sharp Recognition',
    description: 'Reach a streak of five correct answers.',
    icon: '⚡',
    unlocked: (progress) => progress.bestStreak >= 5,
  },
  {
    id: 'hintless-three',
    title: 'Independent Expert',
    description: 'Get three correct answers without hints.',
    icon: '✦',
    unlocked: (progress) => progress.hintlessCorrect >= 3,
  },
];

function getRank(points) {
  if (points >= 200) {
    return {
      name: 'Master Researcher',
      next: null,
      minimum: 200,
    };
  }

  if (points >= 100) {
    return {
      name: 'Pokémon Expert',
      next: 'Master Researcher',
      minimum: 200,
    };
  }

  if (points >= 30) {
    return {
      name: 'Field Researcher',
      next: 'Pokémon Expert',
      minimum: 100,
    };
  }

  return {
    name: 'Rookie Researcher',
    next: 'Field Researcher',
    minimum: 30,
  };
}

export async function recordResearchAnswer({
  correct,
  hintLevel = 0,
  streak = 0,
}) {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const previous = stored
      ? { ...DEFAULT_PROGRESS, ...JSON.parse(stored) }
      : { ...DEFAULT_PROGRESS };

    const updated = { ...previous };

    if (correct) {
      const pointsEarned =
        hintLevel === 0 ? 10 : hintLevel === 1 ? 5 : 2;

      updated.careerPoints += pointsEarned;
      updated.correctAnswers += 1;

      if (hintLevel === 0) {
        updated.hintlessCorrect += 1;
      }

      updated.bestStreak = Math.max(
        updated.bestStreak,
        streak
      );
    }

    const newlyUnlocked = ACHIEVEMENTS
      .filter((achievement) => (
        achievement.unlocked(updated) &&
        !updated.achievements.includes(achievement.id)
      ))
      .map((achievement) => achievement.id);

    updated.achievements = [
      ...updated.achievements,
      ...newlyUnlocked,
    ];

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );

    return updated;
  } catch {
    return null;
  }
}

export default function TrainerResearchLab({ refreshKey = 0 }) {
  const [progress, setProgress] = useState(DEFAULT_PROGRESS);

  useEffect(() => {
    let active = true;

    async function loadProgress() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);

        if (stored && active) {
          setProgress({
            ...DEFAULT_PROGRESS,
            ...JSON.parse(stored),
          });
        }
      } catch {
        // The rest of the game remains usable if storage fails.
      }
    }

    loadProgress();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const rank = getRank(progress.careerPoints);
  const unlockedCount = ACHIEVEMENTS.filter(
    (item) => progress.achievements.includes(item.id)
  ).length;

  const previousThreshold =
    rank.name === 'Rookie Researcher'
      ? 0
      : rank.name === 'Field Researcher'
        ? 30
        : rank.name === 'Pokémon Expert'
          ? 100
          : 200;

  const progressPercent = rank.next
    ? Math.min(
        100,
        Math.round(
          ((progress.careerPoints - previousThreshold) /
            (rank.minimum - previousThreshold)) *
            100
        )
      )
    : 100;

  const nextLockedAchievement = ACHIEVEMENTS.find(
    (item) => !progress.achievements.includes(item.id)
  );

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>TRAINER PROGRESSION</Text>
      <Text style={styles.title}>Pokémon Research Lab</Text>
      <Text style={styles.subtitle}>
        Your long-term progress and discoveries are saved on this device.
      </Text>

      <View style={styles.rankCard}>
        <Text style={styles.rankLabel}>CURRENT RANK</Text>
        <Text style={styles.rankName}>{rank.name}</Text>
        <Text style={styles.points}>
          {progress.careerPoints} career points
        </Text>

        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${progressPercent}%` },
            ]}
          />
        </View>

        <Text style={styles.nextRank}>
          {rank.next
            ? `${progressPercent}% toward ${rank.next}`
            : 'Highest rank achieved!'}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {progress.correctAnswers}
          </Text>
          <Text style={styles.statLabel}>Correct</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {progress.hintlessCorrect}
          </Text>
          <Text style={styles.statLabel}>No-hint wins</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {unlockedCount}/{ACHIEVEMENTS.length}
          </Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>ACHIEVEMENT COLLECTION</Text>

      {ACHIEVEMENTS.map((achievement) => {
        const unlocked = progress.achievements.includes(
          achievement.id
        );

        return (
          <View
            key={achievement.id}
            style={[
              styles.achievement,
              unlocked && styles.unlockedAchievement,
            ]}
          >
            <View
              style={[
                styles.badge,
                unlocked && styles.unlockedBadge,
              ]}
            >
              <Text style={styles.badgeIcon}>
                {unlocked ? achievement.icon : '•'}
              </Text>
            </View>

            <View style={styles.achievementText}>
              <Text style={styles.achievementTitle}>
                {achievement.title}
              </Text>
              <Text style={styles.description}>
                {achievement.description}
              </Text>
            </View>

            <Text
              style={[
                styles.status,
                unlocked && styles.unlockedStatus,
              ]}
            >
              {unlocked ? 'UNLOCKED' : 'LOCKED'}
            </Text>
          </View>
        );
      })}

      {nextLockedAchievement && (
        <View style={styles.nextCard}>
          <Text style={styles.nextTitle}>NEXT MILESTONE</Text>
          <Text style={styles.nextDescription}>
            {nextLockedAchievement.title}
          </Text>
          <Text style={styles.description}>
            {nextLockedAchievement.description}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#30394B',
    padding: 16,
    marginTop: 24,
  },
  eyebrow: {
    color: '#FF7F6B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    marginTop: 7,
  },
  subtitle: {
    color: '#A7B0C0',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  rankCard: {
    backgroundColor: '#202B3D',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  rankLabel: {
    color: '#FF9B91',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  rankName: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 6,
  },
  points: {
    color: '#A7B0C0',
    fontSize: 12,
    marginTop: 5,
  },
  track: {
    height: 7,
    backgroundColor: '#374151',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 14,
  },
  fill: {
    height: '100%',
    backgroundColor: '#FF7F6B',
    borderRadius: 8,
  },
  nextRank: {
    color: '#A7B0C0',
    fontSize: 11,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 4,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },
  statLabel: {
    color: '#A7B0C0',
    fontSize: 9,
    marginTop: 5,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#A7B0C0',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 10,
    marginBottom: 9,
    gap: 10,
  },
  unlockedAchievement: {
    borderColor: '#397C70',
    backgroundColor: '#19312F',
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockedBadge: {
    backgroundColor: '#28564C',
  },
  badgeIcon: {
    color: '#FF9B91',
    fontSize: 19,
    fontWeight: '900',
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  description: {
    color: '#A7B0C0',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
  status: {
    color: '#8996AA',
    fontSize: 8,
    fontWeight: '900',
  },
  unlockedStatus: {
    color: '#81D6B1',
  },
  nextCard: {
    backgroundColor: '#282A3B',
    borderRadius: 12,
    padding: 13,
    marginTop: 7,
    borderWidth: 1,
    borderColor: '#49415D',
  },
  nextTitle: {
    color: '#FF9B91',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  nextDescription: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6,
  },
});
