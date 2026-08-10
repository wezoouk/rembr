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
} from "lucide-react";
import { Item, ConfidenceLevel } from "../types";
import { searchItemsWithAI } from "../lib/api";
import { VoiceListener, isSpeechRecognitionSupported } from "../lib/speech";
import { formatFriendlyDateTime, formatRelativeTime } from "../lib/imageUtils";
import { DictationIndicator } from "./DictationIndicator";

interface FindModalProps {
  items: Item[];
  initialQuery?: string;
  onClose: () => void;
  onSelectItem: (item: Item) => void;
  onUpdateItem: (item: Item) => void;
  onDeleteItem: (id: string) => void;
  onRememberNewSpot: (item: Item) => void;
}

export const FindModal: React.FC<FindModalProps> = ({
  items,
  initialQuery = "",
  onClose,
  onSelectItem,
  onUpdateItem,
  onDeleteItem,
  onRememberNewSpot,
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

  const voiceListenerRef = useRef<VoiceListener | null>(null);

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
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery: string) => {
    const q = searchQuery.toLowerCase().trim();
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
    <div className="fixed inset-0 z-50 bg-[#1A1816]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#23201C] border border-[#E8E4E1] dark:border-[#38332E] rounded-[32px] max-w-xl w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E4E1] dark:border-[#38332E] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#5A7D9A]/10 text-[#5A7D9A] dark:text-[#7A9DBA] flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-[#2D2A26] dark:text-[#E8E4E1]">
              Find Saved Stuff
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8C847E] hover:text-[#2D2A26] dark:hover:text-white rounded-xl hover:bg-[#F2EDE9] dark:hover:bg-[#2E2A25] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-4 mb-3 shrink-0">
          <div className="relative flex items-center shadow-sm rounded-2xl bg-[#F2EDE9] dark:bg-[#2E2A25] border border-[#E8E4E1] dark:border-[#38332E] overflow-hidden">
            <Search className="w-5 h-5 text-[#8C847E] ml-4 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                performSearch(e.target.value);
              }}
              placeholder='Ask e.g. "Where are my keys?"'
              className="w-full py-3.5 pl-3 pr-24 text-base font-semibold text-[#2D2A26] dark:text-[#E8E4E1] bg-transparent placeholder-[#8C847E] focus:outline-none"
            />
            <button
              type="button"
              onClick={toggleVoice}
              className={`absolute right-12 p-2 rounded-xl transition-all select-none active:scale-95 cursor-pointer ${
                isListening
                  ? "bg-[#C2847A] text-white animate-pulse"
                  : "text-[#8C847E] hover:bg-[#E8E4E1] dark:hover:bg-[#38332E]"
              }`}
              title={isListening ? "Tap to stop dictating" : "Tap to start dictating"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              type="submit"
              className="absolute right-2 p-2 bg-[#5A7D9A] hover:bg-[#4A6D8A] text-white rounded-xl shadow transition-colors"
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
                className="whitespace-nowrap px-3 py-1 bg-[#5A7D9A]/15 hover:bg-[#5A7D9A]/25 text-[#5A7D9A] dark:text-[#7A9DBA] rounded-full text-xs font-semibold transition-colors"
              >
                "{q}"
              </button>
            ))}
          </div>
        </form>

        {/* Searching Status */}
        {isSearching && (
          <div className="p-3 bg-[#5A7D9A]/10 border border-[#5A7D9A]/20 rounded-2xl flex items-center gap-3 text-xs text-[#5A7D9A] dark:text-[#7A9DBA] font-semibold mb-3 animate-pulse">
            <Search className="w-4 h-4 animate-spin" />
            <span>Searching index & memory...</span>
          </div>
        )}

        {/* Index & Memory Answer Summary Banner */}
        {textAnswer && (
          <div className="p-3.5 bg-[#5A7D9A]/10 border border-[#5A7D9A]/20 rounded-2xl mb-3 flex items-start gap-2.5 text-xs text-[#2D2A26] dark:text-[#E8E4E1] shadow-sm">
            <Search className="w-4.5 h-4.5 text-[#5A7D9A] dark:text-[#7A9DBA] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-[#5A7D9A] dark:text-[#7A9DBA]">
                Index & Memory Search:
              </span>
              <span>{textAnswer}</span>
            </div>
          </div>
        )}

        {/* RESULTS LIST */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {matchedItems.length === 0 ? (
            <div className="text-center py-12 bg-[#F2EDE9] dark:bg-[#2E2A25] rounded-3xl border border-dashed border-[#E8E4E1] dark:border-[#38332E] p-6">
              <Search className="w-10 h-10 text-[#8C847E] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#2D2A26] dark:text-[#E8E4E1]">
                No matching item found for "{query}"
              </p>
              <p className="text-xs text-[#8C847E] mt-1">
                Try searching with different keywords or voice.
              </p>
            </div>
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
                    "bg-white dark:bg-[#23201C] border-2 border-[#6B7E6D] dark:border-[#91A493] rounded-3xl p-4 shadow-md shadow-[#6B7E6D]/15 dark:shadow-none space-y-3 relative ring-2 ring-[#6B7E6D]/20";
                  titleClasses =
                    "text-xl font-extrabold text-[#2D2A26] dark:text-[#E8E4E1] hover:text-[#6B7E6D] dark:hover:text-[#91A493]";
                  imageClasses =
                    "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300";
                  badgeClasses =
                    "inline-flex items-center gap-1.5 text-xs font-extrabold text-white bg-[#6B7E6D] px-3 py-1 rounded-full shadow-sm mt-0.5";
                  badgeLabel = `🔥 #1 Best Match (${matchTypeLabel})`;
                  badgeIcon = <CheckCircle className="w-3.5 h-3.5 text-white" />;
                } else if (idx === 1) {
                  // 2nd Result (High Match)
                  containerClasses =
                    "bg-[#FAF8F5] dark:bg-[#201D1A] border border-[#6B7E6D]/40 dark:border-[#6B7E6D]/40 rounded-3xl p-4 shadow-sm opacity-90 saturate-90 hover:opacity-100 hover:saturate-100 transition-all duration-300 space-y-3";
                  titleClasses =
                    "text-lg font-bold text-[#3A3632] dark:text-[#DCD7D2] hover:text-[#6B7E6D] dark:hover:text-[#91A493]";
                  imageClasses =
                    "w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300";
                  badgeClasses =
                    "inline-flex items-center gap-1 text-[11px] font-bold text-[#586A5A] dark:text-[#91A493] bg-[#6B7E6D]/20 px-2.5 py-0.5 rounded-lg mt-0.5";
                  badgeLabel = `⚡ #2 Match (${matchTypeLabel})`;
                  badgeIcon = <CheckCircle className="w-3 h-3" />;
                } else if (idx === 2) {
                  // 3rd Result (Medium Match)
                  containerClasses =
                    "bg-[#F5F2EE] dark:bg-[#1C1A17] border border-[#8C847E]/35 dark:border-[#8C847E]/30 rounded-3xl p-4 opacity-70 saturate-75 hover:opacity-100 hover:saturate-100 transition-all duration-300 space-y-3";
                  titleClasses =
                    "text-base font-semibold text-[#5A544E] dark:text-[#B5AFA8] hover:text-[#2D2A26]";
                  imageClasses =
                    "w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300";
                  badgeClasses =
                    "inline-flex items-center gap-1 text-[11px] font-semibold text-[#7A736C] dark:text-[#A3B0A5] bg-[#8C847E]/20 px-2 py-0.5 rounded-md mt-0.5";
                  badgeLabel = `#3 Match (${matchTypeLabel})`;
                  badgeIcon = <Tag className="w-3 h-3" />;
                } else {
                  // 4th+ Result (Faded Secondary Match)
                  containerClasses =
                    "bg-[#F2EDE9]/60 dark:bg-[#181614]/60 border border-dashed border-[#8C847E]/25 dark:border-[#8C847E]/25 rounded-3xl p-4 opacity-45 saturate-50 hover:opacity-100 hover:saturate-100 transition-all duration-300 space-y-3";
                  titleClasses =
                    "text-base font-medium text-[#7A736C] dark:text-[#8C847E] hover:text-[#2D2A26]";
                  imageClasses =
                    "w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300";
                  badgeClasses =
                    "inline-flex items-center gap-1 text-[10px] font-medium text-[#8C847E] bg-[#8C847E]/10 px-2 py-0.5 rounded-md mt-0.5";
                  badgeLabel = `#${idx + 1} Faded Match`;
                  badgeIcon = <Tag className="w-3 h-3" />;
                }
              } else {
                // Default view (no query entered)
                containerClasses =
                  "bg-white dark:bg-[#23201C] border border-[#E8E4E1] dark:border-[#38332E] rounded-3xl p-4 shadow-sm hover:shadow-md transition-all space-y-3";
                titleClasses =
                  "text-lg font-bold text-[#2D2A26] dark:text-[#E8E4E1] hover:text-[#6B7E6D] dark:hover:text-[#91A493]";
                imageClasses =
                  "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300";
                badgeClasses =
                  "inline-flex items-center gap-1 text-[11px] font-bold text-[#6B7E6D] dark:text-[#91A493] bg-[#6B7E6D]/15 px-2 py-0.5 rounded-md mt-0.5";
              }

              return (
                <div key={item.id} className={containerClasses}>
                  {/* Main Photo & Details */}
                  <div className="flex flex-col sm:flex-row gap-3.5">
                    <div
                      onClick={() => onSelectItem(item)}
                      className="sm:w-36 h-40 rounded-2xl overflow-hidden bg-[#F2EDE9] dark:bg-[#1E1B18] shrink-0 relative cursor-pointer group"
                    >
                      <img
                        src={item.image_path}
                        alt={item.name}
                        className={imageClasses}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 right-2 p-1.5 bg-[#2D2A26]/80 text-white rounded-xl backdrop-blur-md">
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
                            ? "bg-[#C2847A] text-white"
                            : "bg-[#F2EDE9] dark:bg-[#2E2A25] text-[#8C847E] hover:text-[#2D2A26]"
                        }`}
                        title={item.is_pinned ? "Unpin Item" : "Pin Item"}
                      >
                        <Pin className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    {/* Location Box */}
                    <div className="p-3 bg-[#F2EDE9] dark:bg-[#2E2A25] rounded-2xl border border-[#E8E4E1] dark:border-[#38332E]">
                      <p className="text-xs font-semibold text-[#8C847E] dark:text-[#A3B0A5] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#6B7E6D]" />
                        Last Saved Location:
                      </p>
                      <p className="text-sm font-bold text-[#2D2A26] dark:text-[#E8E4E1] leading-snug">
                        {item.location_name}
                      </p>
                    </div>

                    {/* Saved Time */}
                    <div className="flex flex-col gap-0.5 text-xs text-[#8C847E] dark:text-[#A3B0A5]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#6B7E6D]" />
                        <span>
                          Recorded Date: <strong className="text-[#2D2A26] dark:text-[#E8E4E1]">{formatFriendlyDateTime(item.created_at)}</strong>
                        </span>
                      </div>
                      {item.updated_at && item.updated_at !== item.created_at && (
                        <div className="text-[11px] text-[#8C847E] dark:text-[#A3B0A5] pl-5">
                          Last Updated: {formatFriendlyDateTime(item.updated_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ITEM HISTORY SECTION */}
                {item.history && item.history.length > 0 && (
                  <div className="pt-2 border-t border-[#E8E4E1] dark:border-[#38332E]">
                    <p className="text-xs font-bold text-[#8C847E] dark:text-[#A3B0A5] uppercase tracking-wider mb-2 flex items-center gap-1">
                      <History className="w-3.5 h-3.5 text-[#5A7D9A]" />
                      Previous Locations ({item.history.length}):
                    </p>
                    <div className="space-y-1.5 pl-2 border-l-2 border-[#5A7D9A]">
                      {item.history.map((hist) => (
                        <div key={hist.id} className="text-xs">
                          <p className="font-semibold text-[#2D2A26] dark:text-[#E8E4E1]">
                            {hist.location_name}
                          </p>
                          <p className="text-[10px] text-[#8C847E]">
                            {formatFriendlyDateTime(hist.saved_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Action Row */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E8E4E1] dark:border-[#38332E] text-xs">
                  <button
                    onClick={() => onRememberNewSpot(item)}
                    className="px-3 py-1.5 bg-[#6B7E6D] hover:bg-[#586A5A] text-white font-bold rounded-xl flex items-center gap-1 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Update Spot</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectItem(item)}
                      className="px-3 py-1.5 bg-[#F2EDE9] dark:bg-[#2E2A25] hover:bg-[#E8E4E1] text-[#4A443F] dark:text-[#E8E4E1] font-semibold rounded-xl flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {deletingItemId === item.id ? (
                      <div className="flex items-center gap-1.5 p-1 bg-[#C2847A]/10 border border-[#C2847A]/30 rounded-xl">
                        <span className="text-[11px] font-bold text-[#C2847A] px-1">Are you sure?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteItem(item.id);
                            setMatchedItems((prev) => prev.filter((m) => m.item.id !== item.id));
                            setDeletingItemId(null);
                          }}
                          className="px-2 py-1 bg-[#C2847A] hover:bg-[#A86E64] text-white text-[11px] font-bold rounded-lg shadow"
                        >
                          Yes, Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingItemId(null)}
                          className="px-2 py-1 bg-[#F2EDE9] dark:bg-[#2E2A25] text-[#4A443F] dark:text-[#E8E4E1] text-[11px] font-semibold rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingItemId(item.id)}
                        className="p-1.5 text-[#C2847A] hover:bg-[#C2847A]/10 rounded-xl"
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
        </div>
      </div>
    </div>
  );
};
