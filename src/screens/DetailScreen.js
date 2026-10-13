
import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getPokemonDetails } from '../api';
import { useTeam } from '../context/TeamContext';

const COLORS = {
  background: '#111827',
  panel: '#1F2937',
  coral: '#FF7F6B',
  white: '#FFFFFF',
  muted: '#A7B0C0',
  track: '#374151',
  green: '#81D6B1',
  dark: '#0B1220',
  red: '#FF8A8A',
};

const STAT_LABELS = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Attack',
  'special-defense': 'Sp. Defense',
  speed: 'Speed',
};

export default function DetailScreen({ route }) {
  const { id } = route.params;

  const {
    team,
    ready,
    addPokemon,
    removePokemon,
    isInTeam,
  } = useTeam();

  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Automatically dismiss the custom notification.
  useEffect(() => {
    if (!toast) return undefined;

    const timer = setTimeout(() => {
      setToast(null);
    }, 2500);

    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let isActive = true;

    async function loadDetails() {
      try {
        setLoading(true);
        setError('');

        const data = await getPokemonDetails(id);

        if (isActive) {
          setPokemon(data);
        }
      } catch {
        if (isActive) {
          setError('Could not load this Pokémon. Please try again.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadDetails();

    return () => {
      isActive = false;
    };
  }, [id]);

  function showToast(title, message, type = 'success') {
    setToast({
      title,
      message,
      type,
      key: Date.now(),
    });
  }

  function capitalize(name = '') {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  function handleTeamButton() {
    if (!pokemon || !ready) {
      showToast(
        'Just a moment',
        'Your team is still loading.',
        'info'
      );
      return;
    }

    if (isInTeam(pokemon.id)) {
      removePokemon(pokemon.id);

      showToast(
        'Removed from team',
        `${capitalize(pokemon.name)} has left your team.`,
        'removed'
      );

      return;
    }

    const result = addPokemon({
      id: pokemon.id,
      name: pokemon.name,
      image:
        pokemon.sprites?.other?.['official-artwork']?.front_default ||
        pokemon.sprites?.front_default ||
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`,
      types: pokemon.types.map((item) => item.type.name),
      stats: pokemon.stats.map((item) => ({
        name: item.stat.name,
        value: item.base_stat,
      })),
    });

    if (result.success) {
      showToast(
        'Added to your team!',
        `${capitalize(pokemon.name)} is ready to go.`,
        'success'
      );
    } else {
      showToast(
        'Could not add Pokémon',
        result.message,
        'error'
      );
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.coral} />
        <Text style={styles.message}>Loading Pokémon...</Text>
      </View>
    );
  }

  if (error || !pokemon) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>
          {error || 'Pokémon not found.'}
        </Text>
      </View>
    );
  }

  const artwork =
    pokemon.sprites?.other?.['official-artwork']?.front_default ||
    pokemon.sprites?.front_default;

  const inTeam = isInTeam(pokemon.id);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.number}>
            #{String(pokemon.id).padStart(3, '0')}
          </Text>

          {artwork ? (
            <Image
              source={{ uri: artwork }}
              style={styles.artwork}
            />
          ) : (
            <View style={styles.imageFallback}>
              <Text style={styles.fallbackText}>
                No artwork available
              </Text>
            </View>
          )}

          <Text style={styles.name}>
            {capitalize(pokemon.name)}
          </Text>

          <View style={styles.typeRow}>
            {pokemon.types.map((item) => (
              <View
                key={item.type.name}
                style={styles.typeChip}
              >
                <Text style={styles.typeText}>
                  {item.type.name}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!ready}
            style={[
              styles.teamButton,
              inTeam && styles.removeButton,
              !ready && styles.disabledButton,
            ]}
            onPress={handleTeamButton}
          >
            <Text style={styles.teamButtonText}>
              {!ready
                ? 'Loading Team...'
                : inTeam
                  ? '−  Remove from My Team'
                  : '+  Add to My Team'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.teamCount}>
            YOUR TEAM  ·  {team.length}/6 POKÉMON
          </Text>
        </View>

        <View style={styles.measurements}>
          <View style={styles.measurementItem}>
            <Text style={styles.measurementValue}>
              {(pokemon.height / 10).toFixed(1)} m
            </Text>
            <Text style={styles.measurementLabel}>HEIGHT</Text>
          </View>

          <View style={styles.measurementDivider} />

          <View style={styles.measurementItem}>
            <Text style={styles.measurementValue}>
              {(pokemon.weight / 10).toFixed(1)} kg
            </Text>
            <Text style={styles.measurementLabel}>WEIGHT</Text>
          </View>
        </View>

        <View style={styles.statsPanel}>
          <Text style={styles.sectionTitle}>Base Stats</Text>
          <Text style={styles.sectionSubtitle}>
            A breakdown of this Pokémon's abilities
          </Text>

          {pokemon.stats.map((item) => {
            const value = item.base_stat;
            const percentage = Math.min((value / 255) * 100, 100);

            return (
              <View
                key={item.stat.name}
                style={styles.statRow}
              >
                <Text style={styles.statLabel}>
                  {STAT_LABELS[item.stat.name] || item.stat.name}
                </Text>

                <Text style={styles.statValue}>{value}</Text>

                <View style={styles.statTrack}>
                  <View
                    style={[
                      styles.statFill,
                      { width: `${percentage}%` },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {toast && (
        <View
          pointerEvents="box-none"
          style={styles.toastPosition}
        >
          <View
            key={toast.key}
            style={[
              styles.toast,
              toast.type === 'error' && styles.toastError,
              toast.type === 'removed' && styles.toastRemoved,
              toast.type === 'info' && styles.toastInfo,
            ]}
          >
            <View
              style={[
                styles.toastIcon,
                toast.type === 'error' && styles.toastIconError,
                toast.type === 'removed' && styles.toastIconRemoved,
                toast.type === 'info' && styles.toastIconInfo,
              ]}
            >
              <Text style={styles.toastIconText}>
                {toast.type === 'success'
                  ? '✓'
                  : toast.type === 'removed'
                    ? '−'
                    : toast.type === 'error'
                      ? '!'
                      : '…'}
              </Text>
            </View>

            <View style={styles.toastTextContainer}>
              <Text style={styles.toastTitle}>
                {toast.title}
              </Text>
              <Text style={styles.toastMessage}>
                {toast.message}
              </Text>
            </View>

            <View style={styles.toastSparkle}>
              <Text style={styles.sparkleText}>✦</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    color: COLORS.muted,
    marginTop: 12,
    fontSize: 15,
  },
  error: {
    color: COLORS.coral,
    fontSize: 16,
    textAlign: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  number: {
    alignSelf: 'flex-end',
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: '700',
  },
  artwork: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
    marginTop: 4,
  },
  imageFallback: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: COLORS.muted,
  },
  name: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '800',
    textTransform: 'capitalize',
    marginTop: 4,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  typeChip: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.coral,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  typeText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  teamButton: {
    backgroundColor: COLORS.coral,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 24,
    marginTop: 22,
    width: '100%',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.coral,
  },
  disabledButton: {
    opacity: 0.6,
  },
  teamButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  teamCount: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 12,
  },
  measurements: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.panel,
    borderRadius: 18,
    paddingVertical: 20,
    marginTop: 12,
    marginBottom: 20,
  },
  measurementItem: {
    flex: 1,
    alignItems: 'center',
  },
  measurementValue: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '800',
  },
  measurementLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 6,
  },
  measurementDivider: {
    width: 1,
    height: 38,
    backgroundColor: COLORS.track,
  },
  statsPanel: {
    backgroundColor: COLORS.panel,
    borderRadius: 18,
    padding: 18,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 5,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  statLabel: {
    color: COLORS.muted,
    width: 92,
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    color: COLORS.white,
    width: 32,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
    marginRight: 12,
  },
  statTrack: {
    flex: 1,
    height: 8,
    minWidth: 60,
    backgroundColor: COLORS.track,
    borderRadius: 10,
    overflow: 'hidden',
  },
  statFill: {
    height: '100%',
    backgroundColor: COLORS.coral,
    borderRadius: 10,
  },

  // Custom floating notification
  toastPosition: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 100,
    elevation: 12,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202C3D',
    borderWidth: 1,
    borderColor: '#FF7F6B',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  toastError: {
    borderColor: COLORS.red,
  },
  toastRemoved: {
    borderColor: '#718096',
  },
  toastInfo: {
    borderColor: '#60A5FA',
  },
  toastIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 127, 107, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toastIconError: {
    backgroundColor: 'rgba(255, 138, 138, 0.16)',
  },
  toastIconRemoved: {
    backgroundColor: 'rgba(167, 176, 192, 0.16)',
  },
  toastIconInfo: {
    backgroundColor: 'rgba(96, 165, 250, 0.16)',
  },
  toastIconText: {
    color: COLORS.coral,
    fontSize: 23,
    fontWeight: '900',
  },
  toastTextContainer: {
    flex: 1,
  },
  toastTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  toastMessage: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  toastSparkle: {
    marginLeft: 8,
    paddingLeft: 4,
  },
  sparkleText: {
    color: COLORS.coral,
    fontSize: 19,
  },
});
