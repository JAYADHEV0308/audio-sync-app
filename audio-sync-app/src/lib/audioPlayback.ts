let audioContext: AudioContext | null = null;
let nextPlayTime = 0;
// We add a target latency buffer to absorb network jitter
const TARGET_LATENCY_SECONDS = 0.3; 

export function startPlayback() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  // Reset the playhead to the future to build a buffer
  nextPlayTime = audioContext.currentTime + TARGET_LATENCY_SECONDS;
  console.log('Playback started. Sample Rate:', audioContext.sampleRate);
}

export function enqueueChunk(chunk: ArrayBuffer) {
  if (!audioContext) return;

  try {
    // The chunk is a raw Float32Array from the sender
    const pcmData = new Float32Array(chunk);
    
    // Create an empty AudioBuffer for this chunk
    // 1 channel, length of the pcm data, matching the device's sample rate
    const audioBuffer = audioContext.createBuffer(1, pcmData.length, audioContext.sampleRate);
    
    // Fill it with the raw PCM data
    audioBuffer.copyToChannel(pcmData, 0);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    // Prevent underrun: If we fell behind, skip the playhead forward
    if (nextPlayTime < audioContext.currentTime) {
      console.warn('Buffer underrun detected, resetting playhead');
      nextPlayTime = audioContext.currentTime + (TARGET_LATENCY_SECONDS / 2);
    }
    
    // Precisely schedule the playback
    source.start(nextPlayTime);
    
    // Advance the playhead by the exact mathematical duration of this chunk
    nextPlayTime += audioBuffer.duration;

  } catch (e) {
    console.error('Error scheduling raw PCM chunk:', e);
  }
}
