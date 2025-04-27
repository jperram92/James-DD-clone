import { create } from 'zustand';
import { Room } from 'livekit-client';
import { Database } from '../types/supabase';

type Campaign = Database['public']['Tables']['campaigns']['Row'];
type Character = Database['public']['Tables']['characters']['Row'];
type Map = Database['public']['Tables']['maps']['Row'];
type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type Turn = Database['public']['Tables']['turns']['Row'];
type DiceRoll = Database['public']['Tables']['dice_rolls']['Row'];

interface GameState {
  // Campaign
  currentCampaign: Campaign | null;
  setCampaign: (campaign: Campaign | null) => void;
  
  // Characters
  characters: Character[];
  setCharacters: (characters: Character[]) => void;
  addCharacter: (character: Character) => void;
  updateCharacter: (character: Character) => void;
  
  // Maps
  currentMap: Map | null;
  setCurrentMap: (map: Map | null) => void;
  
  // Chat
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  
  // Turns
  turns: Turn[];
  setTurns: (turns: Turn[]) => void;
  updateTurn: (turn: Turn) => void;
  
  // Dice Rolls
  diceRolls: DiceRoll[];
  setDiceRolls: (rolls: DiceRoll[]) => void;
  addDiceRoll: (roll: DiceRoll) => void;
  
  // Video Room
  room: Room | null;
  setRoom: (room: Room | null) => void;
  
  // UI State
  isMapVisible: boolean;
  toggleMapVisibility: () => void;
  isChatVisible: boolean;
  toggleChatVisibility: () => void;
  isDiceRollerVisible: boolean;
  toggleDiceRollerVisibility: () => void;
  isCharacterSheetVisible: boolean;
  toggleCharacterSheetVisibility: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  // Campaign
  currentCampaign: null,
  setCampaign: (campaign) => set({ currentCampaign: campaign }),
  
  // Characters
  characters: [],
  setCharacters: (characters) => set({ characters }),
  addCharacter: (character) => set((state) => ({ 
    characters: [...state.characters, character] 
  })),
  updateCharacter: (character) => set((state) => ({
    characters: state.characters.map((c) => 
      c.id === character.id ? character : c
    )
  })),
  
  // Maps
  currentMap: null,
  setCurrentMap: (map) => set({ currentMap: map }),
  
  // Chat
  chatMessages: [],
  setChatMessages: (messages) => set({ chatMessages: messages }),
  addChatMessage: (message) => set((state) => ({ 
    chatMessages: [...state.chatMessages, message] 
  })),
  
  // Turns
  turns: [],
  setTurns: (turns) => set({ turns }),
  updateTurn: (turn) => set((state) => ({
    turns: state.turns.map((t) => 
      t.id === turn.id ? turn : t
    )
  })),
  
  // Dice Rolls
  diceRolls: [],
  setDiceRolls: (rolls) => set({ diceRolls: rolls }),
  addDiceRoll: (roll) => set((state) => ({ 
    diceRolls: [...state.diceRolls, roll] 
  })),
  
  // Video Room
  room: null,
  setRoom: (room) => set({ room }),
  
  // UI State
  isMapVisible: true,
  toggleMapVisibility: () => set((state) => ({ 
    isMapVisible: !state.isMapVisible 
  })),
  isChatVisible: true,
  toggleChatVisibility: () => set((state) => ({ 
    isChatVisible: !state.isChatVisible 
  })),
  isDiceRollerVisible: true,
  toggleDiceRollerVisibility: () => set((state) => ({ 
    isDiceRollerVisible: !state.isDiceRollerVisible 
  })),
  isCharacterSheetVisible: false,
  toggleCharacterSheetVisibility: () => set((state) => ({ 
    isCharacterSheetVisible: !state.isCharacterSheetVisible 
  })),
}));
