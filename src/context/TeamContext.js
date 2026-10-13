
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TeamContext = createContext(null);
const STORAGE_KEY = '@pokedex_my_team';
const MAX_TEAM_SIZE = 6;

export function TeamProvider({ children }) {
  const [team, setTeam] = useState([]);
  const [ready, setReady] = useState(false);

  // Restore the saved team when the app starts.
  useEffect(() => {
    async function loadTeam() {
      try {
        const savedTeam = await AsyncStorage.getItem(STORAGE_KEY);

        if (savedTeam) {
          const parsedTeam = JSON.parse(savedTeam);

          if (Array.isArray(parsedTeam)) {
            setTeam(parsedTeam.slice(0, MAX_TEAM_SIZE));
          }
        }
      } catch (error) {
        console.warn('Could not restore saved team:', error);
      } finally {
        setReady(true);
      }
    }

    loadTeam();
  }, []);

  // Save the team whenever it changes, after the initial load.
  useEffect(() => {
    if (!ready) return;

    async function saveTeam() {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(team)
        );
      } catch (error) {
        console.warn('Could not save team:', error);
      }
    }

    saveTeam();
  }, [team, ready]);

  function addPokemon(pokemon) {
    if (!ready) {
      return { success: false, message: 'Team is still loading.' };
    }

    if (team.some((item) => item.id === pokemon.id)) {
      return { success: false, message: 'This Pokémon is already on your team.' };
    }

    if (team.length >= MAX_TEAM_SIZE) {
      return { success: false, message: 'Your team is full. Remove a Pokémon first.' };
    }

    setTeam((currentTeam) => {
      if (currentTeam.some((item) => item.id === pokemon.id)) {
        return currentTeam;
      }

      if (currentTeam.length >= MAX_TEAM_SIZE) {
        return currentTeam;
      }

      return [...currentTeam, pokemon];
    });

    return { success: true, message: `${pokemon.name} added to your team!` };
  }

  function removePokemon(id) {
    setTeam((currentTeam) =>
      currentTeam.filter((pokemon) => pokemon.id !== id)
    );
  }

  function isInTeam(id) {
    return team.some((pokemon) => pokemon.id === id);
  }

  return (
    <TeamContext.Provider
      value={{
        team,
        ready,
        maxTeamSize: MAX_TEAM_SIZE,
        addPokemon,
        removePokemon,
        isInTeam,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);

  if (!context) {
    throw new Error('useTeam must be used inside TeamProvider.');
  }

  return context;
}
