import { useEffect, useState } from 'react';
import WebRTCManager from '../lib/webRTCManager';
import { startPlayback, enqueueChunk } from '../lib/audioPlayback';

interface ReceiverViewProps {
  roomId: string;
}

export default function ReceiverView({ roomId }: ReceiverViewProps) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const manager = new WebRTCManager(roomId, 'receiver');
    
    manager.onDataReceived = (data) => {
      // Process incoming audio data
      // For now, assuming data is an ArrayBuffer containing audio chunks
      if (data instanceof ArrayBuffer) {
        enqueueChunk(data);
      }
    };

    // Need user interaction to start Web Audio API Context
    // We'll prompt them to click a button

    return () => {
      manager.disconnect();
    };
  }, [roomId]);

  const handleStartPlayback = () => {
    startPlayback();
    setIsConnected(true);
  };

  return (
    <div className="view-container">
      <h2>Listening to Audio</h2>
      <p>Room: {roomId}</p>
      
      {!isConnected ? (
        <button onClick={handleStartPlayback}>Join Stream (Unmute)</button>
      ) : (
        <div className="status">Receiving Stream...</div>
      )}
    </div>
  );
}
