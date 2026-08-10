// Web Speech API Voice Helper with Auto-Silence Timeout & Audio Chimes

export interface SpeechRecognitionResultHandler {
  (transcript: string, isFinal: boolean): void;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

// Simple Web Audio API beep generator for instant audio feedback
function playAudioChime(type: "start" | "stop") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    const now = ctx.currentTime;
    if (type === "start") {
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    } else {
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    setTimeout(() => {
      try {
        ctx.close();
      } catch (e) {}
    }, 350);
  } catch (e) {
    // Audio context may require prior user interaction
  }
}

export class VoiceListener {
  private recognition: any = null;
  private isListening = false;
  private silenceTimer: any = null;
  private silenceTimeoutMs = 5000;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  private supported: boolean;

  constructor(
    private onResult: SpeechRecognitionResultHandler,
    private onError?: (err: string) => void,
    private onEnd?: () => void,
    private onAudioLevel?: (level: number) => void,
    silenceTimeoutMs = 5000
  ) {
    this.silenceTimeoutMs = silenceTimeoutMs;
    this.supported = isSpeechRecognitionSupported();
  }

  // Build a brand-new SpeechRecognition instance and wire up its handlers.
  // Some browsers (especially on mobile) leave a recognition object in a
  // stuck/unusable state after it has fired once, so re-using a single
  // long-lived instance across multiple dictation sessions is unreliable.
  // Creating a fresh instance each time start() is called avoids that.
  private createRecognition(): any {
    if (typeof window === "undefined") return null;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      this.isListening = true;
    };

    recognition.onresult = (event: any) => {
      try {
        let transcript = "";
        let isFinal = false;

        if (event && event.results) {
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i] && event.results[i][0]) {
              transcript += event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                isFinal = true;
              }
            }
          }
        }

        if (transcript && transcript.trim()) {
          this.resetSilenceTimer();
          if (this.onResult) {
            this.onResult(transcript.trim(), isFinal);
          }
        }

        if (isFinal) {
          this.stop();
        }
      } catch (err) {
        console.error("Speech onresult error:", err);
      }
    };

    recognition.onerror = (event: any) => {
      const errType = event?.error;
      console.warn("Speech recognition error:", errType);

      if (errType === "no-speech") {
        return;
      }

      this.cleanupAudioAnalyzer();
      this.clearSilenceTimer();
      const wasListening = this.isListening;
      this.isListening = false;

      if (wasListening) {
        playAudioChime("stop");
      }

      if (this.onError) {
        try {
          if (errType === "not-allowed") {
            this.onError("Microphone permission denied. Please allow microphone access in your browser settings.");
          } else if (errType !== "aborted") {
            this.onError(errType || "speech-error");
          }
        } catch (err) {
          console.error("Speech onError handler failed:", err);
        }
      }
    };

    recognition.onend = () => {
      this.cleanupAudioAnalyzer();
      this.clearSilenceTimer();
      const wasListening = this.isListening;
      this.isListening = false;
      if (wasListening) {
        playAudioChime("stop");
      }
      // Drop the reference so the next start() always builds a fresh instance.
      if (this.recognition === recognition) {
        this.recognition = null;
      }
      if (this.onEnd) {
        try {
          this.onEnd();
        } catch (err) {
          console.error("Speech onEnd handler failed:", err);
        }
      }
    };

    return recognition;
  }

  private resetSilenceTimer() {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      if (this.isListening) {
        console.log("Auto-stopping speech recognition due to silence");
        this.stop();
      }
    }, this.silenceTimeoutMs);
  }

  private clearSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private startAudioAnalyzer(stream: MediaStream) {
    try {
      this.mediaStream = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!this.analyser || !this.isListening) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 128); // 0.0 to 1.0
        if (this.onAudioLevel) {
          this.onAudioLevel(normalized);
        }
        this.animFrameId = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.warn("Failed to initialize audio level analyzer:", err);
    }
  }

  private cleanupAudioAnalyzer() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }
    this.analyser = null;
    if (this.onAudioLevel) {
      this.onAudioLevel(0);
    }
  }

  async start() {
    if (!this.supported) {
      if (this.onError) {
        this.onError("Speech recognition is not supported in this browser.");
      }
      return;
    }

    if (this.isListening) {
      this.stop();
    }

    // Always build a fresh recognition instance for this session (see
    // createRecognition() for why re-using one across sessions breaks).
    this.recognition = this.createRecognition();
    if (!this.recognition) {
      if (this.onError) {
        this.onError("Speech recognition is not supported in this browser.");
      }
      return;
    }

    try {
      // Try getting mic stream for level analyzer
      if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.startAudioAnalyzer(stream);
        } catch (micErr) {
          console.warn("Microphone access prompt error:", micErr);
        }
      }

      this.recognition.start();
      this.isListening = true;
      playAudioChime("start");
    } catch (e: any) {
      console.warn("Failed to start speech recognition:", e);
      if (e?.name === "InvalidStateError" || e?.message?.includes("already started")) {
        this.isListening = true;
        return;
      }
      this.isListening = false;
      this.cleanupAudioAnalyzer();
      this.clearSilenceTimer();
      if (this.onError) {
        this.onError("Failed to start voice recognition.");
      }
    }
  }

  stop() {
    this.clearSilenceTimer();
    this.cleanupAudioAnalyzer();
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn("Failed to stop speech recognition:", e);
      } finally {
        if (this.isListening) {
          playAudioChime("stop");
        }
        this.isListening = false;
      }
    }
  }

  getListeningState() {
    return this.isListening;
  }
}

// Simple Text-to-Speech playback helper
export function speakText(text: string) {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel(); // Stop ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
    }
  }
}

