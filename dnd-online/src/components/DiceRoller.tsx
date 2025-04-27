import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { Database } from '../types/supabase';

type DiceRoll = Database['public']['Tables']['dice_rolls']['Row'];

// Extended type for dice roll with joined user data
interface DiceRollWithUser extends DiceRoll {
  users?: {
    name: string;
  };
}

interface DiceRollerProps {
  campaignId: string;
}

type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

const DiceRoller = ({ campaignId }: DiceRollerProps) => {
  const { user } = useAuth();
  const [rolls, setRolls] = useState<DiceRollWithUser[]>([]);
  const [selectedDice, setSelectedDice] = useState<DiceType>('d20');
  const [quantity, setQuantity] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent dice rolls
  useEffect(() => {
    const fetchRolls = async () => {
      try {
        if (!campaignId) return;

        // Get recent dice rolls for this campaign
        const { data, error } = await supabase
          .from('dice_rolls')
          .select('*, users:player_id(name)')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        setRolls(data || []);
      } catch (error) {
        console.error('Error fetching dice rolls:', error);
        setError('Failed to load dice rolls.');
      }
    };

    fetchRolls();

    // Set up realtime subscription
    const rollsSubscription = supabase
      .channel(`dice:${campaignId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'dice_rolls',
        filter: `campaign_id=eq.${campaignId}`
      }, (payload) => {
        // Add new roll to state
        setRolls(prev => [payload.new as DiceRollWithUser, ...prev.slice(0, 9)]);
      })
      .subscribe();

    // Clean up subscription
    return () => {
      rollsSubscription.unsubscribe();
    };
  }, [campaignId]);

  // Roll dice
  const rollDice = async () => {
    try {
      if (!user || !campaignId) return;

      setIsRolling(true);

      // Get dice sides
      const sides = parseInt(selectedDice.substring(1));

      // Generate random rolls
      const results: number[] = [];
      for (let i = 0; i < quantity; i++) {
        results.push(Math.floor(Math.random() * sides) + 1);
      }

      // Calculate total
      const total = results.reduce((sum, roll) => sum + roll, 0) + modifier;

      // Format roll type
      const rollType = `${quantity}${selectedDice}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`;

      // Add roll to database
      const { error } = await supabase
        .from('dice_rolls')
        .insert({
          campaign_id: campaignId,
          player_id: user.id,
          roll_type: rollType,
          result: total,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error rolling dice:', error);
      setError('Failed to roll dice. Please try again.');
    } finally {
      setIsRolling(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="dice-roller">
      <div className="dice-header">
        <h3>Dice Roller</h3>
      </div>

      <div className="dice-controls">
        <div className="dice-row">
          <div className="dice-field">
            <label htmlFor="dice-select">Dice</label>
            <select
              id="dice-select"
              value={selectedDice}
              onChange={(e) => setSelectedDice(e.target.value as DiceType)}
              aria-label="Select dice type"
            >
              <option value="d4">d4</option>
              <option value="d6">d6</option>
              <option value="d8">d8</option>
              <option value="d10">d10</option>
              <option value="d12">d12</option>
              <option value="d20">d20</option>
              <option value="d100">d100</option>
            </select>
          </div>

          <div className="dice-field">
            <label htmlFor="dice-quantity">Quantity</label>
            <input
              id="dice-quantity"
              type="number"
              min="1"
              max="10"
              value={quantity}
              onChange={(e) => setQuantity(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
              aria-label="Number of dice to roll"
            />
          </div>

          <div className="dice-field">
            <label htmlFor="dice-modifier">Modifier</label>
            <input
              id="dice-modifier"
              type="number"
              value={modifier}
              onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
              aria-label="Dice roll modifier"
            />
          </div>
        </div>

        <button
          type="button"
          className="roll-button"
          onClick={rollDice}
          disabled={isRolling}
        >
          {isRolling ? 'Rolling...' : 'Roll Dice'}
        </button>
      </div>

      <div className="dice-history">
        <h4>Recent Rolls</h4>

        {error ? (
          <div className="dice-error">{error}</div>
        ) : rolls.length === 0 ? (
          <div className="dice-empty">No dice rolls yet.</div>
        ) : (
          <div className="roll-list">
            {rolls.map((roll) => (
              <div key={roll.id} className="roll-item">
                <div className="roll-info">
                  <span className="roll-player">
                    {roll.player_id === user?.id ? 'You' : roll.users?.name || 'Unknown'}
                  </span>
                  <span className="roll-time">
                    {formatTime(roll.created_at)}
                  </span>
                </div>
                <div className="roll-result">
                  <span className="roll-type">{roll.roll_type}</span>
                  <span className="roll-value">{roll.result}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dice-presets">
        <button
          type="button"
          onClick={() => { setSelectedDice('d20'); setQuantity(1); setModifier(0); }}
          aria-label="Roll d20"
        >
          d20
        </button>
        <button
          type="button"
          onClick={() => { setSelectedDice('d20'); setQuantity(1); setModifier(0); }}
          aria-label="Roll with advantage"
        >
          Advantage
        </button>
        <button
          type="button"
          onClick={() => { setSelectedDice('d6'); setQuantity(2); setModifier(0); }}
          aria-label="Roll 2d6"
        >
          2d6
        </button>
        <button
          type="button"
          onClick={() => { setSelectedDice('d8'); setQuantity(1); setModifier(0); }}
          aria-label="Roll d8"
        >
          d8
        </button>
      </div>
    </div>
  );
};

export default DiceRoller;
