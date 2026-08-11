import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, ArrowRight, ArrowLeft, Check } from "lucide-react";

interface TourStep {
  target: string; // matches a data-tour="..." attribute in the real UI
  title: string;
  body: string;
}

const ALL_STEPS: TourStep[] = [
  {
    target: "hero-search",
    title: "Ask for anything",
    body: "Type, speak, or snap a photo here to instantly find where you put something.",
  },
  {
    target: "remember-card",
    title: "Remember something",
    body: "Tap here whenever you put something down — snap a photo or just tell Rembr where it is.",
  },
  {
    target: "scan-space-card",
    title: "Scan a whole space",
    body: "Got a messy drawer, shelf, or toolbox? Scan it once and every item inside gets saved automatically.",
  },
  {
    target: "lend-item-card",
    title: "Track what you lend",
    body: "Lending something to a friend? Log it here so you always remember who has it.",
  },
  {
    target: "nav-home",
    title: "Always available",
    body: "This bar stays with you everywhere in the app. Home brings you back here anytime.",
  },
  {
    target: "nav-add",
    title: "Quick add",
    body: "Tap the plus button any time for fast access to Remember, Scan, or Lend.",
  },
  {
    target: "nav-more",
    title: "Settings & help",
    body: "Find dark mode, privacy options, and this tour again anytime under More.",
  },
];

interface OnboardingTourProps {
  hideBorrowedSection?: boolean;
  onFinish: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ hideBorrowedSection, onFinish }) => {
  const steps = ALL_STEPS.filter(
    (s) => !(hideBorrowedSection && (s.target === "lend-item-card" || s.target === "nav-loaned"))
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);

  const step = steps[stepIndex];

  const measure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  // When the step changes, scroll its target into view, then measure once
  // the smooth-scroll has had time to settle.
  useEffect(() => {
    if (!step) return;
    setRect(null);
    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(measure, 380);
    return () => clearTimeout(t);
  }, [step, measure]);

  // Keep the spotlight glued to its target through scrolling/resizing.
  useEffect(() => {
    const onScrollOrResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [measure]);

  if (!step) return null;

  const handleNext = () => {
    if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
    else onFinish();
  };
  const handleBack = () => setStepIndex((i) => Math.max(0, i - 1));

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const PAD = 8;
  const TOOLTIP_W = Math.min(320, vw - 32);

  let tooltipStyle: React.CSSProperties;
  if (rect) {
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    const placeBelow = spaceBelow > 190 || spaceBelow > spaceAbove;
    let left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
    left = Math.max(16, Math.min(left, vw - TOOLTIP_W - 16));
    tooltipStyle = placeBelow
      ? { left, width: TOOLTIP_W, top: Math.min(rect.bottom + 16, vh - 210) }
      : { left, width: TOOLTIP_W, bottom: vh - rect.top + 16 };
  } else {
    tooltipStyle = { left: vw / 2 - TOOLTIP_W / 2, width: TOOLTIP_W, top: vh / 2 - 100 };
  }

  return (
    <div className="fixed inset-0 z-[85]">
      {rect ? (
        <>
          {/* Dimmed frame around the spotlight, in 4 pieces so the target
              itself stays fully visible and un-dimmed. */}
          <div
            className="fixed bg-black/70 transition-all duration-300"
            style={{ left: 0, top: 0, width: "100%", height: Math.max(0, rect.top - PAD) }}
          />
          <div
            className="fixed bg-black/70 transition-all duration-300"
            style={{ left: 0, top: rect.bottom + PAD, width: "100%", height: Math.max(0, vh - rect.bottom - PAD) }}
          />
          <div
            className="fixed bg-black/70 transition-all duration-300"
            style={{ left: 0, top: Math.max(0, rect.top - PAD), width: Math.max(0, rect.left - PAD), height: rect.height + PAD * 2 }}
          />
          <div
            className="fixed bg-black/70 transition-all duration-300"
            style={{ left: rect.right + PAD, top: Math.max(0, rect.top - PAD), width: Math.max(0, vw - rect.right - PAD), height: rect.height + PAD * 2 }}
          />
          {/* Invisible blocker over the spotlighted element itself, so
              tapping it mid-tour doesn't navigate away from the walkthrough. */}
          <div
            className="fixed"
            style={{ left: rect.left - PAD, top: rect.top - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }}
            onClick={(e) => e.stopPropagation()}
          />
          {/* Decorative highlight ring */}
          <div
            className="fixed rounded-2xl ring-2 ring-[#7CA65B] shadow-[0_0_24px_rgba(124,166,91,0.55)] pointer-events-none transition-all duration-300"
            style={{ left: rect.left - PAD, top: rect.top - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-black/70" />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-10 bg-white dark:bg-[#211F1B] rounded-2xl shadow-2xl p-4 animate-fade-in"
        style={tooltipStyle}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-[#7CA65B] dark:text-[#A8C98B] uppercase tracking-wider">
            Step {stepIndex + 1} of {steps.length}
          </span>
          <button
            onClick={onFinish}
            className="text-[#83827C] hover:text-[#30302E] dark:hover:text-white p-1 -m-1 rounded-lg"
            title="Skip tour"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <h3 className="text-sm font-bold text-[#30302E] dark:text-[#E5E3DA] mb-1">{step.title}</h3>
        <p className="text-xs text-[#83827C] dark:text-[#A8A7A2] leading-relaxed mb-3.5">{step.body}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === stepIndex ? "bg-[#7CA65B]" : "bg-[#E5E3DA] dark:bg-[#3E3D3A]"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                onClick={handleBack}
                className="p-2 rounded-xl bg-[#EFEEE7] dark:bg-[#1E1C19] text-[#44433F] dark:text-[#E5E3DA] transition-colors"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#7CA65B] hover:bg-[#6B9149] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              {stepIndex < steps.length - 1 ? (
                <>
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Done</span>
                  <Check className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
