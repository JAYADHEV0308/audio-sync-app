import { useEffect, useState } from 'react';
import WebRTCManager from '../lib/webRTCManager';
import { startCapture, stopCapture } from '../lib/audioCapture';

interface SourceViewProps {
  roomId: string;
}

export default function SourceView({ roomId }: SourceViewProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [rtcManager, setRtcManager] = useState<WebRTCManager | null>(null);

  useEffect(() => {
    const manager = new WebRTCManager(roomId, 'source');
    setRtcManager(manager);

    return () => {
      manager.disconnect();
    };
  }, [roomId]);

  const handleStart = async () => {
    try {
      await startCapture((audioChunk) => {
        if (rtcManager) {
          rtcManager.broadcastData(audioChunk);
        }
      });
      setIsStreaming(true);
    } catch (err) {
      console.error('Failed to start capture', err);
    }
  };

  const handleStop = () => {
    stopCapture();
    setIsStreaming(false);
  };

  return (
    <div className="view-container">
      <h2>Broadcasting Audio</h2>
      <p>Room: {roomId}</p>
      <div className="status">
        Status: {isStreaming ? 'Streaming' : 'Idle'}
      </div>
      <div className="controls">
        {!isStreaming ? (
          <button onClick={handleStart}>Start Broadcast</button>
        ) : (
          <button onClick={handleStop} style={{ backgroundColor: '#dc3545' }}>Stop Broadcast</button>
        )}
      </div>
    </div>
  );
}
