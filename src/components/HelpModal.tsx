import React, { useState } from "react";
import {
  X,
  HelpCircle,
  Camera,
  Search,
  Grid,
  MapPin,
  HandHeart,
  Mic,
  Settings as SettingsIcon,
  Wrench,
  ChevronDown,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

interface HelpModalProps {
  onClose: () => void;
  onReplayTour?: () => void;
}

interface Topic {
  id: string;
  icon: React.ReactNode;
  color: string;
  title: string;
  body: React.ReactNode;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose, onReplayTour }) => {
  const [openId, setOpenId] = useState<string | null>("remember");

  const topics: Topic[] = [
    {
      id: "remember",
      icon: <Camera className="w-4 h-4" />,
      color: "#D97757",
      title: "Remembering an Item",
      body: (
        <>
          <p>Tap <b>Remember</b> on the home screen. You can fill it in three ways, mixed and matched:</p>
          <ul className="list-disc pl-4 space-y-1 mt-1.5">
            <li>Tap the mic and say a full phrase like <i>"Remember my spare keys are in the top kitchen drawer"</i> — it splits into item name and location automatically.</li>
            <li>Type the Item Name and Location fields directly.</li>
            <li>Snap a photo, then tap <b>Scan Photo with AI</b> to auto-fill the name, location guess and tags.</li>
          </ul>
          <p className="mt-1.5">A floating <b>Save</b> button appears once you've typed a name, so it's always reachable even with the keyboard open.</p>
        </>
      ),
    },
    {
      id: "find",
      icon: <Search className="w-4 h-4" />,
      color: "#D97757",
      title: "Finding an Item",
      body: (
        <>
          <p>Tap <b>Find</b>, or use the search bar on the home screen. Type or dictate a natural question like <i>"Where are my keys?"</i> — the app matches by name, tags and location, with an AI-assisted search layered on top for fuzzier matches.</p>
        </>
      ),
    },
    {
      id: "scan",
      icon: <Grid className="w-4 h-4" />,
      color: "#D97757",
      title: "Scanning a Space",
      body: (
        <>
          <p>Use <b>Scan Space</b> to catalog an entire drawer, shelf, cupboard or toolbox in one photo. Tap <b>Scan Space with AI</b> and it detects individual objects, draws boxes around them, and creates a separate item for each one — all pointing back to that space.</p>
        </>
      ),
    },
    {
      id: "locations",
      icon: <MapPin className="w-4 h-4" />,
      color: "#D97757",
      title: "Browsing Locations",
      body: (
        <>
          <p>The <b>Locations</b> section groups your items by where they're stored, so you can browse by spot instead of by item. It's hidden by default to keep the home screen simple — turn it back on any time in <b>Settings → Show Locations Section</b>.</p>
        </>
      ),
    },
    {
      id: "borrowed",
      icon: <HandHeart className="w-4 h-4" />,
      color: "#D97757",
      title: "Tracking Borrowed Items",
      body: (
        <>
          <p>Tap <b>Borrowed</b> to log something you've lent out: the item, who has it, and the date. Dictation works here too — try saying <i>"Lent my sander to John"</i>.</p>
          <p className="mt-1.5">After saving, you'll be asked to set a reminder: 3 days, 1 week, 2 weeks, or none. If set, you'll keep getting nudged — daily, right in the app, plus a real phone notification once the native app is built — until you either change the reminder to "none" or tap <b>Mark Returned</b>.</p>
        </>
      ),
    },
    {
      id: "voice",
      icon: <Mic className="w-4 h-4" />,
      color: "#D97757",
      title: "Voice Dictation Tips",
      body: (
        <>
          <p>Tap any mic icon and speak naturally — it stops automatically after about 5 seconds of silence, or tap the mic again to stop early.</p>
          <ul className="list-disc pl-4 space-y-1 mt-1.5">
            <li>Remembering: use a preposition like "in", "on", "under" — e.g. <i>"Passport is in the bedroom drawer"</i>.</li>
            <li>Borrowing: use "to" — e.g. <i>"Grill to Sarah"</i>.</li>
            <li>Your browser will ask for microphone permission the first time — allow it, or dictation won't work.</li>
          </ul>
        </>
      ),
    },
    {
      id: "settings",
      icon: <SettingsIcon className="w-4 h-4" />,
      color: "#83827C",
      title: "Settings & Privacy",
      body: (
        <>
          <p>Everything is stored on your device — no cloud account, no server database. In <b>Settings</b> you can switch dark mode, keep full-resolution photos, blur recent items/locations for privacy, control duplicate-name prompts, and toggle the Locations and Borrowed sections on or off.</p>
        </>
      ),
    },
    {
      id: "troubleshooting",
      icon: <Wrench className="w-4 h-4" />,
      color: "#D97757",
      title: "Troubleshooting",
      body: (
        <>
          <ul className="list-disc pl-4 space-y-1.5">
            <li><b>Camera won't open:</b> your browser needs camera permission — check your browser or phone's site settings.</li>
            <li><b>Mic doesn't respond:</b> allow microphone access when prompted; some in-app browsers (e.g. inside social apps) block it — try opening in Chrome or Safari directly.</li>
            <li><b>Photos look cropped:</b> full photos are always saved — if a preview still looks cut off, reload the app to pick up the latest version.</li>
            <li><b>No phone notification for a Borrowed reminder:</b> push notifications only work in the installed native app (built via Android Studio), not the browser version. The in-app overdue banner works everywhere.</li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#262624]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#2B2A28] border border-[#E5E3DA] dark:border-[#3E3D3A] rounded-[32px] max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E5E3DA] dark:border-[#3E3D3A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#D97757]/10 text-[#D97757] dark:text-[#E8A785] flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#30302E] dark:text-[#E5E3DA] leading-tight">
                Help & Tips
              </h2>
              <p className="text-xs text-[#83827C] dark:text-[#A8A7A2]">
                How everything in rembr works
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#83827C] hover:text-[#30302E] dark:hover:text-white rounded-xl hover:bg-[#EFEEE7] dark:hover:bg-[#33322F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto py-4 space-y-2.5 pr-1 flex-1">
          {onReplayTour && (
            <button
              type="button"
              onClick={onReplayTour}
              className="w-full py-3 px-4 bg-[#D97757]/10 hover:bg-[#D97757]/20 text-[#D97757] dark:text-[#E8A785] font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-[#D97757]/20 mb-1"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Replay Welcome Tour</span>
            </button>
          )}

          {topics.map((topic) => {
            const isOpen = openId === topic.id;
            return (
              <div
                key={topic.id}
                className="bg-[#EFEEE7] dark:bg-[#33322F] border border-[#E5E3DA] dark:border-[#3E3D3A] rounded-2xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : topic.id)}
                  className="w-full flex items-center justify-between gap-3 p-3.5 text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${topic.color}22`, color: topic.color }}
                    >
                      {topic.icon}
                    </div>
                    <span className="font-bold text-sm text-[#30302E] dark:text-[#E5E3DA] truncate">
                      {topic.title}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#83827C] shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3.5 -mt-1 text-xs leading-relaxed text-[#44433F] dark:text-[#A8A7A2]">
                    {topic.body}
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex items-center justify-center gap-2 text-xs text-[#D97757] dark:text-[#E8A785] mt-3 bg-[#D97757]/10 p-2.5 rounded-xl border border-[#D97757]/20">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Everything stays 100% on your device — no cloud account needed.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
