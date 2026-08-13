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
  HelpCircle,
  ScanLine,
  Image as ImageIcon,
} from "lucide-react";
import { AppSettings } from "../types";

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onResetDemoData: () => void;
  onClearAllData: () => void;
  onClose: () => void;
  onOpenHelp?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetDemoData,
  onClearAllData,
  onClose,
  onOpenHelp,
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

  const toggleAutoSecondScanPass = () => {
    onUpdateSettings({
      ...settings,
      autoSecondScanPass: !settings.autoSecondScanPass,
    });
  };

  const toggleUseRecentPhotoOnRememberCard = () => {
    onUpdateSettings({
      ...settings,
      useRecentPhotoOnRememberCard: !settings.useRecentPhotoOnRememberCard,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#161412]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#211F1B] rounded-[32px] max-w-md w-full p-5 sm:p-6 shadow-2xl relative my-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E5E3DA] dark:border-[#3E3D3A]">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#30302E] dark:text-[#E5E3DA]">
              Settings & Privacy
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#83827C] hover:text-[#30302E] dark:hover:text-white rounded-xl hover:bg-[#EFEEE7] dark:hover:bg-[#1E1C19] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-sm">
          {/* PRIVACY BADGE */}
          <div className="p-3.5 bg-[#7CA65B]/10 border border-[#7CA65B]/20 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#7CA65B] dark:text-[#A8C98B] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#7CA65B] dark:text-[#A8C98B] text-xs uppercase tracking-wider">
                100% On-Device Storage
              </p>
              <p className="text-xs text-[#44433F] dark:text-[#A8A7A2] mt-0.5">
                All photos and item location records are saved directly in your phone's browser storage. No cloud accounts required.
              </p>
            </div>
          </div>

          {/* APPEARANCE TOGGLE */}
          <div className="flex items-center justify-between p-3 bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-2xl ">
            <div className="flex items-center gap-2.5">
              {settings.darkMode ? (
                <Moon className="w-5 h-5 text-[#A8C98B]" />
              ) : (
                <Sun className="w-5 h-5 text-[#83827C]" />
              )}
              <span className="font-semibold text-[#30302E] dark:text-[#E5E3DA]">
                Dark Theme
              </span>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                settings.darkMode ? "bg-[#7CA65B]" : "bg-[#E5E3DA]"
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
          <div className="flex items-center justify-between p-3 bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-2xl ">
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-5 h-5 text-[#83827C] dark:text-[#A8A7A2]" />
              <div>
                <span className="font-semibold text-[#30302E] dark:text-[#E5E3DA] block">
                  High Quality Photos
                </span>
                <span className="text-[11px] text-[#83827C] dark:text-[#A8A7A2]">
                  Save clear preview photos on-device
                </span>
              </div>
            </div>
            <button
              onClick={toggleRetainPhotos}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                settings.retainOriginalPhotos ? "bg-[#7CA65B]" : "bg-[#E5E3DA]"
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
          <div className="flex items-center justify-between p-3 bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-2xl ">
            <div className="flex items-center gap-2.5">
              <EyeOff className="w-5 h-5 text-[#83827C] dark:text-[#A8A7A2]" />
              <div>
                <span className="font-semibold text-[#30302E] dark:text-[#E5E3DA] block">
                  Blur Photos on Recently Saved
                </span>
                <span className="text-[11px] text-[#83827C] dark:text-[#A8A7A2]">
                  Blur photo previews on home screen for privacy
                </span>
              </div>
            </div>
            <button
              onClick={toggleBlurRecentlySaved}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                settings.blurRecentlySaved ? "bg-[#7CA65B]" : "bg-[#E5E3DA]"
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
          <div className="flex items-center justify-between p-3 bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-2xl ">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-[#83827C] dark:text-[#A8A7A2]" />
              <div>
                <span className="font-semibold text-[#30302E] dark:text-[#E5E3DA] block">
                  Blur Location on Recently Saved
                </span>
                <span className="text-[11px] text-[#83827C] dark:text-[#A8A7A2]">
                  Blur location text on home screen until hovered/tapped
                </span>
              </div>
            </div>
            <button
              onClick={toggleBlurLocationRecentlySaved}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                settings.blurLocationRecentlySaved ? "bg-[#7CA65B]" : "bg-[#E5E3DA]"
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
          <div className="flex items-center justify-between p-3 bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-2xl ">
            <div className="flex items-center gap-2.5">
              <Copy className="w-5 h-5 text-[#83827C] dark:text-[#A8A7A2]" />
              <div>
                <span className="font-semibold text-[#30302E] dark:text-[#E5E3DA] block">
                  Allow Duplicate Items
                </span>
                <span className="text-[11px] text-[#83827C] dark:text-[#A8A7A2]">
                  If off, prompts for a descriptive name (e.g. "Brown Wallet") when saving duplicates
                </span>
              </div>
            </div>
            <button
              onClick={toggleAllowDuplicateItems}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                settings.allowDuplicateItems ? "bg-[#7CA65B]" : "bg-[#E5E3DA]"
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
          <div className="flex items-center justify-between p-3 bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-2xl ">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-[#83827C] dark:text-[#A8A7A2]" />
              <div>
                <span className="font-semibold text-[#30302E] dark:text-[#E5E3DA] block">
                  Show Locations Section
                </span>
                <span className="text-[11px] text-[#83827C] dark:text-[#A8A7A2]">
                  Display the Browse Locations gallery and button on the home screen
                </span>
              </div>
            </div>
            <button
              onClick={toggleHideLocationsSection}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                !settings.hideLocationsSection ? "bg-[#7CA65B]" : "bg-[#E5E3DA]"
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
          <div className="flex items-center justify-between p-3 bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-2xl ">
            <div className="flex items-center gap-2.5">
              <HandHeart className="w-5 h-5 text-[#83827C] dark:text-[#A8A7A2]" />
              <div>
                <span className="font-semibold text-[#30302E] dark:text-[#E5E3DA] block">
                  Show Borrowed Section
                </span>
                <span className="text-[11px] text-[#83827C] dark:text-[#A8A7A2]">
                  Display the Borrowed items tracker and reminders on the home screen
                </span>
              </div>
            </div>
            <button
              onClick={toggleHideBorrowedSection}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                !settings.hideBorrowedSection ? "bg-[#7CA65B]" : "bg-[#E5E3DA]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  !settings.hideBorrowedSection ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* AUTO SECOND SCAN PASS TOGGLE */}
          <div className="flex items-center justify-between p-3 bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-2xl ">
            <div className="flex items-center gap-2.5">
              <ScanLine className="w-5 h-5 text-[#83827C] dark:text-[#A8A7A2]" />
              <div>
                <span className="font-semibold text-[#30302E] dark:text-[#E5E3DA] block">
                  Auto Second Scan Pass
                </span>
                <span className="text-[11px] text-[#83827C] dark:text-[#A8A7A2]">
                  Automatically re-scan a space photo once more to catch items the first pass missed
                </span>
              </div>
            </div>
            <button
              onClick={toggleAutoSecondScanPass}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 shrink-0 ${
                settings.autoSecondScanPass ? "bg-[#7CA65B]" : "bg-[#E5E3DA]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.autoSecondScanPass ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* USE RECENT PHOTO ON REMEMBER CARD TOGGLE */}
          <div className="flex items-center justify-between p-3 bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-2xl ">
            <div className="flex items-center gap-2.5">
              <ImageIcon className="w-5 h-5 text-[#83827C] dark:text-[#A8A7A2]" />
              <div>
                <span className="font-semibold text-[#30302E] dark:text-[#E5E3DA] block">
                  Use Recent Photo on Remember Card
                </span>
                <span className="text-[11px] text-[#83827C] dark:text-[#A8A7A2]">
                  If off, keeps the original background photo instead of swapping in your most recently saved item's photo
                </span>
              </div>
            </div>
            <button
              onClick={toggleUseRecentPhotoOnRememberCard}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 shrink-0 ${
                settings.useRecentPhotoOnRememberCard ? "bg-[#7CA65B]" : "bg-[#E5E3DA]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.useRecentPhotoOnRememberCard ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* HELP & TIPS */}
          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              className="w-full flex items-center justify-between p-3 bg-[#EFEEE7] dark:bg-[#1E1C19] hover:bg-[#E5E3DA] dark:hover:bg-[#3E3D3A] rounded-2xl transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-[#83827C] dark:text-[#A8A7A2]" />
                <span className="font-semibold text-[#30302E] dark:text-[#E5E3DA]">
                  Help & Tips
                </span>
              </div>
              <span className="text-xs text-[#83827C] dark:text-[#A8A7A2]">View</span>
            </button>
          )}

          {/* RESET DEMO DATA */}
          <div className="pt-2 border-t border-[#E5E3DA] dark:border-[#3E3D3A] space-y-2">
            <button
              onClick={() => {
                if (confirm("Restore sample items (Car Keys, Passport, AA Batteries, Screwdriver)?")) {
                  onResetDemoData();
                  onClose();
                }
              }}
              className="w-full py-3 px-4 bg-[#7CA65B]/10 hover:bg-[#7CA65B]/20 text-[#7CA65B] dark:text-[#A8C98B] font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-[#7CA65B]/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restore Sample Demo Data</span>
            </button>

            {/* DELETE ALL DATA BUTTON */}
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 px-4 bg-[#7CA65B]/10 hover:bg-[#7CA65B]/20 text-[#7CA65B] font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-[#7CA65B]/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete All My Data</span>
              </button>
            ) : (
              <div className="p-3 bg-[#7CA65B]/10 border border-[#7CA65B]/30 rounded-2xl space-y-2 text-xs">
                <p className="font-bold text-[#7CA65B] flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Are you sure you want to delete all saved items?
                </p>
                <p className="text-[#44433F] dark:text-[#A8A7A2]">
                  This action cannot be undone. All photos and locations will be permanently removed.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 bg-[#E5E3DA] dark:bg-[#3E3D3A] text-[#30302E] dark:text-[#E5E3DA] rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onClearAllData();
                      setShowDeleteConfirm(false);
                      onClose();
                    }}
                    className="flex-1 py-2 bg-[#7CA65B] text-white rounded-xl font-bold"
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
