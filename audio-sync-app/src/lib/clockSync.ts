// Simple clock synchronization algorithm

export interface SyncMessage {
  type: 'ping' | 'pong';
  clientSendTime: number;
  serverReceiveTime?: number;
  serverSendTime?: number;
}

export class ClockSync {
  private offsets: number[] = [];
  public clockOffset: number = 0; // ms difference between local and source clock

  public handleMessage(msg: SyncMessage, sendReply: (reply: SyncMessage) => void) {
    const now = Date.now();

    if (msg.type === 'ping') {
      // We are the source, replying to a ping
      sendReply({
        type: 'pong',
        clientSendTime: msg.clientSendTime,
        serverReceiveTime: now,
        serverSendTime: Date.now()
      });
    } else if (msg.type === 'pong') {
      // We are the receiver, calculating offset
      const rtt = now - msg.clientSendTime;
      const latency = rtt / 2;
      
      // offset = ServerTime - ClientTime
      // ServerTime at moment of receipt = msg.serverSendTime + latency
      const estimatedServerTime = (msg.serverSendTime || 0) + latency;
      const offset = estimatedServerTime - now;
      
      this.offsets.push(offset);
      
      // Keep last 10 samples
      if (this.offsets.length > 10) {
        this.offsets.shift();
      }
      
      // Average offset
      this.clockOffset = this.offsets.reduce((a, b) => a + b, 0) / this.offsets.length;
      console.log(`Clock offset updated: ${this.clockOffset}ms (Latency: ${latency}ms)`);
    }
  }

  public getSyncedTime() {
    return Date.now() + this.clockOffset;
  }
}
