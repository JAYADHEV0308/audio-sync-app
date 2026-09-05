import { useState } from 'react';
import './App.css';
import SourceView from './components/SourceView';
import ReceiverView from './components/ReceiverView';

type Role = 'source' | 'receiver' | null;

function App() {
  const [role, setRole] = useState<Role>(null);
  const [roomId, setRoomId] = useState<string>('room-1234');

  if (!role) {
    return (
      <div className="app-container">
        <h1>Audio Sync Streamer</h1>
        <div className="role-selection">
          <h2>Select your role:</h2>
          <input 
            type="text" 
            value={roomId} 
            onChange={(e) => setRoomId(e.target.value)} 
            placeholder="Room ID" 
          />
          <div className="buttons">
            <button onClick={() => setRole('source')}>Broadcast Audio (Source)</button>
            <button onClick={() => setRole('receiver')}>Listen (Receiver)</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <button className="back-btn" onClick={() => setRole(null)}>Change Role</button>
      {role === 'source' ? <SourceView roomId={roomId} /> : <ReceiverView roomId={roomId} />}
    </div>
  );
}

export default App;
