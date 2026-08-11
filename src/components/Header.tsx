import React from "react";
import { Search, ShieldCheck, Sun, Moon, Settings, Home, MapPin, HelpCircle } from "lucide-react";
import { AppSettings } from "../types";

interface HeaderProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onOpenSettings: () => void;
  onOpenFind: () => void;
  onOpenLocations?: () => void;
  onOpenHelp: () => void;
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  onOpenSettings,
  onOpenFind,
  onOpenLocations,
  onOpenHelp,
  onGoHome,
}) => {
  const toggleDarkMode = () => {
    onUpdateSettings({ ...settings, darkMode: !settings.darkMode });
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#2B2A28]/80 backdrop-blur-md border-b border-[#E5E3DA] dark:border-[#3E3D3A] transition-colors">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Logo and Brand (Clickable to go Home) */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
        >
          <div className="w-10 h-10 bg-[#D97757] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 5l7 7-7 7M5 12h14"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#30302E] dark:text-[#E5E3DA] leading-tight tracking-tight group-hover:text-[#D97757] dark:group-hover:text-[#E8A785] transition-colors lowercase">
              rembr
            </h1>
            <div className="flex items-center gap-1 text-xs text-[#D97757] dark:text-[#A8A7A2] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% On-Device Privacy</span>
            </div>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onGoHome}
            className="p-2.5 text-[#D97757] dark:text-[#A8A7A2] hover:bg-[#EFEEE7] dark:hover:bg-[#33322F] rounded-xl transition-colors font-medium flex items-center gap-1.5 text-xs cursor-pointer"
            title="Go to Homepage"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <button
            onClick={onOpenFind}
            className="p-2.5 text-[#D97757] dark:text-[#A8A7A2] hover:bg-[#EFEEE7] dark:hover:bg-[#33322F] rounded-xl transition-colors font-medium flex items-center gap-1.5 text-xs cursor-pointer"
            title="Search Items"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>

          {onOpenLocations && !settings.hideLocationsSection && (
            <button
              onClick={onOpenLocations}
              className="p-2.5 text-[#D97757] dark:text-[#A8A7A2] hover:bg-[#EFEEE7] dark:hover:bg-[#33322F] rounded-xl transition-colors font-medium flex items-center gap-1.5 text-xs cursor-pointer"
              title="Locations Catalog"
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Locations</span>
            </button>
          )}

          <button
            onClick={onOpenHelp}
            className="p-2.5 text-[#D97757] dark:text-[#A8A7A2] hover:bg-[#EFEEE7] dark:hover:bg-[#33322F] rounded-xl transition-colors font-medium flex items-center gap-1.5 text-xs cursor-pointer"
            title="Help & Tips"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Help</span>
          </button>

          <button
            onClick={toggleDarkMode}
            className="p-2.5 text-[#83827C] dark:text-[#A8A7A2] hover:bg-[#EFEEE7] dark:hover:bg-[#33322F] rounded-xl transition-colors cursor-pointer"
            title={settings.darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {settings.darkMode ? (
              <Sun className="w-4 h-4 text-[#E8A785]" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2.5 text-[#D97757] dark:text-[#A8A7A2] hover:bg-[#EFEEE7] dark:hover:bg-[#33322F] rounded-xl transition-colors font-medium flex items-center gap-1.5 text-xs cursor-pointer"
            title="Settings & Privacy"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
