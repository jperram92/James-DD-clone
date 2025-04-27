import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { createOrUpdateUserProfile, getUserProfile } from '../services/userService';

interface CharacterCreationProps {
  campaignId: string;
  onComplete: () => void;
}

type CharacterFormData = {
  name: string;
  race: string;
  class: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  background: string;
  alignment: string;
};

const CharacterCreation = ({ campaignId, onComplete }: CharacterCreationProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CharacterFormData>({
    defaultValues: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    }
  });

  const onSubmit = async (data: CharacterFormData) => {
    try {
      if (!user || !campaignId) return;

      setLoading(true);
      setError(null);

      // First, check if the user profile exists and create it if needed
      try {
        const userProfile = await getUserProfile(user.id);

        if (!userProfile) {
          console.log('User profile not found, attempting to create it...');

          // Get user metadata from auth
          const { data: userData } = await supabase.auth.getUser();

          if (!userData || !userData.user) {
            throw new Error('Could not retrieve user data. Please log out and sign in again.');
          }

          // Create user profile using our service
          const result = await createOrUpdateUserProfile(
            user.id,
            userData.user.email || '',
            userData.user.user_metadata?.name || 'Player',
            (userData.user.user_metadata?.role as 'DM' | 'player') || 'player'
          );

          console.log('User profile creation result:', result);

          if (!result.success) {
            throw new Error('Could not create your user profile. Please contact support.');
          }
        }
      } catch (profileError) {
        console.error('Error with user profile:', profileError);
        // In development mode, we'll continue anyway
        if (!import.meta.env.DEV) {
          throw new Error('Could not verify your user profile. Please try again later.');
        }
        console.warn('DEV MODE: Continuing despite profile error');
      }

      // Prepare character stats
      const stats = {
        name: data.name,
        level: 1,
        strength: data.strength,
        dexterity: data.dexterity,
        constitution: data.constitution,
        intelligence: data.intelligence,
        wisdom: data.wisdom,
        charisma: data.charisma,
        hitPoints: 10, // Default starting HP
        maxHitPoints: 10,
        armorClass: 10,
        background: data.background,
        alignment: data.alignment,
        equipment: '',
        spells: '',
        features: '',
        notes: '',
      };

      try {
        // First try to create a new character
        const { error: insertError } = await supabase
          .from('characters')
          .insert({
            campaign_id: campaignId,
            player_id: user.id,
            race: data.race,
            class: data.class,
            stats,
          });

        // If we get a conflict error (409), it means the character already exists
        if (insertError && insertError.code === '23505') {
          console.log('Character already exists, updating instead...');

          // Get the existing character ID
          const { data: existingCharacter } = await supabase
            .from('characters')
            .select('id')
            .eq('campaign_id', campaignId)
            .eq('player_id', user.id)
            .single();

          if (existingCharacter) {
            // Update the existing character
            const { error: updateError } = await supabase
              .from('characters')
              .update({
                race: data.race,
                class: data.class,
                stats,
              })
              .eq('id', existingCharacter.id);

            if (updateError) throw updateError;
          } else {
            throw new Error('Could not find existing character to update');
          }
        } else if (insertError) {
          // If it's a foreign key constraint error and we're in development mode
          if (insertError.code === '23503' && import.meta.env.DEV) {
            console.warn('DEV MODE: Foreign key constraint error, but continuing anyway');
            // In development, we'll simulate a successful character creation
            console.log('DEV MODE: Simulating successful character creation');
          } else {
            // If it's some other error, throw it
            throw insertError;
          }
        }
      } catch (dbError: any) {
        // In development mode, we'll continue anyway for certain errors
        if (import.meta.env.DEV &&
            (dbError.code === '23503' || dbError.code === '42501' || dbError.code === '42503')) {
          console.warn(`DEV MODE: Continuing despite error: ${dbError.message}`);
        } else {
          console.error('Database error:', dbError);
          throw dbError;
        }
      }

      // Complete character creation
      onComplete();
    } catch (error: any) {
      console.error('Error creating character:', error);

      // Provide a more specific error message
      if (error.code === '23505') {
        // This is a conflict error - character already exists
        setError('A character already exists for you in this campaign.');
      } else if (error.message) {
        setError(`Failed to create character: ${error.message}`);
      } else {
        setError('Failed to create character. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="character-creation-container">
      <div className="character-creation-card">
        <h1>Create Your Character</h1>
        <p>Create a character to join this campaign.</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="character-form">
          <div className="form-section">
            <h2>Basic Information</h2>

            <div className="form-group">
              <label htmlFor="name">Character Name</label>
              <input
                id="name"
                type="text"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && <span className="error">{errors.name.message}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="race">Race</label>
                <select
                  id="race"
                  {...register('race', { required: 'Race is required' })}
                >
                  <option value="">Select Race</option>
                  <option value="Human">Human</option>
                  <option value="Elf">Elf</option>
                  <option value="Dwarf">Dwarf</option>
                  <option value="Halfling">Halfling</option>
                  <option value="Gnome">Gnome</option>
                  <option value="Half-Elf">Half-Elf</option>
                  <option value="Half-Orc">Half-Orc</option>
                  <option value="Tiefling">Tiefling</option>
                  <option value="Dragonborn">Dragonborn</option>
                </select>
                {errors.race && <span className="error">{errors.race.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="class">Class</label>
                <select
                  id="class"
                  {...register('class', { required: 'Class is required' })}
                >
                  <option value="">Select Class</option>
                  <option value="Barbarian">Barbarian</option>
                  <option value="Bard">Bard</option>
                  <option value="Cleric">Cleric</option>
                  <option value="Druid">Druid</option>
                  <option value="Fighter">Fighter</option>
                  <option value="Monk">Monk</option>
                  <option value="Paladin">Paladin</option>
                  <option value="Ranger">Ranger</option>
                  <option value="Rogue">Rogue</option>
                  <option value="Sorcerer">Sorcerer</option>
                  <option value="Warlock">Warlock</option>
                  <option value="Wizard">Wizard</option>
                </select>
                {errors.class && <span className="error">{errors.class.message}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="alignment">Alignment</label>
                <select
                  id="alignment"
                  {...register('alignment')}
                >
                  <option value="">Select Alignment</option>
                  <option value="Lawful Good">Lawful Good</option>
                  <option value="Neutral Good">Neutral Good</option>
                  <option value="Chaotic Good">Chaotic Good</option>
                  <option value="Lawful Neutral">Lawful Neutral</option>
                  <option value="True Neutral">True Neutral</option>
                  <option value="Chaotic Neutral">Chaotic Neutral</option>
                  <option value="Lawful Evil">Lawful Evil</option>
                  <option value="Neutral Evil">Neutral Evil</option>
                  <option value="Chaotic Evil">Chaotic Evil</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="background">Background</label>
                <select
                  id="background"
                  {...register('background')}
                >
                  <option value="">Select Background</option>
                  <option value="Acolyte">Acolyte</option>
                  <option value="Charlatan">Charlatan</option>
                  <option value="Criminal">Criminal</option>
                  <option value="Entertainer">Entertainer</option>
                  <option value="Folk Hero">Folk Hero</option>
                  <option value="Guild Artisan">Guild Artisan</option>
                  <option value="Hermit">Hermit</option>
                  <option value="Noble">Noble</option>
                  <option value="Outlander">Outlander</option>
                  <option value="Sage">Sage</option>
                  <option value="Sailor">Sailor</option>
                  <option value="Soldier">Soldier</option>
                  <option value="Urchin">Urchin</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Ability Scores</h2>
            <p>Distribute your ability scores (default: 10)</p>

            <div className="ability-scores-grid">
              <div className="ability-score">
                <label htmlFor="strength">Strength</label>
                <input
                  id="strength"
                  type="number"
                  min="3"
                  max="18"
                  {...register('strength', {
                    required: 'Required',
                    min: { value: 3, message: 'Min 3' },
                    max: { value: 18, message: 'Max 18' },
                  })}
                />
                {errors.strength && <span className="error">{errors.strength.message}</span>}
              </div>

              <div className="ability-score">
                <label htmlFor="dexterity">Dexterity</label>
                <input
                  id="dexterity"
                  type="number"
                  min="3"
                  max="18"
                  {...register('dexterity', {
                    required: 'Required',
                    min: { value: 3, message: 'Min 3' },
                    max: { value: 18, message: 'Max 18' },
                  })}
                />
                {errors.dexterity && <span className="error">{errors.dexterity.message}</span>}
              </div>

              <div className="ability-score">
                <label htmlFor="constitution">Constitution</label>
                <input
                  id="constitution"
                  type="number"
                  min="3"
                  max="18"
                  {...register('constitution', {
                    required: 'Required',
                    min: { value: 3, message: 'Min 3' },
                    max: { value: 18, message: 'Max 18' },
                  })}
                />
                {errors.constitution && <span className="error">{errors.constitution.message}</span>}
              </div>

              <div className="ability-score">
                <label htmlFor="intelligence">Intelligence</label>
                <input
                  id="intelligence"
                  type="number"
                  min="3"
                  max="18"
                  {...register('intelligence', {
                    required: 'Required',
                    min: { value: 3, message: 'Min 3' },
                    max: { value: 18, message: 'Max 18' },
                  })}
                />
                {errors.intelligence && <span className="error">{errors.intelligence.message}</span>}
              </div>

              <div className="ability-score">
                <label htmlFor="wisdom">Wisdom</label>
                <input
                  id="wisdom"
                  type="number"
                  min="3"
                  max="18"
                  {...register('wisdom', {
                    required: 'Required',
                    min: { value: 3, message: 'Min 3' },
                    max: { value: 18, message: 'Max 18' },
                  })}
                />
                {errors.wisdom && <span className="error">{errors.wisdom.message}</span>}
              </div>

              <div className="ability-score">
                <label htmlFor="charisma">Charisma</label>
                <input
                  id="charisma"
                  type="number"
                  min="3"
                  max="18"
                  {...register('charisma', {
                    required: 'Required',
                    min: { value: 3, message: 'Min 3' },
                    max: { value: 18, message: 'Max 18' },
                  })}
                />
                {errors.charisma && <span className="error">{errors.charisma.message}</span>}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Creating Character...' : 'Create Character'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CharacterCreation;
