let stream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let processor: ScriptProcessorNode | null = null;
let sourceNode: MediaStreamAudioSourceNode | null = null;

export async function startCapture(onDataAvailable: (data: ArrayBuffer) => void) {
  try {
    // Capture system/tab audio
    stream = await navigator.mediaDevices.getDisplayMedia({ 
      audio: true, 
      video: true 
    });
    
    // Use Web Audio API to extract raw PCM data
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // We must ensure the sample rate matches the receiver. 
    // Standardizing on the browser's default audioContext.sampleRate
    
    sourceNode = audioContext.createMediaStreamSource(stream);
    
    // 4096 frames per chunk (roughly 90ms at 44.1kHz)
    processor = audioContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (event) => {
      const inputBuffer = event.inputBuffer;
      const channelData = inputBuffer.getChannelData(0); // Float32Array of raw PCM
      
      // Send the raw Float32Array buffer over WebRTC
      // We slice it to ensure we send a clean copy
      onDataAvailable(channelData.slice().buffer);
    };
    
    sourceNode.connect(processor);
    processor.connect(audioContext.destination); // Required for processor to run in some browsers
    
  } catch (err) {
    console.error('Error accessing audio stream:', err);
    throw err;
  }
}

export function stopCapture() {
  if (processor && audioContext) {
    processor.disconnect();
    sourceNode?.disconnect();
    audioContext.close();
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}
