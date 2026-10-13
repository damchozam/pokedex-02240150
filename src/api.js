
const BASE_URL = 'https://pokeapi.co/api/v2';

// Fetch a paginated list of Pokémon
export async function getPokemonList(offset = 0, limit = 20) {
  const response = await fetch(
    `${BASE_URL}/pokemon?offset=${offset}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Unable to load Pokémon. Please try again.');
  }

  const data = await response.json();

  return data.results.map((pokemon) => {
    const id = Number(
      pokemon.url.split('/').filter(Boolean).pop()
    );

    return {
      id,
      name: pokemon.name,
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
    };
  });
}

// Fetch all Pokémon names, IDs, and artwork for search
export async function getAllPokemonNames() {
  const response = await fetch(`${BASE_URL}/pokemon?limit=1025`);

  if (!response.ok) {
    throw new Error('Unable to load Pokémon names.');
  }

  const data = await response.json();

  return data.results.map((pokemon) => {
    const id = Number(
      pokemon.url.split('/').filter(Boolean).pop()
    );

    return {
      id,
      name: pokemon.name,
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
    };
  });
}

// Fetch full details of a specific Pokémon
export async function getPokemonDetails(id) {
  const response = await fetch(`${BASE_URL}/pokemon/${id}`);

  if (!response.ok) {
    throw new Error('Unable to load Pokémon details.');
  }

  return response.json();
}
