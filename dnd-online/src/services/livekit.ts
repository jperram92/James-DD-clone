import { Room, RoomEvent, RemoteParticipant, LocalParticipant } from 'livekit-client';

const livekitUrl = import.meta.env.VITE_LIVEKIT_URL as string;

if (!livekitUrl) {
  throw new Error('Missing LiveKit environment variables');
}

export const createRoom = (roomName: string, token: string): Room => {
  const room = new Room({
    adaptiveStream: true,
    dynacast: true,
    videoCaptureDefaults: {
      resolution: { width: 640, height: 480 },
    },
  });

  room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
    console.log('Participant connected', participant.identity);
  });

  room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
    console.log('Participant disconnected', participant.identity);
  });

  room.on(RoomEvent.Disconnected, () => {
    console.log('Disconnected from room');
  });

  return room;
};

export const connectToRoom = async (room: Room, token: string): Promise<LocalParticipant> => {
  try {
    await room.connect(livekitUrl, token);
    console.log('Connected to room:', room.name);
    return room.localParticipant;
  } catch (error) {
    console.error('Error connecting to room:', error);
    throw error;
  }
};

export const disconnectFromRoom = (room: Room): void => {
  room.disconnect();
};

export const toggleMicrophone = async (room: Room, enabled: boolean): Promise<void> => {
  await room.localParticipant.setMicrophoneEnabled(enabled);
};

export const toggleCamera = async (room: Room, enabled: boolean): Promise<void> => {
  await room.localParticipant.setCameraEnabled(enabled);
};

export const toggleScreenShare = async (room: Room, enabled: boolean): Promise<void> => {
  await room.localParticipant.setScreenShareEnabled(enabled);
};
