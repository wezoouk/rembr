import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  Moon,
  Sun,
  HardDrive,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Info,
  EyeOff,
  MapPin,
  Copy,
  HandHeart,
} from "lucide-react";
import { AppSettings } from "../types";

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onResetDemoData: () => void;
  onClearAllData: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetDemoData,
  onClearAllData,
  onClose,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleDarkMode = () => {
    onUpdateSettings({ ...settings, darkMode: !settings.darkMode });
  };

  const toggleRetainPhotos = () => {
    onUpdateSettings({
      ...settings,
      retainOriginalPhotos: !settings.retainOriginalPhotos,
    });
  };

  const toggleBlurRecentlySaved = () => {
    onUpdateSettings({
      ...settings,
      blurRecentlySaved: !settings.blurRecentlySaved,
    });
  };

  const toggleBlurLocationRecentlySaved = () => {
    onUpdateSettings({
      ...settings,
      blurLocationRecentlySaved: !settings.blurLocationRecentlySaved,
    });
  };

  const toggleAllowDuplicateItems = () => {
    onUpdateSettings({
      ...settings,
      allowDuplicateItems: !settings.allowDuplicateItems,
    });
  };

  const toggleHideLocationsSection = () => {
    onUpdateSettings({
      ...settings,
      hideLocationsSection: !settings.hideLocationsSection,
    });
  };

  const toggleHideBorrowedSection = () => {
    onUpdateSettings({
      ...settings,
      hideBorrowedSection: !settings.hideBorrowedSection,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1816]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#23201C] border border-[#E8E4E1] dark:border-[#38332E] rounded-[32px] max-w-md w-full p-5 sm:p-6 shadow-2xl relative my-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E4E1] dark:border-[#38332E]">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#2D2A26] dark:text-[#E8E4E1]">
              Settings & Privacy
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8C847E] hover:text-[#2D2A26] dark:hover:text-white rounded-xl hover:bg-[#F2EDE9] dark:hover:bg-[#2E2A25] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-sm">
          {/* PRIVACY BADGE */}
          <div className="p-3.5 bg-[#6B7E6D]/10 border border-[#6B7E6D]/20 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#6B7E6D] dark:text-[#91A493] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#6B7E6D] dark:text-[#91A493] text-xs uppercase tracking-wider">
                100% On-Device Storage
              </p>
              <p className="text-xs text-[#4A443F] dark:text-[#A3B0A5] mt-0.5">
                All photos and item location records are saved directly in your phone's browser storage. No cloud accounts required.
              </p>
            </div>
          </div>

          {/* APPEARANCE TOGGLE */}
          <div className="flex items-center justify-between p-3 bg-[#F2EDE9] dark:bg-[#2E2A25] rounded-2xl border border-[#E8E4E1] dark:border-[#38332E]">
            <div className="flex items-center gap-2.5">
              {settings.darkMode ? (
                <Moon className="w-5 h-5 text-[#DA9E94]" />
              ) : (
                <Sun className="w-5 h-5 text-[#8C847E]" />
              )}
              <span className="font-semibold text-[#2D2A26] dark:text-[#E8E4E1]">
                Dark Theme
              </span>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                settings.darkMode ? "bg-[#6B7E6D]" : "bg-[#E8E4E1]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.darkMode ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* RETAIN FULL RESOLUTION PHOTOS */}
          <div className="flex items-center justify-between p-3 bg-[#F2EDE9] dark:bg-[#2E2A25] rounded-2xl border border-[#E8E4E1] dark:border-[#38332E]">
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-5 h-5 text-[#8C847E] dark:text-[#A3B0A5]" />
              <div>
                <span className="font-semibold text-[#2D2A26] dark:text-[#E8E4E1] block">
                  High Quality Photos
                </span>
                <span className="text-[11px] text-[#8C847E] dark:text-[#A3B0A5]">
                  Save clear preview photos on-device
                </span>
              </div>
            </div>
            <button
              onClick={toggleRetainPhotos}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                settings.retainOriginalPhotos ? "bg-[#6B7E6D]" : "bg-[#E8E4E1]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.retainOriginalPhotos ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* BLUR RECENTLY SAVED PHOTO TOGGLE */}
          <div className="flex items-center justify-between p-3 bg-[#F2EDE9] dark:bg-[#2E2A25] rounded-2xl border border-[#E8E4E1] dark:border-[#38332E]">
            <div className="flex items-center gap-2.5">
              <EyeOff className="w-5 h-5 text-[#8C847E] dark:text-[#A3B0A5]" />
              <div>
                <span className="font-semibold text-[#2D2A26] dark:text-[#E8E4E1] block">
                  Blur Photos on Recently Saved
                </span>
                <span className="text-[11px] text-[#8C847E] dark:text-[#A3B0A5]">
                  Blur photo previews on home screen for privacy
                </span>
              </div>
            </div>
            <button
              onClick={toggleBlurRecentlySaved}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                settings.blurRecentlySaved ? "bg-[#6B7E6D]" : "bg-[#E8E4E1]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.blurRecentlySaved ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* BLUR LOCATION RECENTLY SAVED TOGGLE */}
          <div className="flex items-center justify-between p-3 bg-[#F2EDE9] dark:bg-[#2E2A25] rounded-2xl border border-[#E8E4E1] dark:border-[#38332E]">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-[#8C847E] dark:text-[#A3B0A5]" />
              <div>
                <span className="font-semibold text-[#2D2A26] dark:text-[#E8E4E1] block">
                  Blur Location on Recently Saved
                </span>
                <span className="text-[11px] text-[#8C847E] dark:text-[#A3B0A5]">
                  Blur location text on home screen until hovered/tapped
                </span>
              </div>
            </div>
            <button
              onClick={toggleBlurLocationRecentlySaved}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                settings.blurLocationRecentlySaved ? "bg-[#6B7E6D]" : "bg-[#E8E4E1]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.blurLocationRecentlySaved ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* ALLOW DUPLICATE ITEMS TOGGLE */}
          <div className="flex items-center justify-between p-3 bg-[#F2EDE9] dark:bg-[#2E2A25] rounded-2xl border border-[#E8E4E1] dark:border-[#38332E]">
            <div className="flex items-center gap-2.5">
              <Copy className="w-5 h-5 text-[#8C847E] dark:text-[#A3B0A5]" />
              <div>
                <span className="font-semibold text-[#2D2A26] dark:text-[#E8E4E1] block">
                  Allow Duplicate Items
                </span>
                <span className="text-[11px] text-[#8C847E] dark:text-[#A3B0A5]">
                  If off, prompts for a descriptive name (e.g. "Brown Wallet") when saving duplicates
                </span>
              </div>
            </div>
            <button
              onClick={toggleAllowDuplicateItems}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                settings.allowDuplicateItems ? "bg-[#6B7E6D]" : "bg-[#E8E4E1]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.allowDuplicateItems ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* SHOW / HIDE LOCATIONS SECTION TOGGLE */}
          <div className="flex items-center justify-between p-3 bg-[#F2EDE9] dark:bg-[#2E2A25] rounded-2xl border border-[#E8E4E1] dark:border-[#38332E]">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-[#8C847E] dark:text-[#A3B0A5]" />
              <div>
                <span className="font-semibold text-[#2D2A26] dark:text-[#E8E4E1] block">
                  Show Locations Section
                </span>
                <span className="text-[11px] text-[#8C847E] dark:text-[#A3B0A5]">
                  Display the Browse Locations gallery and button on the home screen
                </span>
              </div>
            </div>
            <button
              onClick={toggleHideLocationsSection}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                !settings.hideLocationsSection ? "bg-[#6B7E6D]" : "bg-[#E8E4E1]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  !settings.hideLocationsSection ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* SHOW / HIDE BORROWED SECTION TOGGLE */}
          <div className="flex items-center justify-between p-3 bg-[#F2EDE9] dark:bg-[#2E2A25] rounded-2xl border border-[#E8E4E1] dark:border-[#38332E]">
            <div className="flex items-center gap-2.5">
              <HandHeart className="w-5 h-5 text-[#8C847E] dark:text-[#A3B0A5]" />
              <div>
                <span className="font-semibold text-[#2D2A26] dark:text-[#E8E4E1] block">
                  Show Borrowed Section
                </span>
                <span className="text-[11px] text-[#8C847E] dark:text-[#A3B0A5]">
                  Display the Borrowed items tracker and reminders on the home screen
                </span>
              </div>
            </div>
            <button
              onClick={toggleHideBorrowedSection}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                !settings.hideBorrowedSection ? "bg-[#6B7E6D]" : "bg-[#E8E4E1]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  !settings.hideBorrowedSection ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* RESET DEMO DATA */}
          <div className="pt-2 border-t border-[#E8E4E1] dark:border-[#38332E] space-y-2">
            <button
              onClick={() => {
                if (confirm("Restore sample items (Car Keys, Passport, AA Batteries, Screwdriver)?")) {
                  onResetDemoData();
                  onClose();
                }
              }}
              className="w-full py-3 px-4 bg-[#5A7D9A]/10 hover:bg-[#5A7D9A]/20 text-[#5A7D9A] dark:text-[#7A9DBA] font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-[#5A7D9A]/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restore Sample Demo Data</span>
            </button>

            {/* DELETE ALL DATA BUTTON */}
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 px-4 bg-[#C2847A]/10 hover:bg-[#C2847A]/20 text-[#C2847A] font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-[#C2847A]/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete All My Data</span>
              </button>
            ) : (
              <div className="p-3 bg-[#C2847A]/10 border border-[#C2847A]/30 rounded-2xl space-y-2 text-xs">
                <p className="font-bold text-[#C2847A] flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Are you sure you want to delete all saved items?
                </p>
                <p className="text-[#4A443F] dark:text-[#A3B0A5]">
                  This action cannot be undone. All photos and locations will be permanently removed.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 bg-[#E8E4E1] dark:bg-[#38332E] text-[#2D2A26] dark:text-[#E8E4E1] rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onClearAllData();
                      setShowDeleteConfirm(false);
                      onClose();
                    }}
                    className="flex-1 py-2 bg-[#C2847A] text-white rounded-xl font-bold"
                  >
                    Yes, Delete Everything
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
