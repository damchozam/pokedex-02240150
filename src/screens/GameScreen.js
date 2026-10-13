
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getPokemonList, getPokemonDetails } from '../api';

const COLORS = {
  background: '#111827',
  panel: '#1F2937',
  coral: '#FF7F6B',
  white: '#FFFFFF',
  muted: '#A7B0C0',
  green: '#81D6B1',
  red: '#F87171',
  track: '#374151',
};

const BEST_STREAK_KEY = '@pokedex_best_streak';

function shuffle(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function capitalize(name = '') {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function GameScreen() {
  const [pokemonList, setPokemonList] = useState([]);
  const [pokemon, setPokemon] = useState(null);
  const [choices, setChoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answered, setAnswered] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);

  useEffect(() => {
    let active = true;

    async function initialiseGame() {
      try {
        const [list, savedBest] = await Promise.all([
          getPokemonList(0, 151),
          AsyncStorage.getItem(BEST_STREAK_KEY),
        ]);

        if (!active) return;

        setPokemonList(list);

        const parsedBest = Number(savedBest || 0);
        setBestStreak(
          Number.isFinite(parsedBest) ? parsedBest : 0
        );

        await startRound(list, null, active);
      } catch {
        if (active) {
          setError(
            'Could not load the game. Check your internet connection and retry.'
          );
          setLoading(false);
        }
      }
    }

    initialiseGame();

    return () => {
      active = false;
    };
  }, []);

  async function startRound(list = pokemonList, previousId = pokemon?.id, active = true) {
    if (!list.length) {
      setError('Pokémon data is not available yet.');
      return;
    }

    setLoading(true);
    setError('');
    setAnswered(false);
    setSelectedId(null);
    setHintUsed(false);
    setPokemon(null);
    setChoices([]);

    try {
      let available = list.filter((item) => item.id !== previousId);

      if (available.length < 4) {
        available = list;
      }

      const answer = available[
        Math.floor(Math.random() * available.length)
      ];

      const wrongChoices = shuffle(
        list.filter((item) => item.id !== answer.id)
      ).slice(0, 3);

      const detail = await getPokemonDetails(answer.id);

      if (!active) return;

      setPokemon({
        ...answer,
        types: detail.types.map((item) => item.type.name),
        artwork:
          detail.sprites?.other?.['official-artwork']?.front_default ||
          detail.sprites?.front_default ||
          answer.image,
      });

      setChoices(shuffle([answer, ...wrongChoices]));
    } catch {
      if (active) {
        setError('Could not load the next Pokémon. Please try again.');
      }
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }

  async function handleAnswer(choice) {
    if (answered || !pokemon) return;

    setSelectedId(choice.id);
    setAnswered(true);

    if (choice.id === pokemon.id) {
      setScore((current) => current + 1);

      const nextStreak = streak + 1;
      setStreak(nextStreak);

      if (nextStreak > bestStreak) {
        setBestStreak(nextStreak);

        try {
          await AsyncStorage.setItem(
            BEST_STREAK_KEY,
            String(nextStreak)
          );
        } catch {
          // The game remains playable if saving fails.
        }
      }
    } else {
      setStreak(0);
    }
  }

  function handleNext() {
    startRound(pokemonList, pokemon?.id, true);
  }

  function retryGame() {
    setScore(0);
    setStreak(0);
    startRound(pokemonList, pokemon?.id, true);
  }

  const hintText = pokemon?.types?.length
    ? `Type: ${pokemon.types.map(capitalize).join(' / ')}`
    : 'Type information is not available.';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>TRAINER CHALLENGE / 003</Text>

        <Text style={styles.title}>
          Who's that
          {'\n'}
          <Text style={styles.titleAccent}>Pokémon?</Text>
        </Text>

        <Text style={styles.subtitle}>
          Recognise the silhouette and test your knowledge.
        </Text>
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>CURRENT STREAK</Text>
          <Text style={styles.scoreValue}>{streak}</Text>
        </View>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>BEST STREAK</Text>
          <Text style={styles.scoreValue}>{bestStreak}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingPanel}>
          <ActivityIndicator size="large" color={COLORS.coral} />
          <Text style={styles.loadingText}>
            Finding a mystery Pokémon...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorPanel}>
          <Text style={styles.errorTitle}>Game unavailable</Text>
          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              if (pokemonList.length) {
                startRound(pokemonList, pokemon?.id, true);
              } else {
                Alert.alert(
                  'Please reload',
                  'Restart the app to load Pokémon data again.'
                );
              }
            }}
          >
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : pokemon ? (
        <>
          <View style={styles.mysteryPanel}>
            <View style={styles.mysteryHeader}>
              <Text style={styles.mysteryLabel}>MYSTERY CREATURE</Text>
              <Text style={styles.questionMark}>?</Text>
            </View>

            <View style={styles.imageStage}>
              <Image
                source={{ uri: pokemon.artwork }}
                style={[
                  styles.silhouette,
                  !answered && styles.hiddenSilhouette,
                ]}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.prompt}>
              {answered
                ? capitalize(pokemon.name)
                : 'Can you identify this Pokémon?'}
            </Text>

            {answered && (
              <Text
                style={[
                  styles.feedback,
                  selectedId === pokemon.id
                    ? styles.correctFeedback
                    : styles.wrongFeedback,
                ]}
              >
                {selectedId === pokemon.id
                  ? 'Correct! Great recognition!'
                  : `Not quite! It was ${capitalize(pokemon.name)}.`}
              </Text>
            )}

            {hintUsed && !answered && (
              <View style={styles.hintBox}>
                <Text style={styles.hintText}>{hintText}</Text>
              </View>
            )}
          </View>

          <View style={styles.answerSection}>
            <Text style={styles.sectionTitle}>CHOOSE YOUR ANSWER</Text>

            {choices.map((choice, index) => {
              const isCorrect = choice.id === pokemon.id;
              const isSelected = choice.id === selectedId;

              let choiceStyle = styles.choiceButton;

              if (answered && isCorrect) {
                choiceStyle = [
                  styles.choiceButton,
                  styles.correctChoice,
                ];
              } else if (answered && isSelected && !isCorrect) {
                choiceStyle = [
                  styles.choiceButton,
                  styles.wrongChoice,
                ];
              }

              return (
                <TouchableOpacity
                  key={choice.id}
                  disabled={answered}
                  activeOpacity={0.8}
                  style={choiceStyle}
                  onPress={() => handleAnswer(choice)}
                >
                  <Text style={styles.choiceLetter}>
                    {String.fromCharCode(65 + index)}
                  </Text>

                  <Text style={styles.choiceName}>
                    {capitalize(choice.name)}
                  </Text>

                  {answered && isCorrect && (
                    <Text style={styles.choiceIndicator}>✓</Text>
                  )}

                  {answered && isSelected && !isCorrect && (
                    <Text style={styles.choiceIndicator}>✕</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {!answered ? (
            <TouchableOpacity
              style={styles.hintButton}
              onPress={() => setHintUsed(true)}
              disabled={hintUsed}
            >
              <Text style={styles.hintButtonText}>
                {hintUsed ? 'Hint revealed' : '✦  Reveal a Hint'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleNext}
            >
              <Text style={styles.primaryButtonText}>
                Next Pokémon  →
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : null}

      <Text style={styles.footer}>
        FIRST 151 POKÉMON  ·  KEEP YOUR STREAK ALIVE
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 18,
    paddingBottom: 32,
  },
  hero: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  eyebrow: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: COLORS.white,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    marginTop: 18,
  },
  titleAccent: {
    color: COLORS.coral,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: COLORS.panel,
    borderRadius: 13,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  scoreLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  scoreValue: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 7,
  },
  loadingPanel: {
    backgroundColor: COLORS.panel,
    borderRadius: 18,
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 14,
  },
  errorPanel: {
    backgroundColor: COLORS.panel,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  errorTitle: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: '800',
  },
  errorText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 10,
  },
  mysteryPanel: {
    backgroundColor: COLORS.panel,
    borderRadius: 20,
    padding: 17,
    alignItems: 'center',
  },
  mysteryHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mysteryLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  questionMark: {
    color: COLORS.coral,
    fontSize: 22,
    fontWeight: '900',
  },
  imageStage: {
    width: '100%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    backgroundColor: '#182233',
    borderRadius: 16,
  },
  silhouette: {
    width: 205,
    height: 205,
  },
  hiddenSilhouette: {
    tintColor: '#05070B',
  },
  prompt: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 16,
  },
  feedback: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 9,
  },
  correctFeedback: {
    color: COLORS.green,
  },
  wrongFeedback: {
    color: COLORS.red,
  },
  hintBox: {
    alignSelf: 'stretch',
    backgroundColor: '#293449',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  hintText: {
    color: COLORS.green,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  answerSection: {
    marginTop: 24,
  },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 12,
  },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.track,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 15,
    marginBottom: 9,
  },
  correctChoice: {
    backgroundColor: '#18352F',
    borderColor: COLORS.green,
  },
  wrongChoice: {
    backgroundColor: '#3A252D',
    borderColor: COLORS.red,
  },
  choiceLetter: {
    color: COLORS.coral,
    fontSize: 12,
    fontWeight: '900',
    width: 30,
  },
  choiceName: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  choiceIndicator: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
  },
  hintButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 7,
    borderWidth: 1,
    borderColor: '#465166',
    borderRadius: 13,
  },
  hintButtonText: {
    color: COLORS.coral,
    fontSize: 13,
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: COLORS.coral,
    borderRadius: 13,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 18,
  },
  primaryButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '900',
  },
  footer: {
    color: '#697589',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 26,
  },
});
