import { useState, useEffect } from 'react';
import { Room, Participant, Track, RoomEvent } from 'livekit-client';
import { useAuth } from '../hooks/useAuth';

interface VideoGridProps {
  room: Room | null;
}

const VideoGrid = ({ room }: VideoGridProps) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);

  useEffect(() => {
    if (!room) return;

    // Initialize with current participants
    // Check if room.participants exists and is a Map before calling values()
    const remoteParticipants = room.participants && typeof room.participants.values === 'function'
      ? [...room.participants.values()]
      : [];

    // Check if localParticipant exists
    const localParticipant = room.localParticipant || null;

    // Set participants array
    setParticipants(localParticipant ? [localParticipant, ...remoteParticipants] : remoteParticipants);

    // Set up event listeners
    const onParticipantsChanged = () => {
      // Check if room.participants exists and is a Map before calling values()
      const remoteParticipants = room.participants && typeof room.participants.values === 'function'
        ? [...room.participants.values()]
        : [];

      // Check if localParticipant exists
      const localParticipant = room.localParticipant || null;

      // Set participants array
      setParticipants(localParticipant ? [localParticipant, ...remoteParticipants] : remoteParticipants);
    };

    room.on(RoomEvent.ParticipantConnected, onParticipantsChanged);
    room.on(RoomEvent.ParticipantDisconnected, onParticipantsChanged);
    room.on(RoomEvent.TrackSubscribed, onParticipantsChanged);
    room.on(RoomEvent.TrackUnsubscribed, onParticipantsChanged);

    // Clean up
    return () => {
      room.off(RoomEvent.ParticipantConnected, onParticipantsChanged);
      room.off(RoomEvent.ParticipantDisconnected, onParticipantsChanged);
      room.off(RoomEvent.TrackSubscribed, onParticipantsChanged);
      room.off(RoomEvent.TrackUnsubscribed, onParticipantsChanged);
    };
  }, [room]);

  const toggleMicrophone = async () => {
    if (!room) return;

    try {
      await room.localParticipant.setMicrophoneEnabled(!isMicEnabled);
      setIsMicEnabled(!isMicEnabled);
    } catch (error) {
      console.error('Error toggling microphone:', error);
    }
  };

  const toggleCamera = async () => {
    if (!room) return;

    try {
      await room.localParticipant.setCameraEnabled(!isCameraEnabled);
      setIsCameraEnabled(!isCameraEnabled);
    } catch (error) {
      console.error('Error toggling camera:', error);
    }
  };

  const toggleScreenShare = async () => {
    if (!room) return;

    try {
      await room.localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
      setIsScreenShareEnabled(!isScreenShareEnabled);
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  // Render a participant's video
  const renderParticipant = (participant: Participant) => {
    const isLocal = participant.identity === room?.localParticipant?.identity;

    return (
      <div
        key={participant.identity}
        className={`video-participant ${isLocal ? 'local-participant' : ''}`}
      >
        <div className="video-container" id={`video-${participant.identity}`}>
          {/* Video will be attached here by useEffect */}
          {(!participant.videoTracks || participant.videoTracks.size === 0) && (
            <div className="video-placeholder">
              <span className="participant-initial">
                {participant.identity.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="participant-info">
          <span className="participant-name">
            {isLocal ? 'You' : participant.identity}
          </span>

          <div className="participant-indicators">
            {participant.audioTracks && participant.audioTracks.size > 0 && (
              <span className={`mic-indicator ${participant.isMicrophoneEnabled ? 'active' : 'muted'}`}>
                🎤
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Attach video elements when participants change
  useEffect(() => {
    if (!room) return;

    participants.forEach(participant => {
      // Attach video tracks
      if (participant.videoTracks) {
        participant.videoTracks.forEach(publication => {
          if (publication.track && publication.track.mediaStream) {
            const videoElement = document.createElement('video');
            videoElement.srcObject = publication.track.mediaStream;
            videoElement.autoplay = true;
            videoElement.playsInline = true;
            videoElement.muted = participant.identity === room?.localParticipant?.identity;

            const container = document.getElementById(`video-${participant.identity}`);
            if (container) {
              // Clear container first
              while (container.firstChild) {
                container.removeChild(container.firstChild);
              }
              container.appendChild(videoElement);
            }
          }
        });
      }
    });

    // In development mode, if there are no video tracks for the local participant,
    // we'll try to get the local media stream directly
    if (import.meta.env.DEV && room.localParticipant) {
      const localParticipant = room.localParticipant;
      const container = document.getElementById(`video-${localParticipant.identity}`);

      if (container && (!localParticipant.videoTracks || localParticipant.videoTracks.size === 0)) {
        // Try to get local media stream
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            const videoElement = document.createElement('video');
            videoElement.srcObject = stream;
            videoElement.autoplay = true;
            videoElement.playsInline = true;
            videoElement.muted = true; // Mute local video to prevent feedback

            // Clear container first
            while (container.firstChild) {
              container.removeChild(container.firstChild);
            }
            container.appendChild(videoElement);
          })
          .catch(error => {
            console.error('Error getting local media stream:', error);
          });
      }
    }
  }, [participants, room]);

  if (!room) {
    return (
      <div className="video-grid-container">
        <div className="video-loading">
          Connecting to video chat...
        </div>
      </div>
    );
  }

  return (
    <div className="video-grid-container">
      <div className="video-grid">
        {participants.map(renderParticipant)}
      </div>

      <div className="video-controls">
        <button
          type="button"
          className={`control-btn ${isMicEnabled ? 'active' : 'inactive'}`}
          onClick={toggleMicrophone}
          aria-label={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isMicEnabled ? '🎤' : '🔇'}
        </button>

        <button
          type="button"
          className={`control-btn ${isCameraEnabled ? 'active' : 'inactive'}`}
          onClick={toggleCamera}
          aria-label={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCameraEnabled ? '📹' : '🚫'}
        </button>

        <button
          type="button"
          className={`control-btn ${isScreenShareEnabled ? 'active' : 'inactive'}`}
          onClick={toggleScreenShare}
          aria-label={isScreenShareEnabled ? 'Stop screen sharing' : 'Start screen sharing'}
        >
          {isScreenShareEnabled ? '📺' : '💻'}
        </button>
      </div>
    </div>
  );
};

export default VideoGrid;
