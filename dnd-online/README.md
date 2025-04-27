# D&D Online

A browser-based multiplayer Dungeons & Dragons–style game using React, TypeScript, and Supabase with webcam/mic support via LiveKit.

## Features

- User authentication with DM and Player roles
- Campaign creation and management
- Character creation and sheet management
- Real-time map viewing with fog of war
- Dice rolling with animations and shared results
- Turn-based encounter tracking
- In-character and out-of-character chat
- Video and audio communication between players

## Tech Stack

- **Frontend**: React + TypeScript
- **State Management**: Zustand
- **Database/Auth/Storage**: Supabase (PostgreSQL, Auth, RLS, Realtime)
- **Realtime Video**: LiveKit (free self-host) or Daily.co (2k mins/month free)
- **Forms**: react-hook-form
- **Canvas**: react-konva
- **Animation**: framer-motion

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account (free tier)
- LiveKit account or self-hosted instance (or Daily.co account)

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/dnd-online.git
cd dnd-online
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new Supabase project at [https://app.supabase.io/](https://app.supabase.io/)
2. Go to SQL Editor and run the SQL script from `supabase/schema.sql`
3. Get your Supabase URL and anon key from the API settings

### 4. Set up LiveKit (or Daily.co)

1. Create a LiveKit account or set up a self-hosted instance
2. Get your LiveKit URL, API key, and API secret

### 5. Configure environment variables

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_LIVEKIT_URL=your-livekit-url
VITE_LIVEKIT_API_KEY=your-livekit-api-key
VITE_LIVEKIT_API_SECRET=your-livekit-api-secret
```

### 6. Run the development server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Deployment

### Deploying to Vercel

1. Push your code to a GitHub repository
2. Create a new project on Vercel and import your repository
3. Set up the environment variables in the Vercel project settings
4. Deploy the project

## Project Structure

```
dnd-online/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images and other assets
│   ├── components/      # Reusable components
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── store/           # Zustand store
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main App component
│   ├── App.css          # Global styles
│   └── main.tsx         # Entry point
├── supabase/
│   └── schema.sql       # Database schema
├── .env                 # Environment variables (not in repo)
├── .gitignore           # Git ignore file
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## User Roles

### Dungeon Master (DM)
- Create and manage campaigns
- Upload and control maps
- Manage fog of war
- Control turn order
- View all character sheets

### Player
- Join campaigns with invite codes
- Create and manage characters
- Roll dice
- Participate in encounters
- Chat with other players

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.io/)
- [LiveKit](https://livekit.io/)
- [React Konva](https://konvajs.org/docs/react/index.html)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Hook Form](https://react-hook-form.com/)