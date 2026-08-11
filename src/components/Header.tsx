import React from "react";
import { Sun, Moon, Settings } from "lucide-react";
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

export const Header: React.FC<HeaderProps> = ({ settings, onUpdateSettings, onOpenSettings, onGoHome }) => {
  const toggleDarkMode = () => {
    onUpdateSettings({ ...settings, darkMode: !settings.darkMode });
  };

  return (
    <header className="sticky top-0 z-30 bg-[#F5F4EF]/90 dark:bg-[#161412]/90 backdrop-blur-md transition-colors">
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-2 flex items-center justify-between gap-2">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
        >
          <div className="w-8 h-8 bg-[#7CA65B] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5l7 7-7 7M5 12h14" />
            </svg>
          </div>
          <h1 className="text-lg font-extrabold text-[#30302E] dark:text-[#F2F0EA] tracking-tight group-hover:text-[#7CA65B] dark:group-hover:text-[#A8C98B] transition-colors lowercase">
            rembr
          </h1>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleDarkMode}
            className="p-2.5 text-[#83827C] dark:text-[#A8A7A2] hover:bg-[#EFEEE7] dark:hover:bg-[#1E1C19] rounded-xl transition-colors cursor-pointer"
            title={settings.darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {settings.darkMode ? <Sun className="w-4 h-4 text-[#A8C98B]" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2.5 text-[#83827C] dark:text-[#A8A7A2] hover:bg-[#EFEEE7] dark:hover:bg-[#1E1C19] rounded-xl transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
