import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Search,
  Grid,
  Pin,
  Clock,
  Mic,
  MicOff,
  ChevronRight,
  FolderOpen,
  Sparkles,
  MapPin,
  Tag,
  Trash2,
  X,
  AlertCircle,
  EyeOff,
  HandHeart,
  Bell,
  User,
  CheckCircle2,
} from "lucide-react";
import { Item, Space, BorrowedItem } from "../types";
import { formatRelativeTime, formatShortDateTime } from "../lib/imageUtils";
import { VoiceListener, isSpeechRecognitionSupported } from "../lib/speech";
import { DictationIndicator } from "./DictationIndicator";

interface HomeScreenProps {
  items: Item[];
  spaces: Space[];
  borrowedItems?: BorrowedItem[];
  blurRecentlySaved?: boolean;
  blurLocationRecentlySaved?: boolean;
  hideLocationsSection?: boolean;
  hideBorrowedSection?: boolean;
  onOpenRemember: () => void;
  onOpenFind: (initialQuery?: string) => void;
  onOpenScanSpace: () => void;
  onOpenLocations: (locationName?: string) => void;
  onOpenBorrowed: () => void;
  onSelectItem: (item: Item) => void;
  onSelectSpace: (space: Space) => void;
  onUpdateItem?: (item: Item) => void;
  onDeleteItem?: (id: string) => void;
  onMarkBorrowedReturned?: (item: BorrowedItem) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  items,
  spaces,
  borrowedItems = [],
  blurRecentlySaved = false,
  blurLocationRecentlySaved = false,
  hideLocationsSection = false,
  hideBorrowedSection = false,
  onOpenRemember,
  onOpenFind,
  onOpenScanSpace,
  onOpenLocations,
  onOpenBorrowed,
  onSelectItem,
  onSelectSpace,
  onUpdateItem,
  onDeleteItem,
  onMarkBorrowedReturned,
}) => {
  const [quickQuery, setQuickQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Group unique locations
  const locationMap = new Map<string, { name: string; items: Item[] }>();
  items.forEach((item) => {
    const loc = (item.location_name || "General Storage").trim();
    if (!locationMap.has(loc)) {
      locationMap.set(loc, { name: loc, items: [] });
    }
    locationMap.get(loc)!.items.push(item);
  });
  const locationGroups = Array.from(locationMap.values()).sort(
    (a, b) => b.items.length - a.items.length
  );

  // Borrowed items still out on loan, soonest reminder first
  const activeBorrowed = borrowedItems
    .filter((b) => !b.is_returned)
    .sort((a, b) => {
      const aTime = a.next_reminder_at ? new Date(a.next_reminder_at).getTime() : Infinity;
      const bTime = b.next_reminder_at ? new Date(b.next_reminder_at).getTime() : Infinity;
      return aTime - bTime;
    });
  const overdueBorrowed = activeBorrowed.filter(
    (b) => b.reminder_interval !== "none" && b.next_reminder_at && new Date(b.next_reminder_at).getTime() <= Date.now()
  );

  const visibleActionCount = 3 + (!hideLocationsSection ? 1 : 0) + (!hideBorrowedSection ? 1 : 0);
  const actionGridClass =
    visibleActionCount >= 5
      ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
      : visibleActionCount === 4
      ? "grid-cols-2 md:grid-cols-4"
      : "grid-cols-1 sm:grid-cols-3 md:grid-cols-3";

  const voiceListenerRef = useRef<VoiceListener | null>(null);

  useEffect(() => {
    if (isSpeechRecognitionSupported()) {
      voiceListenerRef.current = new VoiceListener(
        (transcript, isFinal) => {
          setQuickQuery(transcript);
          if (isFinal) {
            setIsListening(false);
          }
        },
        () => setIsListening(false),
        () => setIsListening(false),
        (level) => setAudioLevel(level)
      );
    }
    return () => {
      if (voiceListenerRef.current) {
        voiceListenerRef.current.stop();
      }
    };
  }, []);

  const toggleVoiceInput = async () => {
    if (!voiceListenerRef.current) {
      alert("Voice recognition is not supported on this browser.");
      return;
    }

    if (isListening) {
      voiceListenerRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      await voiceListenerRef.current.start();
    }
  };

  const pinnedItems = items.filter((item) => item.is_pinned);
  const recentItems = items.slice(0, 8);

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isListening && voiceListenerRef.current) {
      voiceListenerRef.current.stop();
      setIsListening(false);
    }
    if (quickQuery.trim()) {
      onOpenFind(quickQuery.trim());
    } else {
      onOpenFind();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Search Bar / Voice Quick Launcher */}
      <div className="space-y-2">
        <form
          onSubmit={handleQuickSearchSubmit}
          className="relative flex items-center shadow-sm rounded-2xl bg-white dark:bg-[#2B2A28] border border-[#E5E3DA] dark:border-[#3E3D3A] overflow-hidden p-1"
        >
          <Search className="w-5 h-5 text-[#83827C] ml-3 shrink-0" />
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder='Ask "Where are my keys?" or "Passport"...'
            className="w-full py-3 pl-3 pr-28 text-base text-[#30302E] dark:text-[#E5E3DA] bg-transparent placeholder-[#83827C] focus:outline-none"
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            {/* Dictate Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`px-3 py-2.5 rounded-xl shadow transition-all flex items-center gap-1.5 text-xs font-bold select-none active:scale-95 cursor-pointer ${
                isListening
                  ? "bg-[#D97757] text-white animate-pulse"
                  : "bg-[#EFEEE7] dark:bg-[#33322F] text-[#44433F] dark:text-[#E5E3DA] hover:bg-[#E5E3DA] dark:hover:bg-[#3E3D3A]"
              }`}
              title={isListening ? "Tap to stop dictating" : "Tap to start dictating"}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span className="hidden sm:inline">Listening</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span className="hidden sm:inline">Dictate</span>
                </>
              )}
            </button>

            {/* Search Button */}
            <button
              type="submit"
              className="p-2.5 bg-[#D97757] hover:bg-[#C15F3C] text-white rounded-xl shadow transition-all"
              title="Search Saved Stuff"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* PROMINENT DICTATION STATUS BADGE & AUDIO WAVEFORM */}
        <DictationIndicator
          isListening={isListening}
          transcript={quickQuery}
          audioLevel={audioLevel}
          onStop={toggleVoiceInput}
          label="Listening for your search text..."
        />
      </div>

      {/* OVERDUE BORROWED REMINDER BANNER */}
      {!hideBorrowedSection && overdueBorrowed.length > 0 && (
        <button
          onClick={onOpenBorrowed}
          className="w-full text-left p-3.5 bg-[#D97757]/15 border-2 border-[#D97757] rounded-2xl flex items-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
        >
          <div className="relative shrink-0">
            <span className="absolute w-8 h-8 rounded-full bg-[#D97757] opacity-40 animate-ping"></span>
            <div className="relative w-8 h-8 rounded-full bg-[#D97757] text-white flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-[#C15F3C] dark:text-[#E8A785] uppercase tracking-wider">
              {overdueBorrowed.length} borrowed item{overdueBorrowed.length === 1 ? "" : "s"} overdue
            </p>
            <p className="text-xs font-semibold text-[#44433F] dark:text-[#E5E3DA] truncate mt-0.5">
              {overdueBorrowed.slice(0, 2).map((b) => `${b.borrowed_to} has your ${b.item_name}`).join(" · ")}
              {overdueBorrowed.length > 2 ? "…" : ""}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#D97757] shrink-0" />
        </button>
      )}

      {/* CORE ACTION BUTTONS */}
      <div className={`grid ${actionGridClass} gap-3`}>
        {/* 1. REMEMBER */}
        <button
          onClick={onOpenRemember}
          className="group text-center p-4 sm:p-5 bg-white dark:bg-[#2B2A28] border border-[#E5E3DA] dark:border-[#3E3D3A] hover:border-[#D97757]/60 rounded-3xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col items-center justify-between"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#D97757]/10 text-[#D97757] dark:text-[#E8A785] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Camera className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#30302E] dark:text-[#E5E3DA] mb-0.5">
              Remember
            </h2>
            <p className="text-[11px] text-[#83827C] dark:text-[#A8A7A2] leading-tight">
              Save item spot
            </p>
          </div>
        </button>

        {/* 2. FIND */}
        <button
          onClick={() => onOpenFind()}
          className="group text-center p-4 sm:p-5 bg-white dark:bg-[#2B2A28] border border-[#E5E3DA] dark:border-[#3E3D3A] hover:border-[#D97757]/60 rounded-3xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col items-center justify-between"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#D97757]/10 text-[#D97757] dark:text-[#E8A785] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Search className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#30302E] dark:text-[#E5E3DA] mb-0.5">
              Find
            </h2>
            <p className="text-[11px] text-[#83827C] dark:text-[#A8A7A2] leading-tight">
              Search lost item
            </p>
          </div>
        </button>

        {/* 3. LOCATIONS (If not hidden) */}
        {!hideLocationsSection && (
          <button
            onClick={() => onOpenLocations()}
            className="group text-center p-4 sm:p-5 bg-white dark:bg-[#2B2A28] border border-[#E5E3DA] dark:border-[#3E3D3A] hover:border-[#D97757]/60 rounded-3xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col items-center justify-between"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#D97757]/15 text-[#D97757] dark:text-[#E8A785] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <MapPin className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#30302E] dark:text-[#E5E3DA] mb-0.5">
                Locations
              </h2>
              <p className="text-[11px] text-[#83827C] dark:text-[#A8A7A2] leading-tight">
                Browse by spot ({locationGroups.length})
              </p>
            </div>
          </button>
        )}

        {/* BORROWED (If not hidden) */}
        {!hideBorrowedSection && (
          <button
            onClick={onOpenBorrowed}
            className="group text-center p-4 sm:p-5 bg-white dark:bg-[#2B2A28] border border-[#E5E3DA] dark:border-[#3E3D3A] hover:border-[#D97757]/60 rounded-3xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col items-center justify-between relative"
          >
            {overdueBorrowed.length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#D97757] text-white text-[10px] font-bold flex items-center justify-center shadow">
                {overdueBorrowed.length}
              </span>
            )}
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#D97757]/10 text-[#D97757] dark:text-[#E8A785] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <HandHeart className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#30302E] dark:text-[#E5E3DA] mb-0.5">
                Borrowed
              </h2>
              <p className="text-[11px] text-[#83827C] dark:text-[#A8A7A2] leading-tight">
                {activeBorrowed.length > 0 ? `${activeBorrowed.length} out on loan` : "Track lent items"}
              </p>
            </div>
          </button>
        )}

        {/* 4. SCAN A SPACE */}
        <button
          onClick={onOpenScanSpace}
          className="group text-center p-4 sm:p-5 bg-white dark:bg-[#2B2A28] border border-[#E5E3DA] dark:border-[#3E3D3A] hover:border-[#D97757]/60 rounded-3xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col items-center justify-between"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#D97757]/10 text-[#D97757] dark:text-[#E8A785] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Grid className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#30302E] dark:text-[#E5E3DA] mb-0.5">
              Scan Space
            </h2>
            <p className="text-[11px] text-[#83827C] dark:text-[#A8A7A2] leading-tight">
              Catalog drawer/shelf
            </p>
          </div>
        </button>
      </div>

      {/* PINNED / FAVOURITES */}
      {pinnedItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest font-bold text-[#83827C] dark:text-[#A8A7A2] flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5 text-[#D97757] fill-[#D97757]" />
              Pinned Items
            </h2>
            <span className="text-xs text-[#83827C] dark:text-[#A8A7A2]">
              {pinnedItems.length} items
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pinnedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="group text-left bg-white/70 dark:bg-[#2B2A28]/70 border border-[#E5E3DA] dark:border-[#3E3D3A] rounded-3xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden relative"
              >
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#EFEEE7] dark:bg-[#1F1E1C] relative mb-2.5">
                  <img
                    src={item.image_path}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onUpdateItem) {
                          onUpdateItem({ ...item, is_pinned: false });
                        }
                      }}
                      className="p-1.5 bg-[#D97757] text-white rounded-xl shadow-md hover:scale-105 transition-transform"
                      title="Unpin Item"
                    >
                      <Pin className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingItemId(item.id);
                      }}
                      className="p-1.5 bg-black/60 hover:bg-[#D97757] text-white rounded-xl shadow-md transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-[#30302E] dark:text-[#E5E3DA] truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs text-[#83827C] dark:text-[#A8A7A2] truncate flex items-center gap-1 mt-0.5 font-medium">
                    <MapPin className="w-3 h-3 text-[#D97757] shrink-0" />
                    <span className="truncate">{item.location_name}</span>
                  </p>
                  <p className="text-[10px] text-[#83827C] dark:text-[#A8A7A2] truncate flex items-center gap-1 mt-1 font-medium">
                    <Clock className="w-2.5 h-2.5 text-[#D97757] shrink-0" />
                    <span className="truncate">Recorded: {formatShortDateTime(item.created_at || item.updated_at)}</span>
                  </p>
                </div>

                {deletingItemId === item.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 bg-white/95 dark:bg-[#2B2A28]/95 backdrop-blur-sm p-3 rounded-3xl flex flex-col items-center justify-center text-center gap-2 z-10 animate-fade-in"
                  >
                    <AlertCircle className="w-5 h-5 text-[#D97757]" />
                    <span className="text-xs font-bold text-[#30302E] dark:text-[#E5E3DA]">Are you sure?</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteItem) {
                            onDeleteItem(item.id);
                          }
                          setDeletingItemId(null);
                        }}
                        className="px-2.5 py-1 bg-[#D97757] hover:bg-[#C15F3C] text-white text-xs font-bold rounded-xl shadow"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingItemId(null);
                        }}
                        className="px-2 py-1 bg-[#EFEEE7] dark:bg-[#33322F] text-[#44433F] dark:text-[#E5E3DA] text-xs font-semibold rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BORROWED ITEMS OUT ON LOAN */}
      {!hideBorrowedSection && activeBorrowed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest font-bold text-[#83827C] dark:text-[#A8A7A2] flex items-center gap-1.5">
              <HandHeart className="w-3.5 h-3.5 text-[#D97757]" />
              Borrowed & Out on Loan
            </h2>
            <button
              onClick={onOpenBorrowed}
              className="text-xs font-bold text-[#D97757] dark:text-[#E8A785] hover:underline flex items-center gap-0.5"
            >
              View All ({activeBorrowed.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activeBorrowed.slice(0, 4).map((b) => {
              const overdue =
                b.reminder_interval !== "none" &&
                b.next_reminder_at &&
                new Date(b.next_reminder_at).getTime() <= Date.now();
              return (
                <div
                  key={b.id}
                  onClick={onOpenBorrowed}
                  className={`group cursor-pointer bg-white dark:bg-[#2B2A28] border rounded-2xl p-3 shadow-sm hover:shadow-md transition-all flex items-center gap-2.5 ${
                    overdue ? "border-[#D97757]" : "border-[#E5E3DA] dark:border-[#3E3D3A]"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#D97757]/10 text-[#D97757] dark:text-[#E8A785] flex items-center justify-center shrink-0">
                    <HandHeart className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-[#30302E] dark:text-[#E5E3DA] truncate">
                      {b.item_name}
                    </h3>
                    <p className="text-[11px] text-[#D97757] dark:text-[#E8A785] font-medium truncate flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3 shrink-0" />
                      {b.borrowed_to}
                    </p>
                  </div>
                  {onMarkBorrowedReturned && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkBorrowedReturned(b);
                      }}
                      className="p-1.5 rounded-lg text-[#83827C] hover:text-[#D97757] hover:bg-[#D97757]/10 transition-colors shrink-0"
                      title="Mark as returned"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* RECENTLY SAVED ITEMS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs uppercase tracking-widest font-bold text-[#83827C] dark:text-[#A8A7A2] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D97757]" />
              Recently Saved
            </h2>
            <span className="text-[10px] bg-[#D97757]/15 text-[#D97757] dark:text-[#E8A785] px-2 py-0.5 rounded-full font-bold">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>
          <button
            onClick={() => onOpenFind()}
            className="text-xs font-bold text-[#D97757] dark:text-[#E8A785] hover:underline flex items-center gap-0.5"
          >
            View All
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentItems.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-[#2B2A28] rounded-3xl border border-dashed border-[#E5E3DA] dark:border-[#3E3D3A] p-6">
            <Camera className="w-10 h-10 text-[#83827C] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#44433F] dark:text-[#E5E3DA]">
              No items saved yet
            </p>
            <p className="text-xs text-[#83827C] mt-1">
              Tap <span className="font-bold text-[#D97757]">Remember</span> above to save your first item!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recentItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="group cursor-pointer bg-white dark:bg-[#2B2A28] border border-[#E5E3DA] dark:border-[#3E3D3A] rounded-2xl p-2.5 shadow-sm hover:shadow-md transition-all flex items-center gap-2.5 relative overflow-hidden"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#EFEEE7] dark:bg-[#1F1E1C] shrink-0 relative">
                  <img
                    src={item.image_path}
                    alt={item.name}
                    className={`w-full h-full object-cover transition-all duration-300 ${
                      blurRecentlySaved
                        ? "blur-md group-hover:blur-none scale-105"
                        : "group-hover:scale-105"
                    }`}
                    referrerPolicy="no-referrer"
                  />
                  {blurRecentlySaved && (
                    <div className="absolute inset-0 bg-black/20 group-hover:opacity-0 transition-opacity flex items-center justify-center pointer-events-none">
                      <EyeOff className="w-4 h-4 text-white/90 drop-shadow" />
                    </div>
                  )}
                  {item.source_type === "scan" && (
                    <span className="absolute bottom-0.5 left-0.5 bg-[#D97757] text-white text-[9px] font-bold px-1 py-0 rounded">
                      Scan
                    </span>
                  )}
                  {item.is_pinned && (
                    <span className="absolute top-0.5 left-0.5 bg-[#D97757] text-white p-0.5 rounded shadow">
                      <Pin className="w-2.5 h-2.5 fill-current" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 pr-1">
                  <h3 className="font-bold text-xs sm:text-sm text-[#30302E] dark:text-[#E5E3DA] truncate">
                    {item.name}
                  </h3>

                  <p
                    className={`text-[11px] text-[#83827C] dark:text-[#A8A7A2] font-medium truncate flex items-center gap-1 mt-0.5 transition-all duration-300 ${
                      blurLocationRecentlySaved
                        ? "blur-sm group-hover:blur-none hover:blur-none select-none"
                        : ""
                    }`}
                  >
                    <MapPin className="w-3 h-3 text-[#D97757] shrink-0" />
                    <span className="truncate">{item.location_name}</span>
                  </p>

                  <p className="text-[10px] text-[#83827C] dark:text-[#A8A7A2] truncate flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5 text-[#D97757] shrink-0" />
                    <span className="truncate">{formatShortDateTime(item.created_at || item.updated_at)}</span>
                  </p>
                </div>

                {/* Pin & Delete Action Controls */}
                {deletingItemId === item.id ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 bg-white/95 dark:bg-[#2B2A28]/95 backdrop-blur-sm p-2 rounded-2xl flex items-center justify-between gap-1 z-10 animate-fade-in"
                  >
                    <span className="text-[10px] font-bold text-[#D97757] truncate">Delete?</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteItem) {
                            onDeleteItem(item.id);
                          }
                          setDeletingItemId(null);
                        }}
                        className="px-2 py-0.5 bg-[#D97757] hover:bg-[#C15F3C] text-white text-[10px] font-bold rounded-lg shadow"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingItemId(null);
                        }}
                        className="px-1.5 py-0.5 bg-[#EFEEE7] dark:bg-[#33322F] text-[#44433F] dark:text-[#E5E3DA] text-[10px] font-semibold rounded-lg"
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onUpdateItem) {
                          onUpdateItem({ ...item, is_pinned: !item.is_pinned });
                        }
                      }}
                      className={`p-1.5 rounded-lg transition-all ${
                        item.is_pinned
                          ? "bg-[#D97757] text-white shadow-sm"
                          : "bg-[#EFEEE7] dark:bg-[#33322F] text-[#83827C] hover:text-[#30302E] dark:hover:text-white"
                      }`}
                      title={item.is_pinned ? "Unpin item" : "Pin item to top"}
                    >
                      <Pin className={`w-3.5 h-3.5 ${item.is_pinned ? "fill-current" : ""}`} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingItemId(item.id);
                      }}
                      className="p-1.5 rounded-lg text-[#83827C] hover:text-[#D97757] hover:bg-[#D97757]/10 transition-colors"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* BROWSE LOCATIONS GALLERY */}
      {locationGroups.length > 0 && !hideLocationsSection && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest font-bold text-[#83827C] dark:text-[#A8A7A2] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D97757]" />
              Browse Locations
            </h2>
            <button
              onClick={() => onOpenLocations()}
              className="text-xs font-bold text-[#D97757] dark:text-[#E8A785] hover:underline flex items-center gap-0.5"
            >
              View All ({locationGroups.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {locationGroups.slice(0, 4).map((group) => (
              <div
                key={group.name}
                onClick={() => onOpenLocations(group.name)}
                className="group cursor-pointer bg-white dark:bg-[#2B2A28] border border-[#E5E3DA] dark:border-[#3E3D3A] hover:border-[#D97757]/50 rounded-3xl p-3.5 shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#EFEEE7] dark:bg-[#1F1E1C] shrink-0 relative">
                    {group.items[0]?.image_path ? (
                      <img
                        src={group.items[0].image_path}
                        alt={group.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D97757]">
                        <MapPin className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-[#30302E] dark:text-[#E5E3DA] truncate group-hover:text-[#D97757] dark:group-hover:text-[#E8A785] transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-xs text-[#D97757] dark:text-[#E8A785] font-semibold mt-0.5">
                      {group.items.length} {group.items.length === 1 ? "item" : "items"} inside
                    </p>
                    <p className="text-[11px] text-[#83827C] truncate mt-0.5 font-medium">
                      {group.items.map((i) => i.name).slice(0, 2).join(", ")}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-[#83827C] shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SCANNED SPACES GALLERY */}
      {spaces.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest font-bold text-[#83827C] dark:text-[#A8A7A2] flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-[#D97757]" />
              Scanned Spaces
            </h2>
            <button
              onClick={onOpenScanSpace}
              className="text-xs font-bold text-[#D97757] dark:text-[#E8A785] hover:underline"
            >
              Scan new space +
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {spaces.map((space) => (
              <div
                key={space.id}
                onClick={() => onSelectSpace(space)}
                className="group cursor-pointer bg-white dark:bg-[#2B2A28] border border-[#E5E3DA] dark:border-[#3E3D3A] rounded-3xl p-3.5 shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center gap-3"
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#EFEEE7] dark:bg-[#1F1E1C] shrink-0 relative">
                  <img
                    src={space.image_path}
                    alt={space.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-[#30302E] dark:text-[#E5E3DA] truncate">
                    {space.name}
                  </h3>
                  <p className="text-xs text-[#D97757] font-semibold mt-0.5">
                    {space.detected_items_count} items detected
                  </p>
                  <p className="text-[11px] text-[#83827C] mt-0.5 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-[#D97757]" />
                    Scanned: {formatShortDateTime(space.created_at)}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#83827C] shrink-0" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
