import React from "react";
import { Camera, Mic, Search, ShieldCheck, ArrowRight, CheckCircle2, HandHeart } from "lucide-react";

interface OnboardingModalProps {
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#1A1816]/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#23201C] border border-[#E8E4E1] dark:border-[#38332E] rounded-[32px] max-w-md w-full p-6 shadow-2xl overflow-hidden relative">
        {/* Decorative background glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#6B7E6D]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#5A7D9A]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Icon Header */}
        <div className="w-16 h-16 bg-[#6B7E6D] rounded-2xl flex items-center justify-center text-white mx-auto shadow-md mb-5">
          <Search className="w-8 h-8" />
        </div>

        <h2 className="text-3xl font-extrabold text-center text-[#2D2A26] dark:text-[#E8E4E1] mb-2 lowercase tracking-tight">
          rembr
        </h2>
        <p className="text-center text-[#8C847E] dark:text-[#A3B0A5] text-sm font-medium mb-6">
          Never forget where you put something again.
        </p>

        {/* How it works steps */}
        <div className="space-y-3.5 mb-8">
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#F2EDE9] dark:bg-[#2E2A25] border border-[#E8E4E1] dark:border-[#38332E]">
            <div className="w-9 h-9 rounded-xl bg-[#6B7E6D]/20 text-[#6B7E6D] dark:text-[#91A493] flex items-center justify-center shrink-0 font-bold">
              1
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#2D2A26] dark:text-[#E8E4E1] flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#6B7E6D]" />
                Take a photo
              </h3>
              <p className="text-xs text-[#8C847E] dark:text-[#A3B0A5] mt-0.5">
                Snap an item or scan an entire drawer, shelf, or toolbox.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#F2EDE9] dark:bg-[#2E2A25] border border-[#E8E4E1] dark:border-[#38332E]">
            <div className="w-9 h-9 rounded-xl bg-[#C2847A]/20 text-[#C2847A] dark:text-[#DA9E94] flex items-center justify-center shrink-0 font-bold">
              2
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#2D2A26] dark:text-[#E8E4E1] flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-[#C2847A]" />
                Tell the app what to remember
              </h3>
              <p className="text-xs text-[#8C847E] dark:text-[#A3B0A5] mt-0.5">
                Speak or type e.g., "Car keys" or "Passport in top drawer".
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#F2EDE9] dark:bg-[#2E2A25] border border-[#E8E4E1] dark:border-[#38332E]">
            <div className="w-9 h-9 rounded-xl bg-[#5A7D9A]/20 text-[#5A7D9A] dark:text-[#7A9DBA] flex items-center justify-center shrink-0 font-bold">
              3
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#2D2A26] dark:text-[#E8E4E1] flex items-center gap-1.5">
                <Search className="w-4 h-4 text-[#5A7D9A]" />
                Ask for it later
              </h3>
              <p className="text-xs text-[#8C847E] dark:text-[#A3B0A5] mt-0.5">
                Ask "Where are my keys?" and instantly see the photo & spot.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#F2EDE9] dark:bg-[#2E2A25] border border-[#E8E4E1] dark:border-[#38332E]">
            <div className="w-9 h-9 rounded-xl bg-[#C2847A]/20 text-[#C2847A] dark:text-[#DA9E94] flex items-center justify-center shrink-0 font-bold">
              4
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#2D2A26] dark:text-[#E8E4E1] flex items-center gap-1.5">
                <HandHeart className="w-4 h-4 text-[#C2847A]" />
                Track what you've lent out
              </h3>
              <p className="text-xs text-[#8C847E] dark:text-[#A3B0A5] mt-0.5">
                Use Borrowed to log loans and get reminded until they're back.
              </p>
            </div>
          </div>
        </div>

        {/* Help hint */}
        <p className="text-center text-[11px] text-[#8C847E] dark:text-[#A3B0A5] mb-4">
          Tap the <span className="font-semibold">Help</span> icon anytime for tips and troubleshooting.
        </p>

        {/* Privacy Note */}
        <div className="flex items-center justify-center gap-2 text-xs text-[#6B7E6D] dark:text-[#91A493] mb-6 bg-[#6B7E6D]/10 p-2.5 rounded-xl border border-[#6B7E6D]/20">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Your household photos stay private on your device.</span>
        </div>

        {/* Get Started Button */}
        <button
          onClick={onComplete}
          className="w-full py-4 px-6 bg-[#6B7E6D] hover:bg-[#586A5A] text-white font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 text-base transition-all active:scale-[0.99]"
        >
          <span>Get Started</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
