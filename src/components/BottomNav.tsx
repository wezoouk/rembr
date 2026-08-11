import React, { useState } from "react";
import { Home, Search, Plus, HandHeart, MoreHorizontal, Camera, Grid, X } from "lucide-react";

interface BottomNavProps {
  onGoHome: () => void;
  onOpenFind: () => void;
  onOpenRemember: () => void;
  onOpenScanSpace: () => void;
  onOpenBorrowed: () => void;
  onOpenMore: () => void;
  hideBorrowedSection?: boolean;
  activeOverdueCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  onGoHome,
  onOpenFind,
  onOpenRemember,
  onOpenScanSpace,
  onOpenBorrowed,
  onOpenMore,
  hideBorrowedSection = false,
  activeOverdueCount = 0,
}) => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const NavButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    active?: boolean;
    badge?: number;
    dataTour?: string;
  }> = ({ icon, label, onClick, active, badge, dataTour }) => (
    <button
      onClick={onClick}
      data-tour={dataTour}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative transition-colors ${
        active ? "text-[#7CA65B]" : "text-[#83827C] dark:text-[#7A7972] hover:text-[#44433F] dark:hover:text-[#E5E3DA]"
      }`}
    >
      {badge ? (
        <span className="absolute top-0.5 right-1/2 translate-x-3 w-4 h-4 rounded-full bg-[#B0473A] text-white text-[9px] font-bold flex items-center justify-center">
          {badge}
        </span>
      ) : null}
      {icon}
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );

  return (
    <>
      {/* QUICK ADD SHEET */}
      {showQuickAdd && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end justify-center"
          onClick={() => setShowQuickAdd(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#EFEEE7] dark:bg-[#211F1B] rounded-t-[32px] p-5 pb-8 shadow-2xl animate-fade-in"
          >
            <div className="w-10 h-1 bg-[#83827C]/30 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#30302E] dark:text-[#F2F0EA]">Quick add</h3>
              <button
                onClick={() => setShowQuickAdd(false)}
                className="p-1.5 text-[#83827C] hover:text-[#30302E] dark:hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setShowQuickAdd(false);
                  onOpenRemember();
                }}
                className="w-full flex items-center gap-3 p-3.5 bg-white dark:bg-[#1E1C19] rounded-2xl hover:shadow-sm transition-all active:scale-[0.99]"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#7CA65B]/15 text-[#5F8A48] dark:text-[#A8C98B] flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-[#30302E] dark:text-[#F2F0EA]">Remember something</p>
                  <p className="text-[11px] text-[#83827C] dark:text-[#A8A7A2]">Photo, voice, or type it in</p>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowQuickAdd(false);
                  onOpenScanSpace();
                }}
                className="w-full flex items-center gap-3 p-3.5 bg-white dark:bg-[#1E1C19] rounded-2xl hover:shadow-sm transition-all active:scale-[0.99]"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#7CA65B]/15 text-[#5F8A48] dark:text-[#A8C98B] flex items-center justify-center shrink-0">
                  <Grid className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-[#30302E] dark:text-[#F2F0EA]">Scan a space</p>
                  <p className="text-[11px] text-[#83827C] dark:text-[#A8A7A2]">Catalog a whole drawer or shelf</p>
                </div>
              </button>
              {!hideBorrowedSection && (
                <button
                  onClick={() => {
                    setShowQuickAdd(false);
                    onOpenBorrowed();
                  }}
                  className="w-full flex items-center gap-3 p-3.5 bg-white dark:bg-[#1E1C19] rounded-2xl hover:shadow-sm transition-all active:scale-[0.99]"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#5B84C4]/15 text-[#4A70AC] dark:text-[#8FADDE] flex items-center justify-center shrink-0">
                    <HandHeart className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-[#30302E] dark:text-[#F2F0EA]">Lend an item</p>
                    <p className="text-[11px] text-[#83827C] dark:text-[#A8A7A2]">Log what you've lent, to who</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM TAB BAR */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#F5F4EF]/95 dark:bg-[#161412]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-2xl mx-auto px-2 flex items-center">
          <NavButton icon={<Home className="w-5 h-5" />} label="Home" onClick={onGoHome} active dataTour="nav-home" />
          <NavButton icon={<Search className="w-5 h-5" />} label="Items" onClick={onOpenFind} />

          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => setShowQuickAdd(true)}
              data-tour="nav-add"
              className="w-12 h-12 -mt-4 rounded-full bg-[#7CA65B] hover:bg-[#6B9149] text-white shadow-lg flex items-center justify-center active:scale-95 transition-all"
              title="Quick add"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {!hideBorrowedSection ? (
            <NavButton
              icon={<HandHeart className="w-5 h-5" />}
              label="Loaned"
              onClick={onOpenBorrowed}
              badge={activeOverdueCount}
              dataTour="nav-loaned"
            />
          ) : (
            <div className="flex-1" />
          )}
          <NavButton icon={<MoreHorizontal className="w-5 h-5" />} label="More" onClick={onOpenMore} dataTour="nav-more" />
        </div>
      </nav>
    </>
  );
};
