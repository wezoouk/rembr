import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  HandHeart,
  User,
  Calendar,
  Bell,
  BellOff,
  Check,
  CheckCircle2,
  Trash2,
  Clock,
  AlertCircle,
  RotateCcw,
  Mic,
  MicOff,
} from "lucide-react";
import { BorrowedItem, ReminderInterval } from "../types";
import { computeNextReminderAt } from "../lib/storage";
import { scheduleBorrowedReminder, cancelBorrowedReminder } from "../lib/notifications";
import { VoiceListener, isSpeechRecognitionSupported } from "../lib/speech";
import { DictationIndicator } from "./DictationIndicator";

// Intelligent phrase parsing for voice dictation, e.g. "lent my sander to John"
function parseSpokenBorrowPhrase(phrase: string): { item?: string; person?: string } {
  const clean = phrase.trim().replace(/^(i lent|i loaned|i borrowed out|lent|loaned|borrowed out|borrowed my|my)\s+/i, "");
  const prepRegex = /\s+(to|out to|over to)\s+/i;
  const match = clean.match(prepRegex);

  if (match && match.index !== undefined) {
    const item = clean.slice(0, match.index).trim();
    const person = clean.slice(match.index + match[0].length).trim();
    if (item && person) {
      return {
        item: item.charAt(0).toUpperCase() + item.slice(1),
        person: person.charAt(0).toUpperCase() + person.slice(1),
      };
    }
  }

  return { item: clean.charAt(0).toUpperCase() + clean.slice(1) };
}

interface BorrowedModalProps {
  onClose: () => void;
  borrowedItems: BorrowedItem[];
  onSave: (item: BorrowedItem) => void;
  onUpdate: (item: BorrowedItem) => void;
  onDelete: (id: string) => void;
}

const REMINDER_OPTIONS: { value: ReminderInterval; label: string }[] = [
  { value: "3days", label: "3 days" },
  { value: "1week", label: "1 week" },
  { value: "2weeks", label: "2 weeks" },
  { value: "none", label: "No reminder" },
];

function todayDateInputValue(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function reminderStatus(item: BorrowedItem): { label: string; overdue: boolean; none: boolean } {
  if (item.reminder_interval === "none" || !item.next_reminder_at) {
    return { label: "No reminder set", overdue: false, none: true };
  }
  const due = new Date(item.next_reminder_at).getTime();
  const now = Date.now();
  if (due <= now) {
    const daysOverdue = Math.max(1, Math.floor((now - due) / 86400000));
    return {
      label: `Overdue reminder — ${item.borrowed_to} still has it`,
      overdue: true,
      none: false,
    };
  }
  const daysUntil = Math.ceil((due - now) / 86400000);
  return {
    label: `Reminder in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
    overdue: false,
    none: false,
  };
}

export const BorrowedModal: React.FC<BorrowedModalProps> = ({
  onClose,
  borrowedItems,
  onSave,
  onUpdate,
  onDelete,
}) => {
  const [itemName, setItemName] = useState("");
  const [borrowedTo, setBorrowedTo] = useState("");
  const [dateBorrowed, setDateBorrowed] = useState(todayDateInputValue());

  const [pendingItem, setPendingItem] = useState<BorrowedItem | null>(null);
  const [showReturned, setShowReturned] = useState(false);
  const [changingReminderFor, setChangingReminderFor] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Voice dictation
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [listeningTarget, setListeningTarget] = useState<"both" | "item" | "person" | null>(null);
  const voiceListenerRef = useRef<VoiceListener | null>(null);
  const activeTargetRef = useRef<"both" | "item" | "person" | null>(null);
  activeTargetRef.current = listeningTarget;

  useEffect(() => {
    if (isSpeechRecognitionSupported()) {
      voiceListenerRef.current = new VoiceListener(
        (transcript, isFinal) => {
          const target = activeTargetRef.current;
          if (target === "person") {
            setBorrowedTo(transcript);
          } else if (target === "item") {
            setItemName(transcript);
          } else {
            const parsed = parseSpokenBorrowPhrase(transcript);
            if (parsed.item) setItemName(parsed.item);
            if (parsed.person) setBorrowedTo(parsed.person);
          }
          if (isFinal) {
            setIsListening(false);
            setListeningTarget(null);
          }
        },
        () => {
          setIsListening(false);
          setListeningTarget(null);
        },
        () => {
          setIsListening(false);
          setListeningTarget(null);
        },
        (level) => setAudioLevel(level)
      );
    }
    return () => {
      if (voiceListenerRef.current) voiceListenerRef.current.stop();
    };
  }, []);

  const toggleVoiceInput = async (target: "both" | "item" | "person" = "both") => {
    if (!voiceListenerRef.current) {
      alert("Voice speech recognition is not supported on this browser.");
      return;
    }
    if (isListening) {
      voiceListenerRef.current.stop();
      setIsListening(false);
      setListeningTarget(null);
    } else {
      setListeningTarget(target);
      setIsListening(true);
      await voiceListenerRef.current.start();
    }
  };

  const activeItems = useMemo(
    () =>
      borrowedItems
        .filter((i) => !i.is_returned)
        .sort((a, b) => {
          const aTime = a.next_reminder_at ? new Date(a.next_reminder_at).getTime() : Infinity;
          const bTime = b.next_reminder_at ? new Date(b.next_reminder_at).getTime() : Infinity;
          return aTime - bTime;
        }),
    [borrowedItems]
  );
  const returnedItems = useMemo(
    () => borrowedItems.filter((i) => i.is_returned),
    [borrowedItems]
  );

  const overdueCount = activeItems.filter((i) => reminderStatus(i).overdue).length;

  const resetForm = () => {
    setItemName("");
    setBorrowedTo("");
    setDateBorrowed(todayDateInputValue());
  };

  const handleStartSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !borrowedTo.trim()) return;

    if (voiceListenerRef.current && isListening) {
      voiceListenerRef.current.stop();
      setIsListening(false);
      setListeningTarget(null);
    }

    const nowIso = new Date().toISOString();
    const borrowedIso = new Date(dateBorrowed + "T12:00:00").toISOString();

    const draft: BorrowedItem = {
      id: `borrowed-${Date.now()}`,
      item_name: itemName.trim(),
      borrowed_to: borrowedTo.trim(),
      date_borrowed: borrowedIso,
      reminder_interval: "1week",
      is_returned: false,
      created_at: nowIso,
      updated_at: nowIso,
    };

    // Ask which reminder cadence they want before actually saving.
    setPendingItem(draft);
  };

  const finalizeSaveWithReminder = async (interval: ReminderInterval) => {
    if (!pendingItem) return;
    const next_reminder_at = computeNextReminderAt(pendingItem.date_borrowed, interval);
    const finalItem: BorrowedItem = {
      ...pendingItem,
      reminder_interval: interval,
      next_reminder_at,
    };
    onSave(finalItem);
    await scheduleBorrowedReminder(finalItem);
    setPendingItem(null);
    resetForm();
  };

  const handleMarkReturned = async (item: BorrowedItem) => {
    const updated: BorrowedItem = {
      ...item,
      is_returned: true,
      returned_at: new Date().toISOString(),
    };
    onUpdate(updated);
    await cancelBorrowedReminder(item.id);
  };

  const handleUnreturn = async (item: BorrowedItem) => {
    const updated: BorrowedItem = { ...item, is_returned: false, returned_at: undefined };
    onUpdate(updated);
    await scheduleBorrowedReminder(updated);
  };

  const handleChangeReminder = async (item: BorrowedItem, interval: ReminderInterval) => {
    const next_reminder_at = computeNextReminderAt(item.date_borrowed, interval, new Date().toISOString());
    const updated: BorrowedItem = { ...item, reminder_interval: interval, next_reminder_at };
    onUpdate(updated);
    await scheduleBorrowedReminder(updated);
    setChangingReminderFor(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#262624]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#2B2A28] border border-[#E5E3DA] dark:border-[#3E3D3A] rounded-[32px] max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* REMINDER CHOICE OVERLAY (shown right after Save) */}
        {pendingItem && (
          <div className="absolute inset-0 z-50 bg-white/95 dark:bg-[#2B2A28]/95 backdrop-blur-md p-6 flex flex-col justify-center animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-[#D97757]/15 text-[#D97757] flex items-center justify-center mb-4 mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-center text-[#30302E] dark:text-[#E5E3DA] mb-2">
              Set a Reminder?
            </h3>
            <p className="text-sm text-center text-[#83827C] dark:text-[#A8A7A2] mb-5">
              Get nudged that <span className="font-bold text-[#30302E] dark:text-[#E5E3DA]">{pendingItem.borrowed_to}</span> still has your{" "}
              <span className="font-bold text-[#30302E] dark:text-[#E5E3DA]">{pendingItem.item_name}</span>. You'll keep getting reminded daily until you mark it returned or turn reminders off.
            </p>

            <div className="space-y-2">
              {REMINDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => finalizeSaveWithReminder(opt.value)}
                  className={`w-full py-3 px-4 font-bold rounded-2xl text-sm shadow-sm transition-all flex items-center justify-center gap-2 ${
                    opt.value === "none"
                      ? "bg-[#EFEEE7] dark:bg-[#33322F] hover:bg-[#E5E3DA] dark:hover:bg-[#3E3D3A] text-[#44433F] dark:text-[#E5E3DA]"
                      : "bg-[#D97757] hover:bg-[#C15F3C] text-white"
                  }`}
                >
                  {opt.value === "none" ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  <span>{opt.value === "none" ? "No reminder" : `Remind me in ${opt.label}`}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E5E3DA] dark:border-[#3E3D3A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#D97757]/10 text-[#D97757] dark:text-[#E8A785] flex items-center justify-center">
              <HandHeart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#30302E] dark:text-[#E5E3DA] leading-tight">
                Borrowed Items
              </h2>
              <p className="text-xs text-[#83827C] dark:text-[#A8A7A2]">
                Track what you've lent out
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#83827C] hover:text-[#30302E] dark:hover:text-white rounded-xl hover:bg-[#EFEEE7] dark:hover:bg-[#33322F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto py-4 space-y-5 pr-1 flex-1">
          {/* ADD FORM */}
          <form onSubmit={handleStartSave} className="space-y-3 p-4 bg-[#D97757]/8 border border-[#D97757]/25 rounded-2xl">
            {/* VOICE / DICTATION FAST BANNER */}
            <div className="p-3.5 bg-[#D97757]/10 border border-[#D97757]/30 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#D97757] dark:text-[#E8A785] uppercase tracking-wider flex items-center gap-1.5">
                  <Mic className="w-4 h-4" /> Speak Full Phrase
                </span>
                <button
                  type="button"
                  onClick={() => toggleVoiceInput("both")}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm select-none active:scale-95 cursor-pointer ${
                    isListening && listeningTarget === "both"
                      ? "bg-[#D97757] text-white animate-bounce"
                      : "bg-[#D97757] text-white hover:bg-[#C15F3C]"
                  }`}
                >
                  {isListening && listeningTarget === "both" ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Listening...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Tap to Dictate</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-[#44433F] dark:text-[#A8A7A2]">
                Say e.g., <span className="italic font-medium text-[#30302E] dark:text-[#E5E3DA]">"Lent my sander to John"</span>
              </p>
            </div>

            <DictationIndicator
              isListening={isListening}
              transcript={
                listeningTarget === "item"
                  ? itemName
                  : listeningTarget === "person"
                  ? borrowedTo
                  : `${itemName} ${borrowedTo}`.trim()
              }
              audioLevel={audioLevel}
              onStop={() => toggleVoiceInput(listeningTarget || "both")}
              label={
                listeningTarget === "item"
                  ? "Listening for Item Name..."
                  : listeningTarget === "person"
                  ? "Listening for Person's Name..."
                  : "Listening for Item & Person Phrase..."
              }
            />

            <div>
              <label className="block text-xs font-bold text-[#83827C] dark:text-[#A8A7A2] uppercase tracking-wider mb-1.5">
                Item *
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder='e.g., "Sander", "Grill"'
                  className="w-full py-3 pl-4 pr-12 text-base font-semibold text-[#30302E] dark:text-[#E5E3DA] bg-white dark:bg-[#33322F] border border-[#E5E3DA] dark:border-[#3E3D3A] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757]"
                />
                <button
                  type="button"
                  onClick={() => toggleVoiceInput("item")}
                  className={`absolute right-2 p-2.5 rounded-xl transition-all select-none active:scale-95 cursor-pointer ${
                    isListening && listeningTarget === "item"
                      ? "bg-[#D97757] text-white animate-bounce"
                      : "bg-[#EFEEE7] dark:bg-[#3E3D3A] text-[#44433F] dark:text-[#E5E3DA] hover:bg-[#E5E3DA]"
                  }`}
                  title="Tap to dictate item name"
                >
                  {isListening && listeningTarget === "item" ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#83827C] dark:text-[#A8A7A2] uppercase tracking-wider mb-1.5">
                Borrowed To *
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-[#D97757] absolute left-3.5 shrink-0" />
                <input
                  type="text"
                  value={borrowedTo}
                  onChange={(e) => setBorrowedTo(e.target.value)}
                  placeholder="Person's name"
                  className="w-full py-3 pl-10 pr-12 text-sm font-semibold text-[#30302E] dark:text-[#E5E3DA] bg-white dark:bg-[#33322F] border border-[#E5E3DA] dark:border-[#3E3D3A] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757]"
                />
                <button
                  type="button"
                  onClick={() => toggleVoiceInput("person")}
                  className={`absolute right-2 p-2 rounded-xl transition-all select-none active:scale-95 cursor-pointer ${
                    isListening && listeningTarget === "person"
                      ? "bg-[#D97757] text-white animate-bounce"
                      : "bg-[#EFEEE7] dark:bg-[#3E3D3A] text-[#44433F] dark:text-[#E5E3DA] hover:bg-[#E5E3DA]"
                  }`}
                  title="Tap to dictate person's name"
                >
                  {isListening && listeningTarget === "person" ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#83827C] dark:text-[#A8A7A2] uppercase tracking-wider mb-1.5">
                Date Borrowed
              </label>
              <div className="relative flex items-center">
                <Calendar className="w-4 h-4 text-[#D97757] absolute left-3.5 shrink-0 pointer-events-none" />
                <input
                  type="date"
                  value={dateBorrowed}
                  onChange={(e) => setDateBorrowed(e.target.value)}
                  className="w-full py-3 pl-10 pr-4 text-sm font-semibold text-[#30302E] dark:text-[#E5E3DA] bg-white dark:bg-[#33322F] border border-[#E5E3DA] dark:border-[#3E3D3A] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97757]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!itemName.trim() || !borrowedTo.trim()}
              className="w-full py-3 px-4 bg-[#D97757] hover:bg-[#C15F3C] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <Check className="w-5 h-5" />
              <span>Save Borrowed Item</span>
            </button>
          </form>

          {/* OVERDUE BANNER */}
          {overdueCount > 0 && (
            <div className="p-3.5 bg-[#D97757]/15 border-2 border-[#D97757] rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[#D97757] shrink-0" />
              <p className="text-xs font-bold text-[#C15F3C] dark:text-[#E8A785]">
                {overdueCount} item{overdueCount === 1 ? "" : "s"} overdue for a reminder — someone still has your stuff!
              </p>
            </div>
          )}

          {/* ACTIVE BORROWED LIST */}
          <div className="space-y-2.5">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[#83827C] dark:text-[#A8A7A2] flex items-center gap-1.5">
              <HandHeart className="w-3.5 h-3.5 text-[#D97757]" />
              Currently Borrowed ({activeItems.length})
            </h3>

            {activeItems.length === 0 ? (
              <div className="text-center py-8 bg-[#EFEEE7] dark:bg-[#1F1E1C] rounded-2xl border border-dashed border-[#E5E3DA] dark:border-[#3E3D3A]">
                <p className="text-sm font-semibold text-[#44433F] dark:text-[#E5E3DA]">
                  Nothing out on loan
                </p>
                <p className="text-xs text-[#83827C] mt-1">
                  Add an item above when you lend something out.
                </p>
              </div>
            ) : (
              activeItems.map((item) => {
                const status = reminderStatus(item);
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 bg-white dark:bg-[#2B2A28] border rounded-2xl shadow-sm relative overflow-hidden ${
                      status.overdue
                        ? "border-[#D97757]"
                        : "border-[#E5E3DA] dark:border-[#3E3D3A]"
                    }`}
                  >
                    {deletingId === item.id ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#D97757]">Delete this record?</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              onDelete(item.id);
                              cancelBorrowedReminder(item.id);
                              setDeletingId(null);
                            }}
                            className="px-2.5 py-1 bg-[#D97757] hover:bg-[#C15F3C] text-white text-xs font-bold rounded-xl"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-2.5 py-1 bg-[#EFEEE7] dark:bg-[#33322F] text-[#44433F] dark:text-[#E5E3DA] text-xs font-semibold rounded-xl"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-[#30302E] dark:text-[#E5E3DA] truncate">
                              {item.item_name}
                            </h4>
                            <p className="text-xs text-[#D97757] dark:text-[#E8A785] font-semibold flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3 shrink-0" />
                              {item.borrowed_to}
                            </p>
                            <p className="text-[11px] text-[#83827C] dark:text-[#A8A7A2] flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 shrink-0" />
                              Borrowed {formatDate(item.date_borrowed)}
                            </p>
                          </div>
                          <button
                            onClick={() => setDeletingId(item.id)}
                            className="p-1.5 rounded-lg text-[#83827C] hover:text-[#D97757] hover:bg-[#D97757]/10 transition-colors shrink-0"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div
                          className={`mt-2.5 text-[11px] font-bold px-2.5 py-1.5 rounded-xl inline-flex items-center gap-1.5 ${
                            status.overdue
                              ? "bg-[#D97757]/15 text-[#C15F3C] dark:text-[#E8A785]"
                              : status.none
                              ? "bg-[#EFEEE7] dark:bg-[#33322F] text-[#83827C] dark:text-[#A8A7A2]"
                              : "bg-[#D97757]/10 text-[#D97757] dark:text-[#E8A785]"
                          }`}
                        >
                          {status.none ? <BellOff className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                          <span>{status.label}</span>
                        </div>

                        {changingReminderFor === item.id ? (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {REMINDER_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handleChangeReminder(item, opt.value)}
                                className="px-2.5 py-1 bg-[#EFEEE7] dark:bg-[#33322F] hover:bg-[#E5E3DA] dark:hover:bg-[#3E3D3A] text-[#44433F] dark:text-[#E5E3DA] text-[11px] font-semibold rounded-lg"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-2.5 flex items-center gap-2">
                            <button
                              onClick={() => handleMarkReturned(item)}
                              className="flex-1 py-2 px-3 bg-[#D97757] hover:bg-[#C15F3C] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Returned</span>
                            </button>
                            <button
                              onClick={() => setChangingReminderFor(item.id)}
                              className="py-2 px-3 bg-[#EFEEE7] dark:bg-[#33322F] hover:bg-[#E5E3DA] dark:hover:bg-[#3E3D3A] text-[#44433F] dark:text-[#E5E3DA] text-xs font-semibold rounded-xl transition-all"
                            >
                              Change Reminder
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* RETURNED (COLLAPSED) */}
          {returnedItems.length > 0 && (
            <div className="space-y-2.5">
              <button
                onClick={() => setShowReturned((v) => !v)}
                className="text-xs uppercase tracking-widest font-bold text-[#83827C] dark:text-[#A8A7A2] hover:underline flex items-center gap-1.5"
              >
                Returned ({returnedItems.length}) {showReturned ? "▲" : "▼"}
              </button>
              {showReturned &&
                returnedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#EFEEE7] dark:bg-[#1F1E1C] border border-[#E5E3DA] dark:border-[#3E3D3A] rounded-2xl flex items-center justify-between gap-2 opacity-75"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-[#44433F] dark:text-[#E5E3DA] truncate">
                        {item.item_name} <span className="font-normal text-[#83827C]">from {item.borrowed_to}</span>
                      </h4>
                      <p className="text-[10px] text-[#83827C] mt-0.5">
                        Returned {item.returned_at ? formatDate(item.returned_at) : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleUnreturn(item)}
                        className="p-1.5 rounded-lg text-[#83827C] hover:text-[#D97757] hover:bg-[#D97757]/10 transition-colors"
                        title="Not returned yet — undo"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 rounded-lg text-[#83827C] hover:text-[#D97757] hover:bg-[#D97757]/10 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
