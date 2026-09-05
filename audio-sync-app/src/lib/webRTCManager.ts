import { io, Socket } from 'socket.io-client';

const SIGNALING_SERVER_URL = import.meta.env.VITE_SIGNALING_SERVER_URL || `http://${window.location.hostname}:3001`;

export default class WebRTCManager {
  private socket: Socket;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  public onDataReceived?: (data: any) => void;

  constructor(private roomId: string, private role: 'source' | 'receiver') {
    this.socket = io(SIGNALING_SERVER_URL);
    this.setupSocket();
  }

  private setupSocket() {
    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
      this.socket.emit('join-room', this.roomId, this.role);
    });

    this.socket.on('user-joined', async ({ userId, role }) => {
      if (this.role === 'source' && role === 'receiver') {
        await this.createPeerConnection(userId, true);
      }
    });

    this.socket.on('offer', async (data) => {
      if (this.role === 'receiver') {
        const pc = await this.createPeerConnection(data.callerId, false);
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.socket.emit('answer', { target: data.callerId, sdp: pc.localDescription });
      }
    });

    this.socket.on('answer', async (data) => {
      const pc = this.peerConnections.get(data.answererId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }
    });

    this.socket.on('ice-candidate', async (data) => {
      const pc = this.peerConnections.get(data.senderId);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });
  }

  private async createPeerConnection(targetId: string, isInitiator: boolean) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    this.peerConnections.set(targetId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', { target: targetId, candidate: event.candidate });
      }
    };

    if (isInitiator) {
      const dc = pc.createDataChannel('audio-sync', { ordered: false, maxRetransmits: 0 });
      this.setupDataChannel(dc, targetId);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.socket.emit('offer', { target: targetId, sdp: pc.localDescription });
    } else {
      pc.ondatachannel = (event) => {
        this.setupDataChannel(event.channel, targetId);
      };
    }

    return pc;
  }

  private setupDataChannel(dc: RTCDataChannel, targetId: string) {
    dc.binaryType = 'arraybuffer';
    dc.onopen = () => console.log(`Data channel open with ${targetId}`);
    dc.onmessage = (event) => {
      if (this.onDataReceived) {
        this.onDataReceived(event.data);
      }
    };
    this.dataChannels.set(targetId, dc);
  }

  public broadcastData(data: ArrayBuffer) {
    if (this.role !== 'source') return;
    this.dataChannels.forEach((dc) => {
      if (dc.readyState === 'open') {
        dc.send(data);
      }
    });
  }

  public disconnect() {
    this.dataChannels.forEach(dc => dc.close());
    this.peerConnections.forEach(pc => pc.close());
    this.socket.disconnect();
  }
}
