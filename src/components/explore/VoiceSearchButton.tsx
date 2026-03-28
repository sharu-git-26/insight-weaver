import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff } from "lucide-react";

interface VoiceSearchButtonProps {
  onResult: (text: string) => void;
  disabled?: boolean;
}

const NUM_BARS = 5;

const VoiceSearchButton = ({ onResult, disabled }: VoiceSearchButtonProps) => {
  const [isListening, setIsListening] = useState(false);
  const [barHeights, setBarHeights] = useState<number[]>(Array(NUM_BARS).fill(4));
  const animFrameRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Animate voice wave bars using microphone input
  useEffect(() => {
    if (!isListening) {
      setBarHeights(Array(NUM_BARS).fill(4));
      return;
    }

    let cancelled = false;

    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (cancelled) return;
          analyser.getByteFrequencyData(dataArray);
          const heights = Array.from({ length: NUM_BARS }, (_, i) => {
            const val = dataArray[i * 2] || 0;
            return Math.max(4, (val / 255) * 28);
          });
          setBarHeights(heights);
          animFrameRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        // Fallback: random wave animation
        const tick = () => {
          if (cancelled) return;
          setBarHeights(Array.from({ length: NUM_BARS }, () => 4 + Math.random() * 24));
          animFrameRef.current = requestAnimationFrame(tick);
        };
        tick();
      }
    };
    startAudio();

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isListening]);

  const handleVoice = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    recognition.start();
  }, [onResult]);

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleVoice}
      disabled={disabled}
      className={`relative p-2.5 rounded-lg transition-all flex items-center gap-1 ${
        isListening
          ? "bg-red-500/20 text-red-400 border border-red-500/40 px-4"
          : "text-muted-foreground hover:text-primary hover:bg-primary/10"
      }`}
      title="Voice search"
    >
      <AnimatePresence mode="wait">
        {isListening ? (
          <motion.div
            key="listening"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center gap-1"
          >
            <MicOff className="w-4 h-4 mr-1" />
            {/* Voice wave bars */}
            <div className="flex items-center gap-[2px] h-6">
              {barHeights.map((h, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-red-400"
                  animate={{ height: h }}
                  transition={{ duration: 0.05 }}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Mic className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default VoiceSearchButton;
