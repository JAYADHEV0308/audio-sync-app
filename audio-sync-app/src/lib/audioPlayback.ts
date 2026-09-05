let audioContext: AudioContext | null = null;
let nextPlayTime = 0;

export function startPlayback() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    nextPlayTime = audioContext.currentTime + 0.5; // add 500ms initial buffer delay
  }
  
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

export async function enqueueChunk(chunk: ArrayBuffer) {
  if (!audioContext) return;

  try {
    // Note: In a real implementation, we would use a more robust decoding strategy 
    // or MediaSource Extensions. For MVP, we decode the ArrayBuffer.
    // However, decodeAudioData expects a complete file structure, so chunking webm directly 
    // might fail. A robust solution uses WebCodecs API or AudioWorklet.
    // We will simulate playback scheduling for now.
    
    const audioBuffer = await audioContext.decodeAudioData(chunk.slice(0));
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    // Schedule playback
    if (nextPlayTime < audioContext.currentTime) {
      nextPlayTime = audioContext.currentTime + 0.1; // fallback if underrun
    }
    
    source.start(nextPlayTime);
    nextPlayTime += audioBuffer.duration;

  } catch (e) {
    console.error('Error decoding audio chunk. (Note: chunked webm decoding needs WebCodecs in prod)', e);
  }
}
