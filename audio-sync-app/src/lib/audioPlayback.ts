let mediaSource: MediaSource | null = null;
let sourceBuffer: SourceBuffer | null = null;
let audioEl: HTMLAudioElement | null = null;
let queue: ArrayBuffer[] = [];
let isAppending = false;

export function startPlayback() {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.autoplay = true;
    mediaSource = new MediaSource();
    audioEl.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener('sourceopen', () => {
      // The mimeType MUST match what the MediaRecorder is sending!
      // 'audio/webm;codecs=opus' is what we set in audioCapture.ts
      try {
        sourceBuffer = mediaSource!.addSourceBuffer('audio/webm;codecs=opus');
        
        sourceBuffer.addEventListener('updateend', () => {
          isAppending = false;
          processQueue();
        });
      } catch (e) {
        console.error('MSE Error: Browser might not support audio/webm', e);
      }
    });
  }
  
  audioEl.play().catch(e => console.error('Audio play failed (needs interaction):', e));
}

function processQueue() {
  if (sourceBuffer && !isAppending && queue.length > 0 && !sourceBuffer.updating) {
    isAppending = true;
    const chunk = queue.shift();
    if (chunk) {
      try {
        sourceBuffer.appendBuffer(chunk);
      } catch (e) {
        console.error('Error appending buffer:', e);
        isAppending = false;
      }
    }
  }
}

export function enqueueChunk(chunk: ArrayBuffer) {
  queue.push(chunk);
  processQueue();
}
