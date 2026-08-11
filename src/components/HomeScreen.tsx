import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Camera,
  Search,
  Grid,
  Pin,
  Clock,
  Mic,
  MicOff,
  ChevronRight,
  Sparkles,
  MapPin,
  Trash2,
  AlertCircle,
  EyeOff,
  HandHeart,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { Item, Space, BorrowedItem } from "../types";
import { formatRelativeTime, formatShortDateTime } from "../lib/imageUtils";
import { VoiceListener, isSpeechRecognitionSupported } from "../lib/speech";
import { DictationIndicator } from "./DictationIndicator";
import { ItemLocationRing } from "./ItemLocationRing";

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

// Blue family only — blue is reserved for the Borrowed/Loaned feature.
const AVATAR_COLORS = ["#5B84C4", "#4A70AC", "#7B95C9", "#3E5F94"];

function avatarColorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still up? 🌙";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
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
  const [searchFocused, setSearchFocused] = useState(false);

  const quickResults = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    if (!q) return [];
    const tokens = q.split(/\s+/).filter(Boolean);
    return items
      .map((it) => {
        const name = (it.name || "").toLowerCase();
        const loc = (it.location_name || "").toLowerCase();
        const desc = (it.description || "").toLowerCase();
        const tags = (it.tags || []).join(" ").toLowerCase();
        const full = `${name} ${loc} ${desc} ${tags}`;
        if (!tokens.every((t) => full.includes(t))) return null;
        const score = name === q ? 3 : name.includes(q) ? 2 : 1;
        return { item: it, score };
      })
      .filter((x): x is { item: Item; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((x) => x.item);
  }, [quickQuery, items]);

  // Group unique locations
  const locationMap = new Map<string, { name: string; items: Item[] }>();
  items.forEach((item) => {
    const loc = (item.location_name || "General Storage").trim();
    if (!locationMap.has(loc)) locationMap.set(loc, { name: loc, items: [] });
    locationMap.get(loc)!.items.push(item);
  });
  const locationGroups = Array.from(locationMap.values()).sort((a, b) => b.items.length - a.items.length);

  const activeBorrowed = useMemo(
    () =>
      borrowedItems
        .filter((b) => !b.is_returned)
        .sort((a, b) => {
          const aTime = a.next_reminder_at ? new Date(a.next_reminder_at).getTime() : Infinity;
          const bTime = b.next_reminder_at ? new Date(b.next_reminder_at).getTime() : Infinity;
          return aTime - bTime;
        }),
    [borrowedItems]
  );
  const overdueBorrowed = activeBorrowed.filter(
    (b) => b.reminder_interval !== "none" && b.next_reminder_at && new Date(b.next_reminder_at).getTime() <= Date.now()
  );

  const voiceListenerRef = useRef<VoiceListener | null>(null);

  useEffect(() => {
    if (isSpeechRecognitionSupported()) {
      voiceListenerRef.current = new VoiceListener(
        (transcript, isFinal) => {
          setQuickQuery(transcript);
          if (isFinal) setIsListening(false);
        },
        () => setIsListening(false),
        () => setIsListening(false),
        (level) => setAudioLevel(level)
      );
    }
    return () => {
      if (voiceListenerRef.current) voiceListenerRef.current.stop();
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
  const recentItems = items.filter((item) => !item.is_pinned).slice(0, 6);
  const heroPhoto = items[0]?.image_path;

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isListening && voiceListenerRef.current) {
      voiceListenerRef.current.stop();
      setIsListening(false);
    }
    if (quickQuery.trim()) onOpenFind(quickQuery.trim());
    else onOpenFind();
  };

  // Shared photo-forward item card, used for both Pinned and Recently Saved
  const ItemCard: React.FC<{ item: Item }> = ({ item }) => (
    <div
      onClick={() => onSelectItem(item)}
      className="group text-left bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer relative"
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-[#E5E3DA] dark:bg-[#100F0D]">
        <img
          src={item.image_path}
          alt={item.name}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            blurRecentlySaved ? "blur-md group-hover:blur-none" : ""
          }`}
          referrerPolicy="no-referrer"
        />
        {item.bbox && !blurRecentlySaved && <ItemLocationRing bbox={item.bbox} />}
        {blurRecentlySaved && (
          <div className="absolute inset-0 bg-black/15 group-hover:opacity-0 transition-opacity flex items-center justify-center pointer-events-none">
            <EyeOff className="w-4 h-4 text-white/90 drop-shadow" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onUpdateItem) onUpdateItem({ ...item, is_pinned: !item.is_pinned });
            }}
            className={`p-1.5 rounded-xl shadow-md transition-transform hover:scale-105 ${
              item.is_pinned ? "bg-[#7CA65B] text-white" : "bg-black/60 text-white"
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${item.is_pinned ? "fill-current" : ""}`} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeletingItemId(item.id);
            }}
            className="p-1.5 bg-black/60 hover:bg-[#B0473A] text-white rounded-xl shadow-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        {item.is_pinned && (
          <span className="absolute top-2 left-2 bg-[#7CA65B] text-white p-1 rounded-lg shadow opacity-100 group-hover:opacity-0 transition-opacity">
            <Pin className="w-3 h-3 fill-current" />
          </span>
        )}

        {deletingItemId === item.id && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm p-3 flex flex-col items-center justify-center text-center gap-2 z-10 animate-fade-in"
          >
            <AlertCircle className="w-5 h-5 text-[#E8988A]" />
            <span className="text-xs font-bold text-white">Delete this item?</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDeleteItem) onDeleteItem(item.id);
                  setDeletingItemId(null);
                }}
                className="px-2.5 py-1 bg-[#B0473A] hover:bg-[#9A3C31] text-white text-xs font-bold rounded-xl"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingItemId(null);
                }}
                className="px-2.5 py-1 bg-white/20 text-white text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-bold text-sm text-[#30302E] dark:text-[#F2F0EA] truncate">{item.name}</h3>
        <p
          className={`text-xs text-[#83827C] dark:text-[#A8A7A2] truncate flex items-center gap-1.5 mt-1 font-medium ${
            blurLocationRecentlySaved ? "blur-sm group-hover:blur-none select-none" : ""
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#7CA65B] shrink-0" />
          <span className="truncate">{item.location_name}</span>
        </p>
        <p className="text-[11px] text-[#83827C] dark:text-[#7A7972] mt-0.5">
          Saved {formatRelativeTime(item.created_at || item.updated_at)}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-7 pb-28">
      {/* GREETING */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#30302E] dark:text-[#F2F0EA] tracking-tight">
          {getGreeting()} 👋
        </h1>
        <p className="text-sm text-[#83827C] dark:text-[#A8A7A2] mt-0.5">What are you trying to find?</p>
      </div>

      {/* HERO SEARCH / ASK BAR */}
      <div className="space-y-2">
        <div className="relative">
          <form
            onSubmit={handleQuickSearchSubmit}
            className="relative flex items-center bg-[#EFEEE7] dark:bg-[#211F1B] rounded-full overflow-hidden pl-1.5 pr-1.5 py-1.5 shadow-sm"
          >
            <Search className="w-5 h-5 text-[#83827C] dark:text-[#A8A7A2] ml-3 shrink-0" />
            <input
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              placeholder="Ask Rembr... where are my keys?"
              className="w-full py-2.5 pl-3 pr-2 text-[15px] text-[#30302E] dark:text-[#F2F0EA] bg-transparent placeholder-[#83827C] dark:placeholder-[#7A7972] focus:outline-none"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2.5 rounded-full transition-all select-none active:scale-95 cursor-pointer ${
                  isListening
                    ? "bg-[#7CA65B] text-white animate-pulse"
                    : "bg-white/70 dark:bg-white/5 text-[#44433F] dark:text-[#E5E3DA] hover:bg-white dark:hover:bg-white/10"
                }`}
                title={isListening ? "Tap to stop dictating" : "Ask by voice"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onOpenRemember}
                className="p-2.5 rounded-full bg-white/70 dark:bg-white/5 text-[#44433F] dark:text-[#E5E3DA] hover:bg-white dark:hover:bg-white/10 transition-all"
                title="Snap a photo to remember something"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* LIVE QUICK RESULTS — appears as soon as you start typing */}
          {searchFocused && quickQuery.trim() && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 bg-white dark:bg-[#211F1B] rounded-2xl shadow-lg overflow-hidden">
              {quickResults.length > 0 ? (
                <>
                  {quickResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onSelectItem(item);
                        setQuickQuery("");
                      }}
                      className="w-full flex items-center gap-3 p-2.5 hover:bg-[#EFEEE7] dark:hover:bg-[#1E1C19] transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#EFEEE7] dark:bg-[#1E1C19] shrink-0">
                        {item.image_path && (
                          <img src={item.image_path} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#30302E] dark:text-[#F2F0EA] truncate">{item.name}</p>
                        <p className="text-xs text-[#83827C] dark:text-[#A8A7A2] truncate">{item.location_name}</p>
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onOpenFind(quickQuery.trim())}
                    className="w-full p-2.5 text-center text-xs font-bold text-[#5F8A48] dark:text-[#A8C98B] hover:bg-[#EFEEE7] dark:hover:bg-[#1E1C19]"
                  >
                    See all results for "{quickQuery.trim()}"
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onOpenFind(quickQuery.trim())}
                  className="w-full p-3 text-center text-xs font-semibold text-[#83827C] dark:text-[#A8A7A2]"
                >
                  No quick matches for "{quickQuery.trim()}" — tap to search everything
                </button>
              )}
            </div>
          )}
        </div>

        <DictationIndicator
          isListening={isListening}
          transcript={quickQuery}
          audioLevel={audioLevel}
          onStop={toggleVoiceInput}
          label="Listening for your search text..."
        />
      </div>

      {/* OVERDUE BORROWED BANNER */}
      {!hideBorrowedSection && overdueBorrowed.length > 0 && (
        <button
          onClick={onOpenBorrowed}
          className="w-full text-left p-3.5 bg-[#5B84C4]/12 rounded-2xl flex items-center gap-3 hover:bg-[#5B84C4]/18 transition-all active:scale-[0.99]"
        >
          <div className="relative shrink-0">
            <span className="absolute w-8 h-8 rounded-full bg-[#5B84C4] opacity-30 animate-ping" />
            <div className="relative w-8 h-8 rounded-full bg-[#5B84C4] text-white flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-[#4A70AC] dark:text-[#8FADDE] uppercase tracking-wider">
              {overdueBorrowed.length} item{overdueBorrowed.length === 1 ? "" : "s"} overdue
            </p>
            <p className="text-xs font-semibold text-[#44433F] dark:text-[#E5E3DA] truncate mt-0.5">
              {overdueBorrowed.slice(0, 2).map((b) => `${b.borrowed_to} has your ${b.item_name}`).join(" · ")}
              {overdueBorrowed.length > 2 ? "…" : ""}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#5B84C4] shrink-0" />
        </button>
      )}

      {/* HERO REMEMBER CARD */}
      <button
        onClick={onOpenRemember}
        className="group relative w-full text-left rounded-[28px] overflow-hidden shadow-md active:scale-[0.99] transition-all h-44"
      >
        {heroPhoto ? (
          <img
            src={heroPhoto}
            alt=""
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#3F4A36] via-[#2E3628] to-[#1E1C19]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

        <div className="relative h-full p-5 flex flex-col justify-end">
          <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md text-white flex items-center justify-center mb-2">
            <Camera className="w-4.5 h-4.5" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Remember something</h2>
          <p className="text-xs text-white/75 mt-0.5 mb-3">Take a photo or just tell me where you put it</p>
          <span className="inline-flex w-fit items-center gap-1.5 px-4 py-2 bg-[#7CA65B] text-white text-xs font-bold rounded-full shadow-lg">
            Add new item
          </span>
        </div>
      </button>

      {/* SECONDARY ACTIONS */}
      <div className={`grid gap-3 ${!hideBorrowedSection ? "grid-cols-2" : "grid-cols-1"}`}>
        <button
          onClick={onOpenScanSpace}
          className="text-left p-4 bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-3xl hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#7CA65B]/15 text-[#5F8A48] dark:text-[#A8C98B] flex items-center justify-center">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#30302E] dark:text-[#F2F0EA]">Scan a space</h3>
            <p className="text-[11px] text-[#83827C] dark:text-[#A8A7A2] mt-0.5">Catalog a drawer, shelf or room</p>
          </div>
        </button>

        {!hideBorrowedSection && (
          <button
            onClick={onOpenBorrowed}
            className="text-left p-4 bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-3xl hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5 relative"
          >
            {overdueBorrowed.length > 0 && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#B0473A] text-white text-[10px] font-bold flex items-center justify-center">
                {overdueBorrowed.length}
              </span>
            )}
            <div className="w-10 h-10 rounded-2xl bg-[#5B84C4]/15 text-[#4A70AC] dark:text-[#8FADDE] flex items-center justify-center">
              <HandHeart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#30302E] dark:text-[#F2F0EA]">Lend an item</h3>
              <p className="text-[11px] text-[#83827C] dark:text-[#A8A7A2] mt-0.5">Keep track of things you've lent out</p>
            </div>
          </button>
        )}
      </div>

      {/* PINNED */}
      {pinnedItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest font-bold text-[#83827C] dark:text-[#A8A7A2] flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 text-[#5B84C4] fill-[#5B84C4]" />
            Pinned
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {pinnedItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* RECENTLY SAVED — photo-forward cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest font-bold text-[#83827C] dark:text-[#A8A7A2]">
            Recently saved
          </h2>
          {items.length > 0 && (
            <button
              onClick={() => onOpenFind()}
              className="text-xs font-bold text-[#5F8A48] dark:text-[#A8C98B] hover:underline flex items-center gap-0.5"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-10 bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-3xl">
            <Camera className="w-8 h-8 text-[#83827C] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#44433F] dark:text-[#E5E3DA]">Nothing remembered yet</p>
            <p className="text-xs text-[#83827C] mt-1">
              Tap <span className="font-bold text-[#5F8A48] dark:text-[#A8C98B]">Remember something</span> above to save your first item
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {recentItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* OUT ON LOAN — friendly strip */}
      {!hideBorrowedSection && activeBorrowed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest font-bold text-[#83827C] dark:text-[#A8A7A2]">
              Out on loan
            </h2>
            <button
              onClick={onOpenBorrowed}
              className="text-xs font-bold text-[#4A70AC] dark:text-[#8FADDE] hover:underline flex items-center gap-0.5"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {activeBorrowed.slice(0, 4).map((b) => {
              const overdue =
                b.reminder_interval !== "none" && b.next_reminder_at && new Date(b.next_reminder_at).getTime() <= Date.now();
              return (
                <div
                  key={b.id}
                  onClick={onOpenBorrowed}
                  className="flex items-center gap-3 p-2.5 bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-2xl cursor-pointer hover:shadow-sm transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: avatarColorFor(b.borrowed_to) }}
                  >
                    {b.borrowed_to.trim().charAt(0).toUpperCase() || "?"}
                  </div>
                  {b.image_path ? (
                    <img src={b.image_path} alt={b.item_name} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-[#5B84C4]/15 text-[#4A70AC] dark:text-[#8FADDE] flex items-center justify-center shrink-0">
                      <HandHeart className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#30302E] dark:text-[#F2F0EA] truncate">
                      {b.borrowed_to} has your {b.item_name}
                    </p>
                    <p className="text-[11px] text-[#83827C] dark:text-[#A8A7A2]">
                      Borrowed {formatRelativeTime(b.date_borrowed)}
                    </p>
                  </div>
                  {onMarkBorrowedReturned ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkBorrowedReturned(b);
                      }}
                      title="Mark as returned"
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors ${
                        overdue
                          ? "bg-[#B0473A]/15 text-[#B0473A] hover:bg-[#7CA65B]/15 hover:text-[#5F8A48]"
                          : "bg-[#7CA65B]/12 text-[#5F8A48] dark:text-[#A8C98B] hover:bg-[#7CA65B]/25"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {overdue ? "Overdue" : "Due soon"}
                    </button>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#83827C] shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* WHERE YOUR THINGS ARE — swipeable location cards */}
      {!hideLocationsSection && locationGroups.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest font-bold text-[#83827C] dark:text-[#A8A7A2]">
              Where your things are
            </h2>
            <button
              onClick={() => onOpenLocations()}
              className="text-xs font-bold text-[#5F8A48] dark:text-[#A8C98B] hover:underline flex items-center gap-0.5"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 snap-x">
            {locationGroups.map((group) => (
              <div
                key={group.name}
                onClick={() => onOpenLocations(group.name)}
                className="group shrink-0 w-40 cursor-pointer snap-start"
              >
                <div className="aspect-square rounded-3xl overflow-hidden bg-[#EFEEE7] dark:bg-[#1E1C19] relative">
                  {group.items[0]?.image_path ? (
                    <img
                      src={group.items[0].image_path}
                      alt={group.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#7CA65B]">
                      <MapPin className="w-7 h-7" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5">
                    <p className="text-white text-sm font-bold truncate drop-shadow">{group.name}</p>
                    <p className="text-white/80 text-[11px] font-medium">
                      {group.items.length} {group.items.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SCANNED SPACES */}
      {spaces.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest font-bold text-[#83827C] dark:text-[#A8A7A2]">
              Scanned spaces
            </h2>
            <button
              onClick={onOpenScanSpace}
              className="text-xs font-bold text-[#5F8A48] dark:text-[#A8C98B] hover:underline"
            >
              Scan new +
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 snap-x">
            {spaces.map((space) => (
              <div
                key={space.id}
                onClick={() => onSelectSpace(space)}
                className="group shrink-0 w-40 cursor-pointer snap-start"
              >
                <div className="aspect-square rounded-3xl overflow-hidden bg-[#EFEEE7] dark:bg-[#1E1C19] relative">
                  <img
                    src={space.image_path}
                    alt={space.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5">
                    <p className="text-white text-sm font-bold truncate drop-shadow">{space.name}</p>
                    <p className="text-white/80 text-[11px] font-medium">{space.detected_items_count} items</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
