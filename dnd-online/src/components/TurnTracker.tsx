import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { useGameStore } from '../store/gameStore';
import { Database } from '../types/supabase';

type Turn = Database['public']['Tables']['turns']['Row'];
type Character = Database['public']['Tables']['characters']['Row'];

interface TurnTrackerProps {
  isDM: boolean;
}

const TurnTracker = ({ isDM }: TurnTrackerProps) => {
  const { user } = useAuth();
  const { currentCampaign, characters } = useGameStore();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [encounterActive, setEncounterActive] = useState(false);
  const [initiativeValues, setInitiativeValues] = useState<Record<string, number>>({});

  // Fetch turn data
  useEffect(() => {
    const fetchTurns = async () => {
      try {
        if (!currentCampaign) return;

        setLoading(true);

        // Get turns for this campaign
        const { data, error } = await supabase
          .from('turns')
          .select('*')
          .eq('campaign_id', currentCampaign.id)
          .order('turn_order', { ascending: true });

        if (error) throw error;

        setTurns(data || []);
        setEncounterActive(data && data.length > 0);
      } catch (error) {
        console.error('Error fetching turns:', error);
        setError('Failed to load turn data.');
      } finally {
        setLoading(false);
      }
    };

    fetchTurns();

    // Set up realtime subscription
    if (currentCampaign) {
      const turnSubscription = supabase
        .channel(`turns:${currentCampaign.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'turns',
          filter: `campaign_id=eq.${currentCampaign.id}`
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setTurns(prev => [...prev, payload.new as Turn].sort((a, b) => a.turn_order - b.turn_order));
            setEncounterActive(true);
          } else if (payload.eventType === 'UPDATE') {
            setTurns(prev =>
              prev.map(t => t.id === payload.new.id ? payload.new : t)
                .sort((a, b) => a.turn_order - b.turn_order)
            );
          } else if (payload.eventType === 'DELETE') {
            setTurns(prev => {
              const filtered = prev.filter(t => t.id !== payload.old.id);
              if (filtered.length === 0) {
                setEncounterActive(false);
              }
              return filtered;
            });
          }
        })
        .subscribe();

      // Clean up subscription
      return () => {
        turnSubscription.unsubscribe();
      };
    }
  }, [currentCampaign]);

  // Start encounter (DM only)
  const startEncounter = async () => {
    try {
      if (!isDM || !currentCampaign || !characters.length) return;

      // First, clear any existing turns
      if (turns.length > 0) {
        await supabase
          .from('turns')
          .delete()
          .eq('campaign_id', currentCampaign.id);
      }

      // Create turns for each character based on initiative
      const sortedCharacters = [...characters].sort((a, b) => {
        const initiativeA = initiativeValues[a.id] || 0;
        const initiativeB = initiativeValues[b.id] || 0;
        return initiativeB - initiativeA; // Higher initiative goes first
      });

      // Insert turns
      const turnData = sortedCharacters.map((character, index) => ({
        campaign_id: currentCampaign.id,
        player_id: character.player_id,
        turn_order: index + 1,
        is_active: index === 0, // First character is active
      }));

      const { error } = await supabase
        .from('turns')
        .insert(turnData);

      if (error) throw error;

      setEncounterActive(true);
    } catch (error) {
      console.error('Error starting encounter:', error);
      setError('Failed to start encounter. Please try again.');
    }
  };

  // End encounter (DM only)
  const endEncounter = async () => {
    try {
      if (!isDM || !currentCampaign) return;

      // Delete all turns for this campaign
      const { error } = await supabase
        .from('turns')
        .delete()
        .eq('campaign_id', currentCampaign.id);

      if (error) throw error;

      setTurns([]);
      setEncounterActive(false);
    } catch (error) {
      console.error('Error ending encounter:', error);
      setError('Failed to end encounter. Please try again.');
    }
  };

  // Next turn (DM only)
  const nextTurn = async () => {
    try {
      if (!isDM || !currentCampaign || turns.length === 0) return;

      // Find current active turn
      const activeTurnIndex = turns.findIndex(t => t.is_active);
      if (activeTurnIndex === -1) return;

      // Determine next turn
      const nextTurnIndex = (activeTurnIndex + 1) % turns.length;

      // Update turns
      await supabase
        .from('turns')
        .update({ is_active: false })
        .eq('id', turns[activeTurnIndex].id);

      await supabase
        .from('turns')
        .update({ is_active: true })
        .eq('id', turns[nextTurnIndex].id);
    } catch (error) {
      console.error('Error advancing turn:', error);
      setError('Failed to advance turn. Please try again.');
    }
  };

  // Handle initiative input change
  const handleInitiativeChange = (characterId: string, value: string) => {
    const initiative = parseInt(value) || 0;
    setInitiativeValues({
      ...initiativeValues,
      [characterId]: initiative,
    });
  };

  // Get character name by ID
  const getCharacterName = (playerId: string) => {
    const character = characters.find(c => c.player_id === playerId);
    if (!character) return 'Unknown';

    const stats = character.stats as any;
    return stats.name || 'Unnamed Character';
  };

  // Check if it's the current user's turn
  const isUserTurn = () => {
    if (!user) return false;

    const activeTurn = turns.find(t => t.is_active);
    return activeTurn?.player_id === user.id;
  };

  if (loading) {
    return <div className="turn-tracker-loading">Loading turn tracker...</div>;
  }

  if (error) {
    return <div className="turn-tracker-error">{error}</div>;
  }

  return (
    <div className="turn-tracker">
      <div className="turn-tracker-header">
        <h3>Turn Tracker</h3>

        {isDM && (
          <div className="turn-controls">
            {encounterActive ? (
              <>
                <button type="button" className="btn btn-primary" onClick={nextTurn}>
                  Next Turn
                </button>
                <button type="button" className="btn btn-danger" onClick={endEncounter}>
                  End Encounter
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-primary" onClick={startEncounter}>
                Start Encounter
              </button>
            )}
          </div>
        )}
      </div>

      {!encounterActive ? (
        isDM ? (
          <div className="initiative-setup">
            <h4>Set Initiative</h4>

            {!Array.isArray(characters) || characters.length === 0 ? (
              <div className="no-characters">No characters available.</div>
            ) : (
              <div className="initiative-list">
                {characters.map((character) => {
                  const stats = character.stats as any;
                  return (
                    <div key={character.id} className="initiative-item">
                      <span className="character-name">{stats.name || 'Unnamed Character'}</span>
                      <input
                        type="number"
                        value={initiativeValues[character.id] || ''}
                        onChange={(e) => handleInitiativeChange(character.id, e.target.value)}
                        placeholder="Initiative"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="no-encounter">No active encounter.</div>
        )
      ) : (
        <div className="turn-list">
          {turns.map((turn) => (
            <div
              key={turn.id}
              className={`turn-item ${turn.is_active ? 'active-turn' : ''} ${
                turn.player_id === user?.id ? 'user-turn' : ''
              }`}
            >
              <span className="turn-order">{turn.turn_order}</span>
              <span className="character-name">{getCharacterName(turn.player_id)}</span>
              {turn.is_active && <span className="active-indicator">Current Turn</span>}
            </div>
          ))}
        </div>
      )}

      {encounterActive && isUserTurn() && (
        <div className="your-turn-alert">
          It's your turn!
        </div>
      )}
    </div>
  );
};

export default TurnTracker;
