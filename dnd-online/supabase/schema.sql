-- Create tables
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('DM', 'player')),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dm_id UUID REFERENCES public.users(id) NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) NOT NULL,
  player_id UUID REFERENCES public.users(id) NOT NULL,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  class TEXT NOT NULL,
  race TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.maps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) NOT NULL,
  map_image_url TEXT NOT NULL,
  fog_of_war_grid JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) NOT NULL,
  sender_id UUID REFERENCES public.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('OOC', 'IC', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.turns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) NOT NULL,
  player_id UUID REFERENCES public.users(id) NOT NULL,
  turn_order INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.dice_rolls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) NOT NULL,
  player_id UUID REFERENCES public.users(id) NOT NULL,
  roll_type TEXT NOT NULL,
  result INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_dm_id ON public.campaigns(dm_id);
CREATE INDEX IF NOT EXISTS idx_characters_campaign_id ON public.characters(campaign_id);
CREATE INDEX IF NOT EXISTS idx_characters_player_id ON public.characters(player_id);
CREATE INDEX IF NOT EXISTS idx_maps_campaign_id ON public.maps(campaign_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_campaign_id ON public.chat_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_turns_campaign_id ON public.turns(campaign_id);
CREATE INDEX IF NOT EXISTS idx_turns_is_active ON public.turns(is_active);
CREATE INDEX IF NOT EXISTS idx_dice_rolls_campaign_id ON public.dice_rolls(campaign_id);
CREATE INDEX IF NOT EXISTS idx_dice_rolls_created_at ON public.dice_rolls(created_at);

-- Set up Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dice_rolls ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- Create policies for campaigns table
CREATE POLICY "Anyone can view campaigns they are part of" 
  ON public.campaigns FOR SELECT 
  USING (
    dm_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.characters 
      WHERE campaign_id = id AND player_id = auth.uid()
    )
  );

CREATE POLICY "DMs can insert campaigns" 
  ON public.campaigns FOR INSERT 
  WITH CHECK (dm_id = auth.uid());

CREATE POLICY "DMs can update their campaigns" 
  ON public.campaigns FOR UPDATE 
  USING (dm_id = auth.uid());

CREATE POLICY "DMs can delete their campaigns" 
  ON public.campaigns FOR DELETE 
  USING (dm_id = auth.uid());

-- Create policies for characters table
CREATE POLICY "Anyone can view characters in campaigns they are part of" 
  ON public.characters FOR SELECT 
  USING (
    player_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

CREATE POLICY "Players can insert their own characters" 
  ON public.characters FOR INSERT 
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "Players can update their own characters" 
  ON public.characters FOR UPDATE 
  USING (
    player_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

CREATE POLICY "Players can delete their own characters" 
  ON public.characters FOR DELETE 
  USING (player_id = auth.uid());

-- Create policies for maps table
CREATE POLICY "Anyone can view maps in campaigns they are part of" 
  ON public.maps FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND (
        dm_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.characters 
          WHERE campaign_id = campaigns.id AND player_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "DMs can insert maps" 
  ON public.maps FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

CREATE POLICY "DMs can update maps" 
  ON public.maps FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

CREATE POLICY "DMs can delete maps" 
  ON public.maps FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

-- Create policies for chat_messages table
CREATE POLICY "Anyone can view chat messages in campaigns they are part of" 
  ON public.chat_messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND (
        dm_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.characters 
          WHERE campaign_id = campaigns.id AND player_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Anyone can insert chat messages in campaigns they are part of" 
  ON public.chat_messages FOR INSERT 
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND (
        dm_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.characters 
          WHERE campaign_id = campaigns.id AND player_id = auth.uid()
        )
      )
    )
  );

-- Create policies for turns table
CREATE POLICY "Anyone can view turns in campaigns they are part of" 
  ON public.turns FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND (
        dm_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.characters 
          WHERE campaign_id = campaigns.id AND player_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "DMs can insert turns" 
  ON public.turns FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

CREATE POLICY "DMs can update turns" 
  ON public.turns FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

CREATE POLICY "DMs can delete turns" 
  ON public.turns FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

-- Create policies for dice_rolls table
CREATE POLICY "Anyone can view dice rolls in campaigns they are part of" 
  ON public.dice_rolls FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND (
        dm_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.characters 
          WHERE campaign_id = campaigns.id AND player_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Anyone can insert dice rolls in campaigns they are part of" 
  ON public.dice_rolls FOR INSERT 
  WITH CHECK (
    player_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND (
        dm_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.characters 
          WHERE campaign_id = campaigns.id AND player_id = auth.uid()
        )
      )
    )
  );

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('maps', 'maps', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Set up storage policies
CREATE POLICY "Anyone can view public maps" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'maps');

CREATE POLICY "DMs can upload maps" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'maps' AND
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE dm_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view avatars" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload their own avatar" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Set up realtime subscriptions
BEGIN;
  -- Enable realtime for all tables
  ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.characters;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.maps;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.turns;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.dice_rolls;
COMMIT;
