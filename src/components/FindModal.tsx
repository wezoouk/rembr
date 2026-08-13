import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  Mic,
  MicOff,
  Sparkles,
  MapPin,
  Clock,
  Pin,
  History,
  Trash2,
  Edit3,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Tag,
  ChevronRight,
  ExternalLink,
  HandHeart,
} from "lucide-react";
import { Item, ConfidenceLevel, BorrowedItem } from "../types";
import { searchItemsWithAI } from "../lib/api";
import { cleanSearchQuery } from "../lib/searchUtils";
import { VoiceListener, isSpeechRecognitionSupported } from "../lib/speech";
import { formatFriendlyDateTime, formatRelativeTime } from "../lib/imageUtils";
import { DictationIndicator } from "./DictationIndicator";
import { ItemLocationRing } from "./ItemLocationRing";

// Blue family only — blue is reserved for the Borrowed/Loaned feature.
const AVATAR_COLORS = ["#5B84C4", "#4A70AC", "#7B95C9", "#3E5F94"];
function avatarColorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface FindModalProps {
  items: Item[];
  borrowedItems?: BorrowedItem[];
  initialQuery?: string;
  onClose: () => void;
  onSelectItem: (item: Item) => void;
  onUpdateItem: (item: Item) => void;
  onDeleteItem: (id: string) => void;
  onRememberNewSpot: (item: Item) => void;
  onOpenRemember?: () => void;
  onOpenBorrowed?: () => void;
}

export const FindModal: React.FC<FindModalProps> = ({
  items,
  borrowedItems = [],
  initialQuery = "",
  onClose,
  onSelectItem,
  onUpdateItem,
  onDeleteItem,
  onRememberNewSpot,
  onOpenRemember,
  onOpenBorrowed,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [textAnswer, setTextAnswer] = useState<string | null>(null);
  const [matchedItems, setMatchedItems] = useState<
    Array<{
      item: Item;
      confidence: ConfidenceLevel;
      reasoning: string;
      isPrimaryMatch: boolean;
      matchTypeLabel: string;
    }>
  >([]);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [matchedBorrowed, setMatchedBorrowed] = useState<BorrowedItem[]>([]);

  const voiceListenerRef = useRef<VoiceListener | null>(null);

  const searchBorrowed = (searchQuery: string) => {
    const q = cleanSearchQuery(searchQuery.trim()).toLowerCase();
    const activeBorrowed = borrowedItems.filter((b) => !b.is_returned);
    if (!q) {
      setMatchedBorrowed(activeBorrowed.slice(0, 5));
      return;
    }
    const tokens = q.split(/\s+/).filter(Boolean);
    const matches = activeBorrowed.filter((b) => {
      const name = (b.item_name || "").toLowerCase();
      const person = (b.borrowed_to || "").toLowerCase();
      const full = `${name} ${person}`;
      return tokens.every((t) => full.includes(t));
    });
    setMatchedBorrowed(matches);
  };

  useEffect(() => {
    if (isSpeechRecognitionSupported()) {
      voiceListenerRef.current = new VoiceListener(
        (transcript, isFinal) => {
          setQuery(transcript);
          if (isFinal) {
            setIsListening(false);
            performSearch(transcript);
          }
        },
        () => setIsListening(false),
        () => setIsListening(false),
        (level) => setAudioLevel(level)
      );
    }

    if (initialQuery) {
      performSearch(initialQuery);
    } else {
      // Show all recent items by default as primary
      setMatchedItems(
        items.slice(0, 8).map((it) => ({
          item: it,
          confidence: it.confidence || "High confidence",
          reasoning: "Recent saved item",
          isPrimaryMatch: true,
          matchTypeLabel: "Saved Item",
        }))
      );
      searchBorrowed(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery: string) => {
    const q = cleanSearchQuery(searchQuery.trim()).toLowerCase();
    searchBorrowed(searchQuery);
    if (!q) {
      setMatchedItems(
        items.slice(0, 8).map((it) => ({
          item: it,
          confidence: it.confidence || "High confidence",
          reasoning: "Recent saved item",
          isPrimaryMatch: true,
          matchTypeLabel: "Saved Item",
        }))
      );
      setTextAnswer(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    setTimeout(() => {
      const tokens = q.split(/\s+/).filter((t) => t.length > 0);

      const scoredMatches: Array<{
        item: Item;
        confidence: ConfidenceLevel;
        reasoning: string;
        isPrimaryMatch: boolean;
        matchTypeLabel: string;
        score: number;
      }> = [];

      items.forEach((it) => {
        const itemName = (it.name || "").toLowerCase().trim();
        const itemLoc = (it.location_name || "").toLowerCase().trim();
        const itemDesc = (it.description || "").toLowerCase().trim();
        const itemSpace = (it.space_name || "").toLowerCase().trim();
        const itemTags = (it.tags || []).map((t) => t.toLowerCase());

        const fullText = [itemName, itemLoc, itemDesc, itemSpace, ...itemTags].join(" ");

        // 1. Exact Name Match
        if (itemName === q) {
          scoredMatches.push({
            item: it,
            confidence: it.confidence || "High confidence",
            reasoning: `Exact match for "${searchQuery}"`,
            isPrimaryMatch: true,
            matchTypeLabel: "Exact Match",
            score: 1000,
          });
          return;
        }

        // 2. Title contains ALL query tokens
        const titleContainsAllTokens = tokens.length > 0 && tokens.every((t) => itemName.includes(t));
        if (titleContainsAllTokens) {
          const lenPenalty = Math.abs(itemName.length - q.length);
          scoredMatches.push({
            item: it,
            confidence: it.confidence || "High confidence",
            reasoning: `Title matches all terms in "${searchQuery}"`,
            isPrimaryMatch: true,
            matchTypeLabel: "Primary Match",
            score: 800 - lenPenalty,
          });
          return;
        }

        // 3. Full text contains ALL query tokens
        const fullTextContainsAllTokens = tokens.length > 0 && tokens.every((t) => fullText.includes(t));
        if (fullTextContainsAllTokens) {
          scoredMatches.push({
            item: it,
            confidence: it.confidence || "High confidence",
            reasoning: `Matched all keywords in "${searchQuery}"`,
            isPrimaryMatch: true,
            matchTypeLabel: "Primary Match",
            score: 500,
          });
          return;
        }

        // 4. Partial query token match (secondary match)
        const matchedTokens = tokens.filter((t) => fullText.includes(t));
        if (matchedTokens.length > 0) {
          const ratio = matchedTokens.length / tokens.length;
          scoredMatches.push({
            item: it,
            confidence: it.confidence || "High confidence",
            reasoning: `Partial match for '${matchedTokens.join(", ")}'`,
            isPrimaryMatch: false,
            matchTypeLabel: `Secondary Match (${matchedTokens.join(", ")})`,
            score: 100 * ratio,
          });
        }
      });

      // Sort by score descending so exact match comes first
      scoredMatches.sort((a, b) => b.score - a.score);

      if (scoredMatches.length > 0) {
        const primaryCount = scoredMatches.filter((m) => m.isPrimaryMatch).length;
        const secondaryCount = scoredMatches.filter((m) => !m.isPrimaryMatch).length;

        let answerText = `Found ${scoredMatches.length} matching item(s).`;
        if (primaryCount > 0 && secondaryCount > 0) {
          answerText = `Found ${primaryCount} primary match(es) and ${secondaryCount} secondary (faded) match(es).`;
        } else if (secondaryCount > 0) {
          answerText = `Found ${secondaryCount} secondary (partial) match(es).`;
        }

        setTextAnswer(answerText);
        setMatchedItems(scoredMatches);
      } else {
        setTextAnswer(`No item matching "${searchQuery}" found in saved index & memory.`);
        setMatchedItems([]);
      }

      setIsSearching(false);
    }, 150);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const toggleVoice = async () => {
    if (!voiceListenerRef.current) {
      alert("Voice input is not supported in this browser.");
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

  const togglePin = (item: Item, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...item, is_pinned: !item.is_pinned };
    onUpdateItem(updated);
    // Update local match state
    setMatchedItems((prev) =>
      prev.map((m) => (m.item.id === item.id ? { ...m, item: updated } : m))
    );
  };

  const sampleQuestions = [
    "Where are my keys?",
    "Find my passport.",
    "Where is my screwdriver?",
    "Do I have any AA batteries?",
    "Where did I put the charger?",
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#161412]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#211F1B] rounded-[32px] max-w-xl w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E5E3DA] dark:border-[#3E3D3A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#7CA65B]/10 text-[#7CA65B] dark:text-[#A8C98B] flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-[#30302E] dark:text-[#E5E3DA]">
              Find Saved Stuff
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#83827C] hover:text-[#30302E] dark:hover:text-white rounded-xl hover:bg-[#EFEEE7] dark:hover:bg-[#1E1C19] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-4 mb-3 shrink-0">
          <div className="relative flex items-center shadow-sm rounded-2xl bg-[#EFEEE7] dark:bg-[#1E1C19] overflow-hidden">
            <Search className="w-5 h-5 text-[#83827C] ml-4 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                performSearch(e.target.value);
              }}
              placeholder='Ask e.g. "Where are my keys?"'
              className="w-full py-3.5 pl-3 pr-24 text-base font-semibold text-[#30302E] dark:text-[#E5E3DA] bg-transparent placeholder-[#83827C] focus:outline-none"
            />
            <button
              type="button"
              onClick={toggleVoice}
              className={`absolute right-12 p-2 rounded-xl transition-all select-none active:scale-95 cursor-pointer ${
                isListening
                  ? "bg-[#7CA65B] text-white animate-pulse"
                  : "text-[#83827C] hover:bg-[#E5E3DA] dark:hover:bg-[#3E3D3A]"
              }`}
              title={isListening ? "Tap to stop dictating" : "Tap to start dictating"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              type="submit"
              className="absolute right-2 p-2 bg-[#7CA65B] hover:bg-[#6B9149] text-white rounded-xl shadow transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Dictation Indicator Overlay */}
          <DictationIndicator
            isListening={isListening}
            transcript={query}
            audioLevel={audioLevel}
            onStop={toggleVoice}
            label="Listening for item name or question..."
            className="mt-2"
          />

          {/* Quick Query Sample Pills */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar pb-1">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(q);
                  performSearch(q);
                }}
                className="whitespace-nowrap px-3 py-1 bg-[#7CA65B]/15 hover:bg-[#7CA65B]/25 text-[#7CA65B] dark:text-[#A8C98B] rounded-full text-xs font-semibold transition-colors"
              >
                "{q}"
              </button>
            ))}
          </div>
        </form>

        {/* Searching Status */}
        {isSearching && (
          <div className="p-3 bg-[#7CA65B]/10 border border-[#7CA65B]/20 rounded-2xl flex items-center gap-3 text-xs text-[#7CA65B] dark:text-[#A8C98B] font-semibold mb-3 animate-pulse">
            <Search className="w-4 h-4 animate-spin" />
            <span>Searching index & memory...</span>
          </div>
        )}

        {/* Index & Memory Answer Summary Banner */}
        {textAnswer && (
          <div className="p-3.5 bg-[#7CA65B]/10 border border-[#7CA65B]/20 rounded-2xl mb-3 flex items-start gap-2.5 text-xs text-[#30302E] dark:text-[#E5E3DA] shadow-sm">
            <Search className="w-4.5 h-4.5 text-[#7CA65B] dark:text-[#A8C98B] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-[#7CA65B] dark:text-[#A8C98B]">
                Index & Memory Search:
              </span>
              <span>{textAnswer}</span>
            </div>
          </div>
        )}

        {/* RESULTS LIST */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {items.length === 0 && borrowedItems.length === 0 ? (
            /* Nothing saved in the whole app yet — this is not a failed
               search, so don't say "no matching item found". */
            <div className="text-center py-12 bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-3xl border border-dashed border-[#E5E3DA] dark:border-[#3E3D3A] p-6">
              <Search className="w-10 h-10 text-[#83827C] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#30302E] dark:text-[#E5E3DA]">
                You don't have any items saved yet
              </p>
              <p className="text-xs text-[#83827C] mt-1 mb-3">
                Want to add your first one?
              </p>
              {onOpenRemember && (
                <button
                  type="button"
                  onClick={onOpenRemember}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7CA65B] hover:bg-[#6B9149] text-white text-xs font-bold rounded-full shadow-sm transition-colors"
                >
                  Add your first item
                </button>
              )}
            </div>
          ) : (
            <>
              {/* LOANED OUT MATCHES */}
              {matchedBorrowed.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#4A70AC] dark:text-[#8FADDE] flex items-center gap-1.5">
                    <HandHeart className="w-3.5 h-3.5" />
                    Loaned Out
                  </h3>
                  <div className="space-y-2">
                    {matchedBorrowed.map((b) => (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => onOpenBorrowed && onOpenBorrowed()}
                        className="w-full flex items-center gap-3 p-3 bg-[#5B84C4]/10 hover:bg-[#5B84C4]/18 rounded-2xl text-left transition-colors"
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
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
                          <p className="text-[11px] text-[#4A70AC] dark:text-[#8FADDE] font-semibold">
                            Loaned out · Borrowed {formatRelativeTime(b.date_borrowed)}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#4A70AC] dark:text-[#8FADDE] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {matchedItems.length === 0 ? (
                items.length === 0 ? null : (
                  <div className="text-center py-12 bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-3xl border border-dashed border-[#E5E3DA] dark:border-[#3E3D3A] p-6">
                    <Search className="w-10 h-10 text-[#83827C] mx-auto mb-2" />
                    <p className="text-sm font-bold text-[#30302E] dark:text-[#E5E3DA]">
                      No matching item found for "{query}"
                    </p>
                    <p className="text-xs text-[#83827C] mt-1">
                      Try searching with different keywords or voice.
                    </p>
                  </div>
                )
              ) : (
            matchedItems.map(({ item, confidence, reasoning, isPrimaryMatch, matchTypeLabel, score }, idx) => {
              const isSearchingQuery = Boolean(query.trim());

              // Heatmap styling tiers based on search ranking:
              // idx 0: Top Match (brightest, glowing border, bold badge)
              // idx 1: High Match (85% opacity)
              // idx 2: Medium Match (70% opacity)
              // idx 3+: Faded Match (45% opacity, brightens on hover)

              let containerClasses = "";
              let titleClasses = "";
              let imageClasses = "";
              let badgeClasses = "";
              let badgeLabel = matchTypeLabel;
              let badgeIcon = <CheckCircle className="w-3.5 h-3.5" />;

              if (isSearchingQuery) {
                if (idx === 0) {
                  // Top Result (Heatmap 🔥 Hot Match)
                  containerClasses =
                    "bg-white dark:bg-[#211F1B] border-2 border-[#7CA65B] dark:border-[#A8C98B] rounded-3xl p-4 shadow-md shadow-[#7CA65B]/15 dark:shadow-none space-y-3 relative ring-2 ring-[#7CA65B]/20";
                  titleClasses =
                    "text-xl font-extrabold text-[#30302E] dark:text-[#E5E3DA] hover:text-[#7CA65B] dark:hover:text-[#A8C98B]";
                  imageClasses =
                    "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300";
                  badgeClasses =
                    "inline-flex items-center gap-1.5 text-xs font-extrabold text-white bg-[#7CA65B] px-3 py-1 rounded-full shadow-sm mt-0.5";
                  badgeLabel = `🔥 #1 Best Match (${matchTypeLabel})`;
                  badgeIcon = <CheckCircle className="w-3.5 h-3.5 text-white" />;
                } else if (idx === 1) {
                  // 2nd Result (High Match)
                  containerClasses =
                    "bg-[#F5F4EF] dark:bg-[#161412] border border-[#7CA65B]/40 dark:border-[#7CA65B]/40 rounded-3xl p-4 shadow-sm opacity-90 saturate-90 hover:opacity-100 hover:saturate-100 transition-all duration-300 space-y-3";
                  titleClasses =
                    "text-lg font-bold text-[#30302E] dark:text-[#E5E3DA] hover:text-[#7CA65B] dark:hover:text-[#A8C98B]";
                  imageClasses =
                    "w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300";
                  badgeClasses =
                    "inline-flex items-center gap-1 text-[11px] font-bold text-[#6B9149] dark:text-[#A8C98B] bg-[#7CA65B]/20 px-2.5 py-0.5 rounded-lg mt-0.5";
                  badgeLabel = `⚡ #2 Match (${matchTypeLabel})`;
                  badgeIcon = <CheckCircle className="w-3 h-3" />;
                } else if (idx === 2) {
                  // 3rd Result (Medium Match)
                  containerClasses =
                    "bg-[#EFEEE7] dark:bg-[#211F1B] border border-[#83827C]/35 dark:border-[#83827C]/30 rounded-3xl p-4 opacity-70 saturate-75 hover:opacity-100 hover:saturate-100 transition-all duration-300 space-y-3";
                  titleClasses =
                    "text-base font-semibold text-[#55534D] dark:text-[#C4C2B8] hover:text-[#30302E]";
                  imageClasses =
                    "w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300";
                  badgeClasses =
                    "inline-flex items-center gap-1 text-[11px] font-semibold text-[#6B6A66] dark:text-[#A8A7A2] bg-[#83827C]/20 px-2 py-0.5 rounded-md mt-0.5";
                  badgeLabel = `#3 Match (${matchTypeLabel})`;
                  badgeIcon = <Tag className="w-3 h-3" />;
                } else {
                  // 4th+ Result (Faded Secondary Match)
                  containerClasses =
                    "bg-[#EFEEE7]/60 dark:bg-[#100F0D]/60 border border-dashed border-[#83827C]/25 dark:border-[#83827C]/25 rounded-3xl p-4 opacity-45 saturate-50 hover:opacity-100 hover:saturate-100 transition-all duration-300 space-y-3";
                  titleClasses =
                    "text-base font-medium text-[#6B6A66] dark:text-[#83827C] hover:text-[#30302E]";
                  imageClasses =
                    "w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300";
                  badgeClasses =
                    "inline-flex items-center gap-1 text-[10px] font-medium text-[#83827C] bg-[#83827C]/10 px-2 py-0.5 rounded-md mt-0.5";
                  badgeLabel = `#${idx + 1} Faded Match`;
                  badgeIcon = <Tag className="w-3 h-3" />;
                }
              } else {
                // Default view (no query entered)
                containerClasses =
                  "bg-white dark:bg-[#211F1B] rounded-3xl p-4 shadow-sm hover:shadow-md transition-all space-y-3";
                titleClasses =
                  "text-lg font-bold text-[#30302E] dark:text-[#E5E3DA] hover:text-[#7CA65B] dark:hover:text-[#A8C98B]";
                imageClasses =
                  "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300";
                badgeClasses =
                  "inline-flex items-center gap-1 text-[11px] font-bold text-[#7CA65B] dark:text-[#A8C98B] bg-[#7CA65B]/15 px-2 py-0.5 rounded-md mt-0.5";
              }

              return (
                <div key={item.id} className={containerClasses}>
                  {/* Main Photo & Details */}
                  <div className="flex flex-col sm:flex-row gap-3.5">
                    <div
                      onClick={() => onSelectItem(item)}
                      className="sm:w-36 h-40 rounded-2xl overflow-hidden bg-[#EFEEE7] dark:bg-[#100F0D] shrink-0 relative cursor-pointer group"
                    >
                      <img
                        src={item.image_path}
                        alt={item.name}
                        className={imageClasses}
                        referrerPolicy="no-referrer"
                      />
                      {item.bbox && <ItemLocationRing bbox={item.bbox} />}
                      <div className="absolute top-2 right-2 p-1.5 bg-[#30302E]/80 text-white rounded-xl backdrop-blur-md">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 onClick={() => onSelectItem(item)} className={titleClasses}>
                            {item.name}
                          </h3>
                          <span className={badgeClasses}>
                            {badgeIcon}
                            {badgeLabel}
                          </span>
                        </div>

                      <button
                        onClick={(e) => togglePin(item, e)}
                        className={`p-2 rounded-xl transition-colors ${
                          item.is_pinned
                            ? "bg-[#7CA65B] text-white"
                            : "bg-[#EFEEE7] dark:bg-[#1E1C19] text-[#83827C] hover:text-[#30302E]"
                        }`}
                        title={item.is_pinned ? "Unpin Item" : "Pin Item"}
                      >
                        <Pin className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    {/* Location Box */}
                    <div className="p-3 bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-2xl ">
                      <p className="text-xs font-semibold text-[#83827C] dark:text-[#A8A7A2] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#7CA65B]" />
                        Last Saved Location:
                      </p>
                      <p className="text-sm font-bold text-[#30302E] dark:text-[#E5E3DA] leading-snug">
                        {item.location_name}
                      </p>
                    </div>

                    {/* Saved Time */}
                    <div className="flex flex-col gap-0.5 text-xs text-[#83827C] dark:text-[#A8A7A2]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#7CA65B]" />
                        <span>
                          Recorded Date: <strong className="text-[#30302E] dark:text-[#E5E3DA]">{formatFriendlyDateTime(item.created_at)}</strong>
                        </span>
                      </div>
                      {item.updated_at && item.updated_at !== item.created_at && (
                        <div className="text-[11px] text-[#83827C] dark:text-[#A8A7A2] pl-5">
                          Last Updated: {formatFriendlyDateTime(item.updated_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ITEM HISTORY SECTION */}
                {item.history && item.history.length > 0 && (
                  <div className="pt-2 border-t border-[#E5E3DA] dark:border-[#3E3D3A]">
                    <p className="text-xs font-bold text-[#83827C] dark:text-[#A8A7A2] uppercase tracking-wider mb-2 flex items-center gap-1">
                      <History className="w-3.5 h-3.5 text-[#7CA65B]" />
                      Previous Locations ({item.history.length}):
                    </p>
                    <div className="space-y-1.5 pl-2 border-l-2 border-[#7CA65B]">
                      {item.history.map((hist) => (
                        <div key={hist.id} className="text-xs">
                          <p className="font-semibold text-[#30302E] dark:text-[#E5E3DA]">
                            {hist.location_name}
                          </p>
                          <p className="text-[10px] text-[#83827C]">
                            {formatFriendlyDateTime(hist.saved_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Action Row */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E5E3DA] dark:border-[#3E3D3A] text-xs">
                  <button
                    onClick={() => onRememberNewSpot(item)}
                    className="px-3 py-1.5 bg-[#7CA65B] hover:bg-[#6B9149] text-white font-bold rounded-xl flex items-center gap-1 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Update Spot</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectItem(item)}
                      className="px-3 py-1.5 bg-[#EFEEE7] dark:bg-[#1E1C19] hover:bg-[#E5E3DA] text-[#44433F] dark:text-[#E5E3DA] font-semibold rounded-xl flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {deletingItemId === item.id ? (
                      <div className="flex items-center gap-1.5 p-1 bg-[#7CA65B]/10 border border-[#7CA65B]/30 rounded-xl">
                        <span className="text-[11px] font-bold text-[#7CA65B] px-1">Are you sure?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteItem(item.id);
                            setMatchedItems((prev) => prev.filter((m) => m.item.id !== item.id));
                            setDeletingItemId(null);
                          }}
                          className="px-2 py-1 bg-[#7CA65B] hover:bg-[#6B9149] text-white text-[11px] font-bold rounded-lg shadow"
                        >
                          Yes, Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingItemId(null)}
                          className="px-2 py-1 bg-[#EFEEE7] dark:bg-[#1E1C19] text-[#44433F] dark:text-[#E5E3DA] text-[11px] font-semibold rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingItemId(item.id)}
                        className="p-1.5 text-[#7CA65B] hover:bg-[#7CA65B]/10 rounded-xl"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
