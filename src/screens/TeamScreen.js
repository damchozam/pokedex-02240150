
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTeam } from '../context/TeamContext';

const COLORS = {
  background: '#111827',
  panel: '#1F2937',
  coral: '#FF7F6B',
  white: '#FFFFFF',
  muted: '#A7B0C0',
  track: '#374151',
  green: '#81D6B1',
};

const STAT_LABELS = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Attack',
  'special-defense': 'Sp. Defense',
  speed: 'Speed',
};

const STAT_NAMES = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
];

const CARD_COLORS = [
  '#F6C7A8',
  '#B8DCD4',
  '#D2C7F0',
  '#F1D88D',
  '#BFD7F0',
  '#F0BFC6',
];

export default function TeamScreen({ navigation }) {
  const {
    team,
    ready,
    removePokemon,
    maxTeamSize,
  } = useTeam();

  const combinedStats = STAT_NAMES.reduce((totals, statName) => {
    totals[statName] = team.reduce((sum, pokemon) => {
      const stat = pokemon.stats?.find(
        (item) => item.name === statName
      );

      return sum + (stat?.value || 0);
    }, 0);

    return totals;
  }, {});

  function capitalize(name = '') {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  function openPokemon(pokemon) {
    navigation.getParent()?.navigate('Detail', { id: pokemon.id });
  }

  function renderPokemon({ item, index }) {
    const cardColor = CARD_COLORS[index % CARD_COLORS.length];

    return (
      <View style={styles.pokemonCard}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.cardArtwork, { backgroundColor: cardColor }]}
          onPress={() => openPokemon(item)}
        >
          <Text style={styles.cardNumber}>
            #{String(item.id).padStart(4, '0')}
          </Text>

          <Image
            source={{ uri: item.image }}
            style={styles.pokemonImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={styles.cardInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.pokemonName} numberOfLines={1}>
              {capitalize(item.name)}
            </Text>

            <Text style={styles.typeText} numberOfLines={1}>
              {item.types?.join(' / ') || 'Pokémon'}
            </Text>
          </View>

          <TouchableOpacity
            accessibilityLabel={`Remove ${item.name} from team`}
            style={styles.removeButton}
            onPress={() => removePokemon(item.id)}
          >
            <Text style={styles.removeButtonText}>−</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.coral} />
        <Text style={styles.emptyDescription}>
          Loading your saved team...
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={team}
      renderItem={renderPokemon}
      keyExtractor={(item) => String(item.id)}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>TRAINER PROFILE / 002</Text>

            <Text style={styles.title}>
              My Pokémon
              {'\n'}
              <Text style={styles.titleAccent}>Team.</Text>
            </Text>

            <Text style={styles.subtitle}>
              Your companions, your adventure.
            </Text>

            <View style={styles.teamSummary}>
              <View>
                <Text style={styles.summaryLabel}>TEAM ROSTER</Text>
                <Text style={styles.summaryValue}>
                  {team.length}
                  <Text style={styles.summaryTotal}> / {maxTeamSize}</Text>
                </Text>
              </View>

              <View style={styles.slotContainer}>
                {Array.from({ length: maxTeamSize }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.slot,
                      index < team.length && styles.filledSlot,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          {team.length > 0 && (
            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionTitle}>YOUR LINEUP</Text>
                <Text style={styles.sectionSubtitle}>
                  Tap artwork to view details
                </Text>
              </View>
              <Text style={styles.count}>
                {team.length} SELECTED
              </Text>
            </View>
          )}

          {team.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptySymbol}>＋</Text>
              <Text style={styles.emptyTitle}>Your journey starts here</Text>
              <Text style={styles.emptyDescription}>
                Your team is empty. Visit the Pokédex, open a Pokémon,
                and tap "Add to My Team" to recruit your first companion.
              </Text>

              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => navigation.navigate('Pokédex')}
              >
                <Text style={styles.exploreButtonText}>
                  Explore Pokédex →
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {team.length > 0 && (
            <View style={styles.statsPanel}>
              <Text style={styles.statsTitle}>Combined Base Stats</Text>
              <Text style={styles.statsSubtitle}>
                Total base stats across your {team.length}{' '}
                {team.length === 1 ? 'Pokémon' : 'Pokémon'}
              </Text>

              {STAT_NAMES.map((statName) => {
                const value = combinedStats[statName];
                const maximum = team.length * 255;
                const percentage = maximum
                  ? Math.min((value / maximum) * 100, 100)
                  : 0;

                return (
                  <View key={statName} style={styles.statRow}>
                    <Text style={styles.statLabel}>
                      {STAT_LABELS[statName]}
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
          )}
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListFooterComponent={
        team.length > 0 ? (
          <TouchableOpacity
            style={styles.addMoreButton}
            onPress={() => navigation.navigate('Pokédex')}
          >
            <Text style={styles.addMoreText}>
              +  Discover more Pokémon
            </Text>
          </TouchableOpacity>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    paddingTop: 22,
    paddingBottom: 22,
  },
  eyebrow: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    color: COLORS.white,
    fontSize: 35,
    fontWeight: '900',
    lineHeight: 39,
    letterSpacing: -1,
    marginTop: 20,
  },
  titleAccent: {
    color: COLORS.coral,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 12,
  },
  teamSummary: {
    backgroundColor: COLORS.panel,
    borderRadius: 17,
    padding: 18,
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  summaryValue: {
    color: COLORS.white,
    fontSize: 29,
    fontWeight: '900',
    marginTop: 4,
  },
  summaryTotal: {
    color: COLORS.muted,
    fontSize: 16,
  },
  slotContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  slot: {
    width: 13,
    height: 27,
    borderRadius: 5,
    backgroundColor: COLORS.track,
  },
  filledSlot: {
    backgroundColor: COLORS.coral,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 5,
  },
  count: {
    color: COLORS.coral,
    fontSize: 9,
    fontWeight: '800',
  },
  pokemonCard: {
    backgroundColor: COLORS.panel,
    borderRadius: 17,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  cardArtwork: {
    width: 105,
    height: 105,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardNumber: {
    alignSelf: 'flex-start',
    marginLeft: 9,
    marginTop: 7,
    fontSize: 9,
    color: '#26303D',
    fontWeight: '800',
  },
  pokemonImage: {
    width: 85,
    height: 78,
    marginTop: -2,
  },
  cardInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameContainer: {
    flex: 1,
  },
  pokemonName: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  typeText: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 6,
    textTransform: 'capitalize',
  },
  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#3A2930',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: COLORS.coral,
    fontSize: 23,
    fontWeight: '700',
    marginTop: -2,
  },
  statsPanel: {
    backgroundColor: COLORS.panel,
    padding: 18,
    borderRadius: 17,
    marginTop: 24,
  },
  statsTitle: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: '900',
  },
  statsSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
    marginBottom: 22,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  statLabel: {
    width: 84,
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    width: 42,
    textAlign: 'right',
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
    marginRight: 12,
  },
  statTrack: {
    flex: 1,
    height: 7,
    backgroundColor: COLORS.track,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statFill: {
    height: '100%',
    backgroundColor: COLORS.coral,
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: COLORS.panel,
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 30,
    marginTop: 8,
  },
  emptySymbol: {
    color: COLORS.coral,
    fontSize: 42,
    fontWeight: '400',
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 10,
  },
  exploreButton: {
    backgroundColor: COLORS.coral,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 13,
    marginTop: 20,
  },
  exploreButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '900',
  },
  addMoreButton: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 13,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  addMoreText: {
    color: COLORS.coral,
    fontSize: 13,
    fontWeight: '800',
  },
});
