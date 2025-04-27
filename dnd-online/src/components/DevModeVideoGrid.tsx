import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * A simplified video grid component for development mode only
 * This bypasses LiveKit and directly uses the browser's MediaDevices API
 */
const DevModeVideoGrid = () => {
  const { user } = useAuth();
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize media stream
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: isCameraEnabled,
          audio: isMicEnabled
        });
        
        setStream(mediaStream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }
        
        console.log('Dev mode: Successfully accessed camera and microphone');
      } catch (err: any) {
        console.error('Error accessing media devices:', err);
        setError(`Could not access camera/microphone: ${err.message}`);
      }
    };
    
    initializeMedia();
    
    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle toggling microphone
  const toggleMicrophone = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isMicEnabled;
      });
      setIsMicEnabled(!isMicEnabled);
    }
  };

  // Handle toggling camera
  const toggleCamera = () => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !isCameraEnabled;
      });
      setIsCameraEnabled(!isCameraEnabled);
    }
  };

  return (
    <div className="video-grid-container">
      <div className="video-grid">
        <div className="video-participant local-participant">
          <div className="video-container">
            {error ? (
              <div className="video-error">{error}</div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted // Always mute local video to prevent feedback
              />
            )}
          </div>
          <div className="participant-info">
            <span className="participant-name">
              You ({user?.user_metadata?.name || 'Local User'})
            </span>
            <div className="participant-indicators">
              <span className={`mic-indicator ${isMicEnabled ? 'active' : 'muted'}`}>
                🎤
              </span>
            </div>
          </div>
        </div>
        
        {/* Mock participant for testing UI */}
        <div className="video-participant">
          <div className="video-container">
            <div className="video-placeholder">
              <span className="participant-initial">D</span>
            </div>
          </div>
          <div className="participant-info">
            <span className="participant-name">
              DM (Mock User)
            </span>
            <div className="participant-indicators">
              <span className="mic-indicator active">
                🎤
              </span>
            </div>
          </div>
        </div>
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
          className="control-btn inactive"
          aria-label="Start screen sharing (disabled in dev mode)"
          disabled
        >
          💻
        </button>
      </div>
    </div>
  );
};

export default DevModeVideoGrid;
