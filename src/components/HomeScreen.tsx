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
} from "lucide-react";
import { Item, Space } from "../types";
import { formatRelativeTime, formatShortDateTime } from "../lib/imageUtils";
import { VoiceListener, isSpeechRecognitionSupported } from "../lib/speech";
import { DictationIndicator } from "./DictationIndicator";

interface HomeScreenProps {
  items: Item[];
  spaces: Space[];
  blurRecentlySaved?: boolean;
  blurLocationRecentlySaved?: boolean;
  hideLocationsSection?: boolean;
  onOpenRemember: () => void;
  onOpenFind: (initialQuery?: string) => void;
  onOpenScanSpace: () => void;
  onOpenLocations: (locationName?: string) => void;
  onSelectItem: (item: Item) => void;
  onSelectSpace: (space: Space) => void;
  onUpdateItem?: (item: Item) => void;
  onDeleteItem?: (id: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  items,
  spaces,
  blurRecentlySaved = false,
  blurLocationRecentlySaved = false,
  hideLocationsSection = false,
  onOpenRemember,
  onOpenFind,
  onOpenScanSpace,
  onOpenLocations,
  onSelectItem,
  onSelectSpace,
  onUpdateItem,
  onDeleteItem,
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
          className="relative flex items-center shadow-sm rounded-2xl bg-white dark:bg-[#23201C] border border-[#E8E4E1] dark:border-[#38332E] overflow-hidden p-1"
        >
          <Search className="w-5 h-5 text-[#8C847E] ml-3 shrink-0" />
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder='Ask "Where are my keys?" or "Passport"...'
            className="w-full py-3 pl-3 pr-28 text-base text-[#2D2A26] dark:text-[#E8E4E1] bg-transparent placeholder-[#8C847E] focus:outline-none"
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            {/* Dictate Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`px-3 py-2.5 rounded-xl shadow transition-all flex items-center gap-1.5 text-xs font-bold select-none active:scale-95 cursor-pointer ${
                isListening
                  ? "bg-[#C2847A] text-white animate-pulse"
                  : "bg-[#F2EDE9] dark:bg-[#2E2A25] text-[#4A443F] dark:text-[#E8E4E1] hover:bg-[#E8E4E1] dark:hover:bg-[#38332E]"
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
              className="p-2.5 bg-[#6B7E6D] hover:bg-[#586A5A] text-white rounded-xl shadow transition-all"
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

      {/* CORE ACTION BUTTONS */}
      <div
        className={`grid ${
          hideLocationsSection
            ? "grid-cols-1 sm:grid-cols-3 md:grid-cols-3"
            : "grid-cols-2 md:grid-cols-4"
        } gap-3`}
      >
        {/* 1. REMEMBER */}
        <button
          onClick={onOpenRemember}
          className="group text-center p-4 sm:p-5 bg-white dark:bg-[#23201C] border border-[#E8E4E1] dark:border-[#38332E] hover:border-[#6B7E6D]/60 rounded-3xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col items-center justify-between"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#6B7E6D]/10 text-[#6B7E6D] dark:text-[#91A493] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Camera className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#2D2A26] dark:text-[#E8E4E1] mb-0.5">
              Remember
            </h2>
            <p className="text-[11px] text-[#8C847E] dark:text-[#A3B0A5] leading-tight">
              Save item spot
            </p>
          </div>
        </button>

        {/* 2. FIND */}
        <button
          onClick={() => onOpenFind()}
          className="group text-center p-4 sm:p-5 bg-white dark:bg-[#23201C] border border-[#E8E4E1] dark:border-[#38332E] hover:border-[#5A7D9A]/60 rounded-3xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col items-center justify-between"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#5A7D9A]/10 text-[#5A7D9A] dark:text-[#7A9DBA] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Search className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#2D2A26] dark:text-[#E8E4E1] mb-0.5">
              Find
            </h2>
            <p className="text-[11px] text-[#8C847E] dark:text-[#A3B0A5] leading-tight">
              Search lost item
            </p>
          </div>
        </button>

        {/* 3. LOCATIONS (If not hidden) */}
        {!hideLocationsSection && (
          <button
            onClick={() => onOpenLocations()}
            className="group text-center p-4 sm:p-5 bg-white dark:bg-[#23201C] border border-[#E8E4E1] dark:border-[#38332E] hover:border-[#6B7E6D]/60 rounded-3xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col items-center justify-between"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#6B7E6D]/15 text-[#6B7E6D] dark:text-[#91A493] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <MapPin className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#2D2A26] dark:text-[#E8E4E1] mb-0.5">
                Locations
              </h2>
              <p className="text-[11px] text-[#8C847E] dark:text-[#A3B0A5] leading-tight">
                Browse by spot ({locationGroups.length})
              </p>
            </div>
          </button>
        )}

        {/* 4. SCAN A SPACE */}
        <button
          onClick={onOpenScanSpace}
          className="group text-center p-4 sm:p-5 bg-white dark:bg-[#23201C] border border-[#E8E4E1] dark:border-[#38332E] hover:border-[#C2847A]/60 rounded-3xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col items-center justify-between"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#C2847A]/10 text-[#C2847A] dark:text-[#DA9E94] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Grid className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#2D2A26] dark:text-[#E8E4E1] mb-0.5">
              Scan Space
            </h2>
            <p className="text-[11px] text-[#8C847E] dark:text-[#A3B0A5] leading-tight">
              Catalog drawer/shelf
            </p>
          </div>
        </button>
      </div>

      {/* PINNED / FAVOURITES */}
      {pinnedItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest font-bold text-[#8C847E] dark:text-[#A3B0A5] flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5 text-[#C2847A] fill-[#C2847A]" />
              Pinned Items
            </h2>
            <span className="text-xs text-[#8C847E] dark:text-[#A3B0A5]">
              {pinnedItems.length} items
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pinnedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="group text-left bg-white/70 dark:bg-[#23201C]/70 border border-[#E8E4E1] dark:border-[#38332E] rounded-3xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden relative"
              >
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#F2EDE9] dark:bg-[#1E1B18] relative mb-2.5">
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
                      className="p-1.5 bg-[#C2847A] text-white rounded-xl shadow-md hover:scale-105 transition-transform"
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
                      className="p-1.5 bg-black/60 hover:bg-[#C2847A] text-white rounded-xl shadow-md transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-[#2D2A26] dark:text-[#E8E4E1] truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs text-[#8C847E] dark:text-[#A3B0A5] truncate flex items-center gap-1 mt-0.5 font-medium">
                    <MapPin className="w-3 h-3 text-[#6B7E6D] shrink-0" />
                    <span className="truncate">{item.location_name}</span>
                  </p>
                  <p className="text-[10px] text-[#8C847E] dark:text-[#A3B0A5] truncate flex items-center gap-1 mt-1 font-medium">
                    <Clock className="w-2.5 h-2.5 text-[#6B7E6D] shrink-0" />
                    <span className="truncate">Recorded: {formatShortDateTime(item.created_at || item.updated_at)}</span>
                  </p>
                </div>

                {deletingItemId === item.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 bg-white/95 dark:bg-[#23201C]/95 backdrop-blur-sm p-3 rounded-3xl flex flex-col items-center justify-center text-center gap-2 z-10 animate-fade-in"
                  >
                    <AlertCircle className="w-5 h-5 text-[#C2847A]" />
                    <span className="text-xs font-bold text-[#2D2A26] dark:text-[#E8E4E1]">Are you sure?</span>
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
                        className="px-2.5 py-1 bg-[#C2847A] hover:bg-[#A86E64] text-white text-xs font-bold rounded-xl shadow"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingItemId(null);
                        }}
                        className="px-2 py-1 bg-[#F2EDE9] dark:bg-[#2E2A25] text-[#4A443F] dark:text-[#E8E4E1] text-xs font-semibold rounded-xl"
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

      {/* RECENTLY SAVED ITEMS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs uppercase tracking-widest font-bold text-[#8C847E] dark:text-[#A3B0A5] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#6B7E6D]" />
              Recently Saved
            </h2>
            <span className="text-[10px] bg-[#6B7E6D]/15 text-[#6B7E6D] dark:text-[#91A493] px-2 py-0.5 rounded-full font-bold">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>
          <button
            onClick={() => onOpenFind()}
            className="text-xs font-bold text-[#6B7E6D] dark:text-[#91A493] hover:underline flex items-center gap-0.5"
          >
            View All
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentItems.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-[#23201C] rounded-3xl border border-dashed border-[#E8E4E1] dark:border-[#38332E] p-6">
            <Camera className="w-10 h-10 text-[#8C847E] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#4A443F] dark:text-[#E8E4E1]">
              No items saved yet
            </p>
            <p className="text-xs text-[#8C847E] mt-1">
              Tap <span className="font-bold text-[#6B7E6D]">Remember</span> above to save your first item!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recentItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="group cursor-pointer bg-white dark:bg-[#23201C] border border-[#E8E4E1] dark:border-[#38332E] rounded-2xl p-2.5 shadow-sm hover:shadow-md transition-all flex items-center gap-2.5 relative overflow-hidden"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F2EDE9] dark:bg-[#1E1B18] shrink-0 relative">
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
                    <span className="absolute bottom-0.5 left-0.5 bg-[#C2847A] text-white text-[9px] font-bold px-1 py-0 rounded">
                      Scan
                    </span>
                  )}
                  {item.is_pinned && (
                    <span className="absolute top-0.5 left-0.5 bg-[#C2847A] text-white p-0.5 rounded shadow">
                      <Pin className="w-2.5 h-2.5 fill-current" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 pr-1">
                  <h3 className="font-bold text-xs sm:text-sm text-[#2D2A26] dark:text-[#E8E4E1] truncate">
                    {item.name}
                  </h3>

                  <p
                    className={`text-[11px] text-[#8C847E] dark:text-[#A3B0A5] font-medium truncate flex items-center gap-1 mt-0.5 transition-all duration-300 ${
                      blurLocationRecentlySaved
                        ? "blur-sm group-hover:blur-none hover:blur-none select-none"
                        : ""
                    }`}
                  >
                    <MapPin className="w-3 h-3 text-[#6B7E6D] shrink-0" />
                    <span className="truncate">{item.location_name}</span>
                  </p>

                  <p className="text-[10px] text-[#8C847E] dark:text-[#A3B0A5] truncate flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5 text-[#6B7E6D] shrink-0" />
                    <span className="truncate">{formatShortDateTime(item.created_at || item.updated_at)}</span>
                  </p>
                </div>

                {/* Pin & Delete Action Controls */}
                {deletingItemId === item.id ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 bg-white/95 dark:bg-[#23201C]/95 backdrop-blur-sm p-2 rounded-2xl flex items-center justify-between gap-1 z-10 animate-fade-in"
                  >
                    <span className="text-[10px] font-bold text-[#C2847A] truncate">Delete?</span>
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
                        className="px-2 py-0.5 bg-[#C2847A] hover:bg-[#A86E64] text-white text-[10px] font-bold rounded-lg shadow"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingItemId(null);
                        }}
                        className="px-1.5 py-0.5 bg-[#F2EDE9] dark:bg-[#2E2A25] text-[#4A443F] dark:text-[#E8E4E1] text-[10px] font-semibold rounded-lg"
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
                          ? "bg-[#C2847A] text-white shadow-sm"
                          : "bg-[#F2EDE9] dark:bg-[#2E2A25] text-[#8C847E] hover:text-[#2D2A26] dark:hover:text-white"
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
                      className="p-1.5 rounded-lg text-[#8C847E] hover:text-[#C2847A] hover:bg-[#C2847A]/10 transition-colors"
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
            <h2 className="text-xs uppercase tracking-widest font-bold text-[#8C847E] dark:text-[#A3B0A5] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#6B7E6D]" />
              Browse Locations
            </h2>
            <button
              onClick={() => onOpenLocations()}
              className="text-xs font-bold text-[#6B7E6D] dark:text-[#91A493] hover:underline flex items-center gap-0.5"
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
                className="group cursor-pointer bg-white dark:bg-[#23201C] border border-[#E8E4E1] dark:border-[#38332E] hover:border-[#6B7E6D]/50 rounded-3xl p-3.5 shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#F2EDE9] dark:bg-[#1E1B18] shrink-0 relative">
                    {group.items[0]?.image_path ? (
                      <img
                        src={group.items[0].image_path}
                        alt={group.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#6B7E6D]">
                        <MapPin className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-[#2D2A26] dark:text-[#E8E4E1] truncate group-hover:text-[#6B7E6D] dark:group-hover:text-[#91A493] transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-xs text-[#6B7E6D] dark:text-[#91A493] font-semibold mt-0.5">
                      {group.items.length} {group.items.length === 1 ? "item" : "items"} inside
                    </p>
                    <p className="text-[11px] text-[#8C847E] truncate mt-0.5 font-medium">
                      {group.items.map((i) => i.name).slice(0, 2).join(", ")}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-[#8C847E] shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SCANNED SPACES GALLERY */}
      {spaces.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest font-bold text-[#8C847E] dark:text-[#A3B0A5] flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-[#C2847A]" />
              Scanned Spaces
            </h2>
            <button
              onClick={onOpenScanSpace}
              className="text-xs font-bold text-[#6B7E6D] dark:text-[#91A493] hover:underline"
            >
              Scan new space +
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {spaces.map((space) => (
              <div
                key={space.id}
                onClick={() => onSelectSpace(space)}
                className="group cursor-pointer bg-white dark:bg-[#23201C] border border-[#E8E4E1] dark:border-[#38332E] rounded-3xl p-3.5 shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center gap-3"
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#F2EDE9] dark:bg-[#1E1B18] shrink-0 relative">
                  <img
                    src={space.image_path}
                    alt={space.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-[#2D2A26] dark:text-[#E8E4E1] truncate">
                    {space.name}
                  </h3>
                  <p className="text-xs text-[#C2847A] font-semibold mt-0.5">
                    {space.detected_items_count} items detected
                  </p>
                  <p className="text-[11px] text-[#8C847E] mt-0.5 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-[#C2847A]" />
                    Scanned: {formatShortDateTime(space.created_at)}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8C847E] shrink-0" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
