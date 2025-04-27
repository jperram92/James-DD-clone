import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { Database } from '../types/supabase';

type Character = Database['public']['Tables']['characters']['Row'];

type CharacterFormData = {
  name: string;
  race: string;
  class: string;
  level: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  background: string;
  alignment: string;
  equipment: string;
  spells: string;
  features: string;
  notes: string;
};

const CharacterSheet = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<CharacterFormData>();

  // Fetch character data
  useEffect(() => {
    const fetchCharacter = async () => {
      try {
        if (!id || !user) return;

        setLoading(true);

        // Get character details
        const { data, error } = await supabase
          .from('characters')
          .select('*, campaigns(*)')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) {
          navigate('/dashboard');
          return;
        }

        setCharacter(data);

        // Check if user can edit this character
        const isDM = data.campaigns.dm_id === user.id;
        const isOwner = data.player_id === user.id;
        setCanEdit(isDM || isOwner);

        // Set form values
        const stats = data.stats as any;
        reset({
          name: stats.name || '',
          race: data.race || '',
          class: data.class || '',
          level: stats.level || 1,
          strength: stats.strength || 10,
          dexterity: stats.dexterity || 10,
          constitution: stats.constitution || 10,
          intelligence: stats.intelligence || 10,
          wisdom: stats.wisdom || 10,
          charisma: stats.charisma || 10,
          hitPoints: stats.hitPoints || 10,
          maxHitPoints: stats.maxHitPoints || 10,
          armorClass: stats.armorClass || 10,
          background: stats.background || '',
          alignment: stats.alignment || '',
          equipment: stats.equipment || '',
          spells: stats.spells || '',
          features: stats.features || '',
          notes: stats.notes || '',
        });
      } catch (error) {
        console.error('Error fetching character:', error);
        setError('Failed to load character data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [id, user, navigate, reset]);

  // Save character changes
  const onSubmit = async (data: CharacterFormData) => {
    try {
      if (!character || !canEdit) return;

      setSaving(true);

      // Prepare stats object
      const stats = {
        name: data.name,
        level: data.level,
        strength: data.strength,
        dexterity: data.dexterity,
        constitution: data.constitution,
        intelligence: data.intelligence,
        wisdom: data.wisdom,
        charisma: data.charisma,
        hitPoints: data.hitPoints,
        maxHitPoints: data.maxHitPoints,
        armorClass: data.armorClass,
        background: data.background,
        alignment: data.alignment,
        equipment: data.equipment,
        spells: data.spells,
        features: data.features,
        notes: data.notes,
      };

      // Update character in database
      const { error } = await supabase
        .from('characters')
        .update({
          race: data.race,
          class: data.class,
          stats,
        })
        .eq('id', character.id);

      if (error) throw error;

      // Update local state
      setCharacter({
        ...character,
        race: data.race,
        class: data.class,
        stats,
      });
    } catch (error) {
      console.error('Error saving character:', error);
      setError('Failed to save character data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading character sheet...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!character) {
    return <div className="error-message">Character not found.</div>;
  }

  const stats = character.stats as any;

  return (
    <div className="character-sheet-container">
      <header className="character-sheet-header">
        <h1>{stats.name || 'Character Sheet'}</h1>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate(`/campaign/${character.campaign_id}`)}
        >
          Back to Campaign
        </button>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="character-sheet-form">
        <div className="character-sheet-grid">
          {/* Basic Info */}
          <div className="character-section">
            <h2>Basic Information</h2>

            <div className="form-group">
              <label htmlFor="name">Character Name</label>
              <input
                id="name"
                type="text"
                {...register('name', { required: 'Name is required' })}
                disabled={!canEdit}
              />
              {errors.name && <span className="error">{errors.name.message}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="race">Race</label>
                <input
                  id="race"
                  type="text"
                  {...register('race', { required: 'Race is required' })}
                  disabled={!canEdit}
                />
                {errors.race && <span className="error">{errors.race.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="class">Class</label>
                <input
                  id="class"
                  type="text"
                  {...register('class', { required: 'Class is required' })}
                  disabled={!canEdit}
                />
                {errors.class && <span className="error">{errors.class.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="level">Level</label>
                <input
                  id="level"
                  type="number"
                  min="1"
                  max="20"
                  {...register('level', {
                    required: 'Level is required',
                    min: { value: 1, message: 'Minimum level is 1' },
                    max: { value: 20, message: 'Maximum level is 20' },
                  })}
                  disabled={!canEdit}
                />
                {errors.level && <span className="error">{errors.level.message}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="alignment">Alignment</label>
                <input
                  id="alignment"
                  type="text"
                  {...register('alignment')}
                  disabled={!canEdit}
                />
              </div>

              <div className="form-group">
                <label htmlFor="background">Background</label>
                <input
                  id="background"
                  type="text"
                  {...register('background')}
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>

          {/* Attributes */}
          <div className="character-section">
            <h2>Attributes</h2>

            <div className="attributes-grid">
              <div className="attribute">
                <label htmlFor="strength">Strength</label>
                <input
                  id="strength"
                  type="number"
                  min="1"
                  max="30"
                  {...register('strength', {
                    required: 'Required',
                    min: { value: 1, message: 'Min 1' },
                    max: { value: 30, message: 'Max 30' },
                  })}
                  disabled={!canEdit}
                />
                <div className="modifier">
                  {Math.floor((Number(stats.strength || 10) - 10) / 2)}
                </div>
              </div>

              <div className="attribute">
                <label htmlFor="dexterity">Dexterity</label>
                <input
                  id="dexterity"
                  type="number"
                  min="1"
                  max="30"
                  {...register('dexterity', {
                    required: 'Required',
                    min: { value: 1, message: 'Min 1' },
                    max: { value: 30, message: 'Max 30' },
                  })}
                  disabled={!canEdit}
                />
                <div className="modifier">
                  {Math.floor((Number(stats.dexterity || 10) - 10) / 2)}
                </div>
              </div>

              <div className="attribute">
                <label htmlFor="constitution">Constitution</label>
                <input
                  id="constitution"
                  type="number"
                  min="1"
                  max="30"
                  {...register('constitution', {
                    required: 'Required',
                    min: { value: 1, message: 'Min 1' },
                    max: { value: 30, message: 'Max 30' },
                  })}
                  disabled={!canEdit}
                />
                <div className="modifier">
                  {Math.floor((Number(stats.constitution || 10) - 10) / 2)}
                </div>
              </div>

              <div className="attribute">
                <label htmlFor="intelligence">Intelligence</label>
                <input
                  id="intelligence"
                  type="number"
                  min="1"
                  max="30"
                  {...register('intelligence', {
                    required: 'Required',
                    min: { value: 1, message: 'Min 1' },
                    max: { value: 30, message: 'Max 30' },
                  })}
                  disabled={!canEdit}
                />
                <div className="modifier">
                  {Math.floor((Number(stats.intelligence || 10) - 10) / 2)}
                </div>
              </div>

              <div className="attribute">
                <label htmlFor="wisdom">Wisdom</label>
                <input
                  id="wisdom"
                  type="number"
                  min="1"
                  max="30"
                  {...register('wisdom', {
                    required: 'Required',
                    min: { value: 1, message: 'Min 1' },
                    max: { value: 30, message: 'Max 30' },
                  })}
                  disabled={!canEdit}
                />
                <div className="modifier">
                  {Math.floor((Number(stats.wisdom || 10) - 10) / 2)}
                </div>
              </div>

              <div className="attribute">
                <label htmlFor="charisma">Charisma</label>
                <input
                  id="charisma"
                  type="number"
                  min="1"
                  max="30"
                  {...register('charisma', {
                    required: 'Required',
                    min: { value: 1, message: 'Min 1' },
                    max: { value: 30, message: 'Max 30' },
                  })}
                  disabled={!canEdit}
                />
                <div className="modifier">
                  {Math.floor((Number(stats.charisma || 10) - 10) / 2)}
                </div>
              </div>
            </div>
          </div>

          {/* Combat Stats */}
          <div className="character-section">
            <h2>Combat</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="hitPoints">Current HP</label>
                <input
                  id="hitPoints"
                  type="number"
                  min="0"
                  {...register('hitPoints', {
                    required: 'Required',
                    min: { value: 0, message: 'Min 0' },
                  })}
                  disabled={!canEdit}
                />
              </div>

              <div className="form-group">
                <label htmlFor="maxHitPoints">Max HP</label>
                <input
                  id="maxHitPoints"
                  type="number"
                  min="1"
                  {...register('maxHitPoints', {
                    required: 'Required',
                    min: { value: 1, message: 'Min 1' },
                  })}
                  disabled={!canEdit}
                />
              </div>

              <div className="form-group">
                <label htmlFor="armorClass">Armor Class</label>
                <input
                  id="armorClass"
                  type="number"
                  min="1"
                  {...register('armorClass', {
                    required: 'Required',
                    min: { value: 1, message: 'Min 1' },
                  })}
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>

          {/* Equipment */}
          <div className="character-section">
            <h2>Equipment</h2>
            <textarea
              {...register('equipment')}
              rows={5}
              disabled={!canEdit}
            />
          </div>

          {/* Spells */}
          <div className="character-section">
            <h2>Spells</h2>
            <textarea
              {...register('spells')}
              rows={5}
              disabled={!canEdit}
            />
          </div>

          {/* Features & Traits */}
          <div className="character-section">
            <h2>Features & Traits</h2>
            <textarea
              {...register('features')}
              rows={5}
              disabled={!canEdit}
            />
          </div>

          {/* Notes */}
          <div className="character-section">
            <h2>Notes</h2>
            <textarea
              {...register('notes')}
              rows={5}
              disabled={!canEdit}
            />
          </div>
        </div>

        {canEdit && (
          <div className="character-sheet-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !isDirty}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default CharacterSheet;
