
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';

import {
  getPokemonList,
  getAllPokemonNames,
} from '../api';

const INITIAL_OFFSET = 150;
const PAGE_SIZE = 20;

const CARD_COLORS = [
  '#F6C7A8',
  '#B8DCD4',
  '#D2C7F0',
  '#F1D88D',
  '#BFD7F0',
  '#F0BFC6',
];

export default function PokedexScreen({ navigation }) {
  const [pokemon, setPokemon] = useState([]);
  const [offset, setOffset] = useState(INITIAL_OFFSET);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const loadingRef = useRef(false);
  const allNamesRef = useRef(null);

  async function loadPokemon(reset = false) {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setError('');

    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const currentOffset = reset ? INITIAL_OFFSET : offset;

    try {
      const results = await getPokemonList(
        currentOffset,
        PAGE_SIZE
      );

      setPokemon((previous) => {
        const existing = new Set(
          reset ? [] : previous.map((item) => item.id)
        );

        const newItems = results.filter(
          (item) => !existing.has(item.id)
        );

        return reset ? newItems : [...previous, ...newItems];
      });

      setOffset(currentOffset + results.length);
      setHasMore(results.length === PAGE_SIZE);
    } catch (err) {
      setError(err.message || 'Could not load Pokémon.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadPokemon(true);
  }, []);

  useEffect(() => {
    const term = query.trim().toLowerCase();
    let cancelled = false;

    if (!term) {
      setSearchResults(null);
      setSearching(false);
      setSearchError('');
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchError('');

      try {
        if (!allNamesRef.current) {
          allNamesRef.current = await getAllPokemonNames();
        }

        if (cancelled) return;

        const matches = allNamesRef.current.filter((item) =>
          item.name.includes(term)
        );

        setSearchResults(matches);
      } catch (err) {
        if (!cancelled) {
          setSearchError(
            'Search failed. Check your internet and try again.'
          );
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function capitalize(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  function renderPokemon({ item }) {
    const cardColor = CARD_COLORS[item.id % CARD_COLORS.length];

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.card, { backgroundColor: cardColor }]}
       onPress={() =>
  navigation.getParent()?.navigate('Detail', { id: item.id })
}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardNumber}>
            #{String(item.id).padStart(4, '0')}
          </Text>
          <Text style={styles.pokeballMark}>✦</Text>
        </View>

        <Image
          source={{ uri: item.image }}
          style={styles.pokemonImage}
          resizeMode="contain"
        />

        <View style={styles.cardBottom}>
          <Text style={styles.pokemonName} numberOfLines={1}>
            {capitalize(item.name)}
          </Text>
          <Text style={styles.cardCaption}>FIELD ENTRY</Text>
        </View>
      </TouchableOpacity>
    );
  }

  const displayedPokemon =
    searchResults === null ? pokemon : searchResults;

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#FF986B" />
        <Text style={styles.loadingText}>
          Preparing your field guide...
        </Text>
      </View>
    );
  }

  if (error && pokemon.length === 0) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadPokemon(true)}
        >
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <FlatList
        key="pokemon-grid"
        data={displayedPokemon}
        renderItem={renderPokemon}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        onEndReached={() => {
          if (
            searchResults === null &&
            !loadingRef.current &&
            hasMore &&
            !error
          ) {
            loadPokemon(false);
          }
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View>
            <View style={styles.hero}>
              <View style={styles.heroTop}>
                <Text style={styles.eyebrow}>
                  TRAINER'S JOURNAL / 001
                </Text>
                <View style={styles.liveTag}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE DATA</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>
                The Pokémon
                {'\n'}
                <Text style={styles.heroAccent}>Field Guide.</Text>
              </Text>

              <Text style={styles.heroDescription}>
                Every discovery starts somewhere.
                {'\n'}
                Find your next favourite.
              </Text>

              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>⌕</Text>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search any Pokémon..."
                  placeholderTextColor="#A5ACB8"
                  style={styles.searchInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />

                {query.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setQuery('')}
                  >
                    <Text style={styles.clearSearch}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.sectionHeading}>
                <View>
                  <Text style={styles.sectionTitle}>
                    {query.trim()
                      ? 'SEARCH RESULTS'
                      : 'YOUR DISCOVERIES'}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {query.trim()
                      ? 'Searching the complete Pokédex'
                      : 'A collection of extraordinary creatures'}
                  </Text>
                </View>

                <Text style={styles.count}>
                  {query.trim()
                    ? searching
                      ? '...'
                      : displayedPokemon.length
                    : pokemon.length}
                  {' '}
                  {query.trim() ? 'FOUND' : 'LOADED'}
                </Text>
              </View>
            </View>

            {searching && (
              <View style={styles.searchStatus}>
                <ActivityIndicator color="#FF986B" />
                <Text style={styles.statusText}>
                  Searching all Pokémon...
                </Text>
              </View>
            )}

            {searchError !== '' && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>
                  Search unavailable
                </Text>
                <Text style={styles.statusText}>
                  {searchError}
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    allNamesRef.current = null;
                    setQuery((value) => value + ' ');
                    setTimeout(() => {
                      setQuery((value) => value.trim());
                    }, 50);
                  }}
                >
                  <Text style={styles.retryText}>Retry search</Text>
                </TouchableOpacity>
              </View>
            )}

            {!searching &&
              !searchError &&
              query.trim() !== '' &&
              displayedPokemon.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptySymbol}>?</Text>
                  <Text style={styles.emptyTitle}>
                    No discoveries yet
                  </Text>
                  <Text style={styles.statusText}>
                    No Pokémon match "{query.trim()}". Try another name.
                  </Text>
                </View>
              )}

            {error !== '' && pokemon.length > 0 && (
              <TouchableOpacity
                style={styles.retryBanner}
                onPress={() => loadPokemon(false)}
              >
                <Text style={styles.errorText}>
                  Could not load more. Tap to retry.
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListFooterComponent={
          searchResults !== null ? null : loadingMore ? (
            <ActivityIndicator
              color="#FF986B"
              size="large"
              style={{ padding: 24 }}
            />
          ) : !hasMore ? (
            <Text style={styles.endText}>
              YOU'VE REACHED THE END OF THIS JOURNEY
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  listContent: {
    paddingBottom: 28,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: '#A6B0C0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#243044',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#81D6B1',
    marginRight: 6,
  },
  liveText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#DCE7F2',
    letterSpacing: 1,
  },
  heroTitle: {
    marginTop: 23,
    color: '#F9FAFB',
    fontSize: 35,
    lineHeight: 39,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  heroAccent: {
    color: '#FF986B',
  },
  heroDescription: {
    color: '#A6B0C0',
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
  },
  searchBox: {
    height: 52,
    marginTop: 22,
    marginBottom: 24,
    borderRadius: 14,
    backgroundColor: '#222D3E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#344156',
  },
  searchIcon: {
    fontSize: 28,
    color: '#FF986B',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 8,
  },
  clearSearch: {
    color: '#FFFFFF',
    fontSize: 18,
    padding: 6,
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#F9FAFB',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  sectionSubtitle: {
    color: '#8F9BAD',
    fontSize: 11,
    marginTop: 5,
  },
  count: {
    color: '#FF986B',
    fontSize: 10,
    fontWeight: '800',
  },
  gridRow: {
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  card: {
    width: '47.5%',
    borderRadius: 18,
    marginBottom: 13,
    padding: 12,
    minHeight: 202,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardNumber: {
    color: '#26303D',
    fontSize: 11,
    fontWeight: '800',
    opacity: 0.75,
  },
  pokeballMark: {
    color: '#26303D',
    fontSize: 17,
    opacity: 0.65,
  },
  pokemonImage: {
    width: '100%',
    height: 118,
    marginTop: 1,
  },
  cardBottom: {
    marginTop: 4,
  },
  pokemonName: {
    color: '#202A37',
    fontSize: 17,
    fontWeight: '900',
  },
  cardCaption: {
    marginTop: 4,
    color: '#364351',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.4,
    opacity: 0.7,
  },
  searchStatus: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    color: '#A6B0C0',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 30,
  },
  emptySymbol: {
    color: '#FF986B',
    fontSize: 42,
    fontWeight: '900',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#DCE7F2',
    marginTop: 14,
  },
  errorText: {
    color: '#FFB4A2',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF986B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  retryText: {
    color: '#111827',
    fontWeight: '800',
  },
  retryBanner: {
    padding: 15,
  },
  endText: {
    textAlign: 'center',
    color: '#8F9BAD',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.1,
    padding: 24,
  },
});
