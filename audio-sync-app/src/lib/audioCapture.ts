let mediaRecorder: MediaRecorder | null = null;
let stream: MediaStream | null = null;

export async function startCapture(onDataAvailable: (data: ArrayBuffer) => void) {
  try {
    // getDisplayMedia allows capturing Tab/System audio (Screen Share)
    stream = await navigator.mediaDevices.getDisplayMedia({ 
      audio: true, 
      video: true // Video must be true for screen share, but we will only send audio
    });
    
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    
    mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        const arrayBuffer = await event.data.arrayBuffer();
        onDataAvailable(arrayBuffer);
      }
    };
    
    // Capture small chunks every 100ms
    mediaRecorder.start(100);
  } catch (err) {
    console.error('Error accessing microphone:', err);
    throw err;
  }
}

export function stopCapture() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}
