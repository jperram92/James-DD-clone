import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { useGameStore } from '../store/gameStore';
import { createRoom, connectToRoom } from '../services/livekit';
import { Room } from 'livekit-client';
import { createOrUpdateUserProfile, getUserProfile } from '../services/userService';

// Development mode components
import DevModeVideoGrid from '../components/DevModeVideoGrid';

// Components
import VideoGrid from '../components/VideoGrid';
import ChatPanel from '../components/ChatPanel';
import DiceRoller from '../components/DiceRoller';
import MapView from '../components/MapView';
import TurnTracker from '../components/TurnTracker';
import CharacterCreation from '../components/CharacterCreation';

const Campaign = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDM, setIsDM] = useState(false);
  const [hasCharacter, setHasCharacter] = useState(false);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [videoRoom, setVideoRoom] = useState<Room | null>(null);

  // Game store state
  const {
    currentCampaign,
    setCampaign,
    characters,
    setCharacters,
    setRoom,
    isMapVisible,
    isChatVisible,
    isDiceRollerVisible,
    toggleMapVisibility,
    toggleChatVisibility,
    toggleDiceRollerVisibility
  } = useGameStore();

  // Fetch campaign data
  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        if (!id || !user) return;

        // First, check if the user profile exists and create it if needed
        try {
          const userProfile = await getUserProfile(user.id);

          if (!userProfile) {
            console.log('User profile not found, attempting to create it...');

            // Create user profile using our service
            const result = await createOrUpdateUserProfile(
              user.id,
              user.email || '',
              user.user_metadata?.name || 'Player',
              (user.user_metadata?.role as 'DM' | 'player') || 'player'
            );

            console.log('User profile creation result:', result);

            if (!result.success && !import.meta.env.DEV) {
              setError('Could not create your user profile. Please try logging out and signing in again.');
              setLoading(false);
              return;
            }
          }
        } catch (profileError) {
          console.error('Error with user profile:', profileError);
          // In development mode, we'll continue anyway
          if (!import.meta.env.DEV) {
            setError('Could not verify your user profile. Please try again later.');
            setLoading(false);
            return;
          }
          console.warn('DEV MODE: Continuing despite profile error');
        }

        setLoading(true);

        // Get campaign details
        const { data: campaign, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', id)
          .single();

        if (campaignError) throw campaignError;
        if (!campaign) {
          navigate('/dashboard');
          return;
        }

        setCampaign(campaign);
        setIsDM(campaign.dm_id === user.id);

        // Get characters in this campaign
        const { data: campaignCharacters, error: charactersError } = await supabase
          .from('characters')
          .select('*')
          .eq('campaign_id', id);

        if (charactersError) throw charactersError;
        setCharacters(campaignCharacters || []);

        // Check if user has a character in this campaign
        const userCharacter = campaignCharacters?.find(c => c.player_id === user.id);
        setHasCharacter(!!userCharacter);

        // If user is not DM and doesn't have a character, show character creation
        if (!isDM && !userCharacter) {
          // Check if there's a character creation in progress
          const { data: existingCharacter, error: checkError } = await supabase
            .from('characters')
            .select('id')
            .eq('campaign_id', id)
            .eq('player_id', user.id)
            .maybeSingle();

          if (checkError) {
            console.warn('Error checking for existing character:', checkError);
          }

          // Only show character creation if there's no character at all
          if (!existingCharacter) {
            setShowCharacterCreation(true);
          } else {
            // If there is a character but it wasn't in the initial query, refresh characters
            setHasCharacter(true);
            setCharacters(prev => {
              if (!prev.some(c => c.player_id === user.id)) {
                // Fetch the full character data
                supabase
                  .from('characters')
                  .select('*')
                  .eq('id', existingCharacter.id)
                  .single()
                  .then(({ data }) => {
                    if (data) {
                      setCharacters(prev => [...prev, data]);
                    }
                  });
              }
              return prev;
            });
          }
        }

        // Set up realtime subscriptions
        const campaignSubscription = supabase
          .channel(`campaign:${id}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'characters',
            filter: `campaign_id=eq.${id}`
          }, (payload) => {
            // Handle character updates
            if (payload.eventType === 'INSERT') {
              setCharacters(prev => [...prev, payload.new]);
            } else if (payload.eventType === 'UPDATE') {
              setCharacters(prev =>
                prev.map(c => c.id === payload.new.id ? payload.new : c)
              );
            } else if (payload.eventType === 'DELETE') {
              setCharacters(prev =>
                prev.filter(c => c.id !== payload.old.id)
              );
            }
          })
          .subscribe();

        // Clean up subscription on unmount
        return () => {
          campaignSubscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error fetching campaign data:', error);
        setError('Failed to load campaign data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignData();
  }, [id, user, navigate, setCampaign, setCharacters]);

  // Set up video room (only in production mode)
  useEffect(() => {
    // Skip in development mode since we're using DevModeVideoGrid
    if (import.meta.env.DEV) {
      return;
    }

    const setupVideoRoom = async () => {
      try {
        if (!id || !user || !currentCampaign) return;

        // In a real application, we would get a token from the server
        console.log('Setting up LiveKit integration');

        // Create room and connect with a token from the server
        const roomName = currentCampaign.name || 'campaign-room';
        const room = createRoom(roomName, 'token-would-come-from-server');

        // In production, we would connect to LiveKit
        // await connectToRoom(room, token);

        setVideoRoom(room);
        setRoom(room);

        // Clean up on unmount
        return () => {
          room.disconnect();
          setRoom(null);
        };
      } catch (error) {
        console.error('Error setting up video room:', error);
      }
    };

    setupVideoRoom();
  }, [id, user, currentCampaign, setRoom]);

  if (loading) {
    return <div className="loading">Loading campaign...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (showCharacterCreation) {
    return (
      <CharacterCreation
        campaignId={id!}
        onComplete={() => setShowCharacterCreation(false)}
      />
    );
  }

  return (
    <div className="campaign-container">
      <header className="campaign-header">
        <h1>{currentCampaign?.name}</h1>
        <div className="campaign-controls">
          <button
            type="button"
            className={`btn ${isMapVisible ? 'btn-active' : ''}`}
            onClick={toggleMapVisibility}
          >
            Map
          </button>
          <button
            type="button"
            className={`btn ${isChatVisible ? 'btn-active' : ''}`}
            onClick={toggleChatVisibility}
          >
            Chat
          </button>
          <button
            type="button"
            className={`btn ${isDiceRollerVisible ? 'btn-active' : ''}`}
            onClick={toggleDiceRollerVisibility}
          >
            Dice
          </button>
        </div>
      </header>

      <div className="campaign-layout">
        <div className="campaign-main">
          {isMapVisible && <MapView isDM={isDM} />}
          <TurnTracker isDM={isDM} />
        </div>

        <div className="campaign-sidebar">
          {import.meta.env.DEV ? (
            <DevModeVideoGrid />
          ) : (
            <VideoGrid room={videoRoom} />
          )}

          {isChatVisible && <ChatPanel campaignId={id!} />}

          {isDiceRollerVisible && <DiceRoller campaignId={id!} />}
        </div>
      </div>
    </div>
  );
};

export default Campaign;
