import React, { useEffect, useRef } from "react";
import { Mic, Square } from "lucide-react";

interface DictationIndicatorProps {
  isListening: boolean;
  transcript?: string;
  audioLevel?: number;
  onStop: () => void;
  label?: string;
  className?: string;
}

// Interactive moving audio waveform line & spectrum graph canvas
const AudioWaveformCanvas: React.FC<{ isListening: boolean; audioLevel?: number }> = ({
  isListening,
  audioLevel = 0.35,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isListening) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      phase += 0.08;
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Subtle background grid
      ctx.strokeStyle = "rgba(194, 132, 122, 0.12)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Base level for wave calculation
      const level = Math.max(0.2, audioLevel || 0.35);
      const amp1 = level * (height * 0.38);
      const amp2 = level * (height * 0.22);

      // Filled gradient beneath wave
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "rgba(194, 132, 122, 0.4)");
      grad.addColorStop(0.6, "rgba(194, 132, 122, 0.15)");
      grad.addColorStop(1, "rgba(194, 132, 122, 0)");

      // Wave 1 Filled Area
      ctx.beginPath();
      ctx.moveTo(0, centerY);

      for (let x = 0; x <= width; x += 2) {
        const normX = x / width;
        const envelope = Math.sin(normX * Math.PI);
        const y =
          centerY +
          Math.sin(x * 0.035 + phase) * amp1 * envelope +
          Math.cos(x * 0.02 - phase * 0.8) * amp2 * envelope;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Wave 1 Main Moving Line
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      for (let x = 0; x <= width; x += 2) {
        const normX = x / width;
        const envelope = Math.sin(normX * Math.PI);
        const y =
          centerY +
          Math.sin(x * 0.035 + phase) * amp1 * envelope +
          Math.cos(x * 0.02 - phase * 0.8) * amp2 * envelope;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "#7CA65B";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Wave 2 Secondary Harmonizing Moving Line
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      for (let x = 0; x <= width; x += 2) {
        const normX = x / width;
        const envelope = Math.sin(normX * Math.PI);
        const y =
          centerY +
          Math.sin(x * 0.045 - phase * 1.3) * (amp1 * 0.65) * envelope +
          Math.cos(x * 0.025 + phase) * (amp2 * 0.75) * envelope;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(107, 126, 109, 0.8)";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Draw moving equalizer bars overlay at the bottom
      const numBars = 20;
      const barWidth = 3;
      const spacing = (width - numBars * barWidth) / (numBars + 1);

      for (let i = 0; i < numBars; i++) {
        const x = spacing + i * (barWidth + spacing);
        const barHeight =
          Math.sin(phase * 1.5 + i * 0.4) * (height * 0.25 * level) + height * 0.15;
        const y = height - barHeight;

        ctx.fillStyle = i % 2 === 0 ? "rgba(194, 132, 122, 0.8)" : "rgba(107, 126, 109, 0.8)";
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isListening, audioLevel]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={52}
      className="w-full h-13 rounded-xl bg-[#EFEEE7]/80 dark:bg-[#100F0D]/80 border border-[#7CA65B]/30 shadow-inner"
    />
  );
};

export const DictationIndicator: React.FC<DictationIndicatorProps> = ({
  isListening,
  transcript = "",
  audioLevel,
  onStop,
  label = "Listening to your voice...",
  className = "",
}) => {
  if (!isListening) return null;

  return (
    <div
      className={`p-3.5 bg-[#7CA65B]/15 border-2 border-[#7CA65B] rounded-2xl shadow-xl animate-fade-in space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Animated Equalizer Sound Wave + Status */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex items-center justify-center shrink-0">
            {/* Glowing outer pulse ring */}
            <span className="absolute w-9 h-9 rounded-full bg-[#7CA65B] opacity-40 animate-ping"></span>
            <div className="relative w-9 h-9 rounded-full bg-[#7CA65B] text-white flex items-center justify-center shadow-md">
              <Mic className="w-4 h-4 animate-bounce" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#6B9149] dark:text-[#A8C98B] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#7CA65B] animate-pulse"></span>
                RECORDING / DICTATING
              </span>
            </div>

            <p className="text-xs font-semibold text-[#44433F] dark:text-[#E5E3DA] truncate mt-0.5">
              {label}
            </p>
          </div>
        </div>

        {/* Stop Button */}
        <button
          type="button"
          onClick={onStop}
          className="px-3.5 py-1.5 bg-[#7CA65B] hover:bg-[#6B9149] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow shrink-0 active:scale-95 transition-all cursor-pointer"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>Stop</span>
        </button>
      </div>

      {/* MOVING LINE & GRAPH AUDIO VISUALIZER */}
      <AudioWaveformCanvas isListening={isListening} audioLevel={audioLevel} />

      {/* Realtime Spoken Transcript Box */}
      {transcript ? (
        <div className="p-2.5 bg-white/90 dark:bg-[#100F0D]/90 border border-[#7CA65B]/40 rounded-xl shadow-sm">
          <p className="text-[10px] font-extrabold text-[#6B9149] dark:text-[#A8C98B] uppercase tracking-wider mb-0.5">
            Hearing You Speak:
          </p>
          <p className="text-sm font-bold text-[#30302E] dark:text-[#E5E3DA] italic">
            "{transcript}"
          </p>
        </div>
      ) : (
        <p className="text-[11px] font-medium text-[#83827C] dark:text-[#A8A7A2] italic pl-1">
          Speak now into your microphone... (Text will appear here)
        </p>
      )}

      {/* Auto Silence Helper Note */}
      <div className="flex items-center justify-between text-[10px] text-[#83827C] dark:text-[#A8A7A2] font-medium pt-0.5 px-1 border-t border-[#7CA65B]/20">
        <span>⚡ Dynamic mic level graph</span>
        <span>Tap Stop or pause 5s when done</span>
      </div>
    </div>
  );
};
