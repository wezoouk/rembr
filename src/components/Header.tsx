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
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#23201C]/80 backdrop-blur-md border-b border-[#E8E4E1] dark:border-[#38332E] transition-colors">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Logo and Brand (Clickable to go Home) */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
        >
          <div className="w-10 h-10 bg-[#6B7E6D] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
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
            <h1 className="text-xl font-extrabold text-[#2D2A26] dark:text-[#E8E4E1] leading-tight tracking-tight group-hover:text-[#6B7E6D] dark:group-hover:text-[#91A493] transition-colors lowercase">
              rembr
            </h1>
            <div className="flex items-center gap-1 text-xs text-[#6B7E6D] dark:text-[#A3B0A5] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% On-Device Privacy</span>
            </div>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onGoHome}
            className="p-2.5 text-[#6B7E6D] dark:text-[#A3B0A5] hover:bg-[#F2EDE9] dark:hover:bg-[#2E2A25] rounded-xl transition-colors font-medium flex items-center gap-1.5 text-xs cursor-pointer"
            title="Go to Homepage"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <button
            onClick={onOpenFind}
            className="p-2.5 text-[#6B7E6D] dark:text-[#A3B0A5] hover:bg-[#F2EDE9] dark:hover:bg-[#2E2A25] rounded-xl transition-colors font-medium flex items-center gap-1.5 text-xs cursor-pointer"
            title="Search Items"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>

          {onOpenLocations && !settings.hideLocationsSection && (
            <button
              onClick={onOpenLocations}
              className="p-2.5 text-[#6B7E6D] dark:text-[#A3B0A5] hover:bg-[#F2EDE9] dark:hover:bg-[#2E2A25] rounded-xl transition-colors font-medium flex items-center gap-1.5 text-xs cursor-pointer"
              title="Locations Catalog"
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Locations</span>
            </button>
          )}

          <button
            onClick={onOpenHelp}
            className="p-2.5 text-[#6B7E6D] dark:text-[#A3B0A5] hover:bg-[#F2EDE9] dark:hover:bg-[#2E2A25] rounded-xl transition-colors font-medium flex items-center gap-1.5 text-xs cursor-pointer"
            title="Help & Tips"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Help</span>
          </button>

          <button
            onClick={toggleDarkMode}
            className="p-2.5 text-[#8C847E] dark:text-[#A3B0A5] hover:bg-[#F2EDE9] dark:hover:bg-[#2E2A25] rounded-xl transition-colors cursor-pointer"
            title={settings.darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {settings.darkMode ? (
              <Sun className="w-4 h-4 text-[#DA9E94]" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2.5 text-[#6B7E6D] dark:text-[#A3B0A5] hover:bg-[#F2EDE9] dark:hover:bg-[#2E2A25] rounded-xl transition-colors font-medium flex items-center gap-1.5 text-xs cursor-pointer"
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
