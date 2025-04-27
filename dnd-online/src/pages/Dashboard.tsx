import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { useForm } from 'react-hook-form';
import { Database } from '../types/supabase';

type Campaign = Database['public']['Tables']['campaigns']['Row'];

type CreateCampaignFormData = {
  name: string;
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreateCampaignFormData>();

  // Fetch user's campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);

        // Get campaigns where user is DM
        const { data: dmCampaigns, error: dmError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('dm_id', user?.id);

        if (dmError) throw dmError;

        // Get campaigns where user is a player (via characters table)
        const { data: playerCampaigns, error: playerError } = await supabase
          .from('characters')
          .select('campaign_id')
          .eq('player_id', user?.id);

        if (playerError) throw playerError;

        // Get full campaign data for player campaigns
        let playerCampaignData: Campaign[] = [];
        if (playerCampaigns.length > 0) {
          const campaignIds = playerCampaigns.map(c => c.campaign_id);
          const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .in('id', campaignIds);

          if (error) throw error;
          playerCampaignData = data || [];
        }

        // Combine and deduplicate campaigns
        const allCampaigns = [...(dmCampaigns || []), ...playerCampaignData];
        const uniqueCampaigns = Array.from(
          new Map(allCampaigns.map(c => [c.id, c])).values()
        );

        setCampaigns(uniqueCampaigns);
      } catch (error: any) {
        console.error('Error fetching campaigns:', error);
        // Show more detailed error message
        const errorMessage = error.message || error.error_description || JSON.stringify(error);
        setError(`Failed to load campaigns: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCampaigns();
    }
  }, [user]);

  // Create new campaign
  const onCreateCampaign = async (data: CreateCampaignFormData) => {
    try {
      if (!user) return;

      // Generate a random 6-character invite code
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          name: data.name,
          dm_id: user.id,
          status: 'active',
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (error) throw error;

      setCampaigns([...campaigns, campaign]);
      setShowCreateForm(false);
      reset();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      // Show more detailed error message
      const errorMessage = error.message || error.error_description || JSON.stringify(error);
      setError(`Failed to create campaign: ${errorMessage}`);
    }
  };

  // Join campaign with invite code
  const handleJoinCampaign = async () => {
    try {
      setJoinError(null);
      if (!joinCode.trim() || !user) return;

      // Find campaign with invite code
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('invite_code', joinCode.trim())
        .single();

      if (error || !campaign) {
        setJoinError('Invalid invite code. Please try again.');
        return;
      }

      // Check if user is already in this campaign
      const isMember = campaigns.some(c => c.id === campaign.id);
      if (isMember) {
        navigate(`/campaign/${campaign.id}`);
        return;
      }

      // Navigate to campaign page (character creation will happen there)
      navigate(`/campaign/${campaign.id}`);
    } catch (error) {
      console.error('Error joining campaign:', error);
      setJoinError('Failed to join campaign. Please try again.');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.user_metadata?.name || 'Adventurer'}</span>
        </div>
      </header>

      <div className="dashboard-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Campaign'}
        </button>

        <div className="join-campaign">
          <input
            type="text"
            placeholder="Enter invite code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleJoinCampaign}
          >
            Join Campaign
          </button>
          {joinError && <div className="error-message">{joinError}</div>}
        </div>
      </div>

      {showCreateForm && (
        <div className="create-campaign-form">
          <h2>Create New Campaign</h2>
          <form onSubmit={handleSubmit(onCreateCampaign)}>
            <div className="form-group">
              <label htmlFor="name">Campaign Name</label>
              <input
                id="name"
                type="text"
                {...register('name', {
                  required: 'Campaign name is required',
                  minLength: {
                    value: 3,
                    message: 'Name must be at least 3 characters'
                  }
                })}
              />
              {errors.name && <span className="error">{errors.name.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary">
              Create Campaign
            </button>
          </form>
        </div>
      )}

      <div className="campaigns-section">
        <h2>Your Campaigns</h2>

        {loading ? (
          <div className="loading">Loading campaigns...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : campaigns.length === 0 ? (
          <div className="empty-state">
            <p>You don't have any campaigns yet.</p>
            <p>Create a new campaign or join an existing one with an invite code.</p>
          </div>
        ) : (
          <div className="campaign-grid">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="campaign-card">
                <h3>{campaign.name}</h3>
                <p>
                  <strong>Role:</strong> {campaign.dm_id === user?.id ? 'Dungeon Master' : 'Player'}
                </p>
                <p>
                  <strong>Status:</strong> {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </p>
                {campaign.dm_id === user?.id && (
                  <p>
                    <strong>Invite Code:</strong> {campaign.invite_code}
                  </p>
                )}
                <Link to={`/campaign/${campaign.id}`} className="btn btn-primary">
                  Enter Campaign
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
