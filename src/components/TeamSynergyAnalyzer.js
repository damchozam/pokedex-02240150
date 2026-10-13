
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const TYPE_CHART = {
  normal: {
    strong: [],
    weak: [],
    immune: ['ghost'],
  },
  fire: {
    strong: ['grass', 'ice', 'bug', 'steel'],
    weak: ['fire', 'water', 'rock', 'dragon'],
    immune: [],
  },
  water: {
    strong: ['fire', 'ground', 'rock'],
    weak: ['water', 'grass', 'dragon'],
    immune: [],
  },
  electric: {
    strong: ['water', 'flying'],
    weak: ['electric', 'grass', 'dragon'],
    immune: ['ground'],
  },
  grass: {
    strong: ['water', 'ground', 'rock'],
    weak: [
      'fire',
      'grass',
      'poison',
      'flying',
      'bug',
      'dragon',
      'steel',
    ],
    immune: [],
  },
  ice: {
    strong: ['grass', 'ground', 'flying', 'dragon'],
    weak: ['fire', 'water', 'ice', 'steel'],
    immune: [],
  },
  fighting: {
    strong: ['normal', 'ice', 'rock', 'dark', 'steel'],
    weak: ['poison', 'flying', 'psychic', 'bug', 'fairy'],
    immune: ['ghost'],
  },
  poison: {
    strong: ['grass', 'fairy'],
    weak: ['poison', 'ground', 'rock', 'ghost'],
    immune: ['steel'],
  },
  ground: {
    strong: ['fire', 'electric', 'poison', 'rock', 'steel'],
    weak: ['grass', 'bug'],
    immune: ['flying'],
  },
  flying: {
    strong: ['grass', 'fighting', 'bug'],
    weak: ['electric', 'rock', 'steel'],
    immune: [],
  },
  psychic: {
    strong: ['fighting', 'poison'],
    weak: ['psychic', 'steel'],
    immune: ['dark'],
  },
  bug: {
    strong: ['grass', 'psychic', 'dark'],
    weak: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'],
    immune: [],
  },
  rock: {
    strong: ['fire', 'ice', 'flying', 'bug'],
    weak: ['fighting', 'ground', 'steel'],
    immune: [],
  },
  ghost: {
    strong: ['psychic', 'ghost'],
    weak: ['dark'],
    immune: ['normal'],
  },
  dragon: {
    strong: ['dragon'],
    weak: ['steel'],
    immune: ['fairy'],
  },
  dark: {
    strong: ['psychic', 'ghost'],
    weak: ['fighting', 'dark', 'fairy'],
    immune: [],
  },
  steel: {
    strong: ['ice', 'rock', 'fairy'],
    weak: ['fire', 'water', 'electric', 'steel'],
    immune: [],
  },
  fairy: {
    strong: ['fighting', 'dragon', 'dark'],
    weak: ['fire', 'poison', 'steel'],
    immune: [],
  },
};

const ALL_TYPES = Object.keys(TYPE_CHART);

function getEffectiveness(attackType, defendingTypes) {
  let multiplier = 1;

  defendingTypes.forEach(function (defendingType) {
    const defendingChart = TYPE_CHART[defendingType];

    if (!defendingChart) {
      return;
    }

    if (defendingChart.immune.includes(attackType)) {
      multiplier = 0;
      return;
    }

    if (defendingChart.strong.includes(attackType)) {
      multiplier *= 2;
    }

    if (defendingChart.weak.includes(attackType)) {
      multiplier *= 0.5;
    }
  });

  return multiplier;
}

function getTypeLabel(type) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function TypeChip({ type, count, variant }) {
  return (
    <View
      style={[
        styles.typeChip,
        variant === 'weak' && styles.weakChip,
        variant === 'resist' && styles.resistChip,
        variant === 'coverage' && styles.coverageChip,
      ]}
    >
      <Text style={styles.typeChipText}>
        {getTypeLabel(type)}
      </Text>
      {typeof count === 'number' && (
        <Text style={styles.countText}>{count}</Text>
      )}
    </View>
  );
}

export default function TeamSynergyAnalyzer({ team = [] }) {
  if (!Array.isArray(team) || team.length === 0) {
    return null;
  }

  const teamWithTypes = team.filter(function (pokemon) {
    return Array.isArray(pokemon.types) && pokemon.types.length > 0;
  });

  if (teamWithTypes.length === 0) {
    return null;
  }

  const analysis = ALL_TYPES.map(function (attackType) {
    let weakCount = 0;
    let resistCount = 0;
    let immuneCount = 0;

    teamWithTypes.forEach(function (pokemon) {
      const multiplier = getEffectiveness(
        attackType,
        pokemon.types
      );

      if (multiplier > 1) {
        weakCount += 1;
      } else if (multiplier === 0) {
        immuneCount += 1;
      } else if (multiplier < 1) {
        resistCount += 1;
      }
    });

    return {
      type: attackType,
      weakCount: weakCount,
      resistCount: resistCount,
      immuneCount: immuneCount,
    };
  });

  const weaknesses = analysis
    .filter(function (item) {
      return item.weakCount > 0;
    })
    .sort(function (a, b) {
      return b.weakCount - a.weakCount;
    })
    .slice(0, 4);

  const resistances = analysis
    .filter(function (item) {
      return item.resistCount > 0 || item.immuneCount > 0;
    })
    .sort(function (a, b) {
      const scoreA = a.resistCount + a.immuneCount;
      const scoreB = b.resistCount + b.immuneCount;
      return scoreB - scoreA;
    })
    .slice(0, 4);

  const offensiveCoverage = ALL_TYPES.filter(function (defendingType) {
    return teamWithTypes.some(function (pokemon) {
      return pokemon.types.some(function (attackType) {
        return getEffectiveness(attackType, [defendingType]) > 1;
      });
    });
  });

  const sharedWeaknesses = analysis.filter(function (item) {
    return (
      item.weakCount >= 2 &&
      item.weakCount >= Math.ceil(teamWithTypes.length / 2)
    );
  });

  let balanceTitle = 'Good type coverage';
  let balanceDescription =
    'Your team has a mix of defensive matchups. Keep checking for overlapping weaknesses as you add Pokémon.';

  if (teamWithTypes.length < 3) {
    balanceTitle = 'Team analysis started';
    balanceDescription =
      'Add more Pokémon to get a clearer picture of your team’s strengths and weaknesses.';
  } else if (sharedWeaknesses.length > 0) {
    balanceTitle = 'Watch your shared weaknesses';
    balanceDescription =
      'Several team members may struggle against the same attacking types. Consider adding a Pokémon with different defensive strengths.';
  } else if (weaknesses.length >= 3) {
    balanceTitle = 'Some defensive overlap';
    balanceDescription =
      'Review the weaknesses below when choosing your next team member.';
  }

  const mainThreat =
    weaknesses.length > 0 ? weaknesses[0] : null;

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>TEAM RESEARCH LAB</Text>
      <Text style={styles.title}>Team Synergy Analyzer</Text>
      <Text style={styles.subtitle}>
        Explore how your Pokémon types work together.
      </Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>TEAM BALANCE</Text>
        <Text style={styles.balanceTitle}>{balanceTitle}</Text>
        <Text style={styles.description}>
          {balanceDescription}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shared Weaknesses</Text>
        <Text style={styles.sectionDescription}>
          Types that can deal super-effective damage to your team.
        </Text>

        {weaknesses.length > 0 ? (
          <View style={styles.chipContainer}>
            {weaknesses.map(function (item) {
              return (
                <TypeChip
                  key={item.type}
                  type={item.type}
                  count={item.weakCount}
                  variant="weak"
                />
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>
            No shared weaknesses found in this analysis.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resistances and Immunities</Text>
        <Text style={styles.sectionDescription}>
          Types your Pokémon may defend against well.
        </Text>

        {resistances.length > 0 ? (
          <View style={styles.chipContainer}>
            {resistances.map(function (item) {
              return (
                <TypeChip
                  key={item.type}
                  type={item.type}
                  count={item.resistCount + item.immuneCount}
                  variant="resist"
                />
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>
            Add more Pokémon to discover defensive advantages.
          </Text>
        )}

        <Text style={styles.note}>
          Counts show how many team members resist or are immune to each
          attacking type.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offensive Type Coverage</Text>
        <Text style={styles.sectionDescription}>
          Types your Pokémon’s own types can hit super effectively.
        </Text>

        <View style={styles.chipContainer}>
          {offensiveCoverage.length > 0 ? (
            offensiveCoverage.map(function (type) {
              return (
                <TypeChip
                  key={type}
                  type={type}
                  variant="coverage"
                />
              );
            })
          ) : (
            <Text style={styles.emptyText}>
              No coverage information is available yet.
            </Text>
          )}
        </View>

        <Text style={styles.note}>
          This estimates type potential, not actual move sets or move
          availability.
        </Text>
      </View>

      <View style={styles.suggestionCard}>
        <Text style={styles.suggestionTitle}>Research Suggestion</Text>
        {mainThreat ? (
          <Text style={styles.description}>
            {getTypeLabel(mainThreat.type)} attacks threaten{' '}
            {mainThreat.weakCount} of your team members. Check their
            individual matchups before choosing your next Pokémon.
          </Text>
        ) : (
          <Text style={styles.description}>
            Try building a team with different type combinations to explore
            more matchups and defensive options.
          </Text>
        )}
      </View>

      <Text style={styles.footer}>
        Analysis is based on standard Pokémon type effectiveness. It does
        not account for abilities, held items, or individual moves.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 16,
    marginTop: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#30394B',
  },
  eyebrow: {
    color: '#FF7B72',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    marginTop: 6,
  },
  subtitle: {
    color: '#AAB4C5',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  balanceCard: {
    backgroundColor: '#202B3D',
    borderRadius: 14,
    padding: 13,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FF7B72',
  },
  balanceLabel: {
    color: '#FF9B91',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  balanceTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 5,
  },
  description: {
    color: '#C5CDDA',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionDescription: {
    color: '#9DA9BB',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C3547',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 11,
    gap: 6,
    borderWidth: 1,
    borderColor: '#485267',
  },
  weakChip: {
    backgroundColor: '#42272F',
    borderColor: '#9C4855',
  },
  resistChip: {
    backgroundColor: '#193A38',
    borderColor: '#397C70',
  },
  coverageChip: {
    backgroundColor: '#29334A',
    borderColor: '#526B9A',
  },
  typeChipText: {
    color: '#F4F6FA',
    fontSize: 12,
    fontWeight: '700',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyText: {
    color: '#AAB4C5',
    fontSize: 12,
    lineHeight: 18,
  },
  note: {
    color: '#8996AA',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 9,
  },
  suggestionCard: {
    backgroundColor: '#282A3B',
    borderRadius: 14,
    padding: 13,
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#49415D',
  },
  suggestionTitle: {
    color: '#FF9B91',
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    color: '#8996AA',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 14,
  },
});
