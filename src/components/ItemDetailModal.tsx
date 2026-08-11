import React, { useState, useRef, useEffect } from "react";
import {
  X,
  MapPin,
  Clock,
  Pin,
  History,
  Trash2,
  Edit3,
  Check,
  RotateCcw,
  Tag,
  ShieldCheck,
  Mic,
  MicOff,
} from "lucide-react";
import { Item, ConfidenceLevel } from "../types";
import { formatFriendlyDateTime } from "../lib/imageUtils";
import { VoiceListener, isSpeechRecognitionSupported } from "../lib/speech";
import { DictationIndicator } from "./DictationIndicator";

interface ItemDetailModalProps {
  item: Item;
  onClose: () => void;
  onUpdate: (updatedItem: Item) => void;
  onDelete: (id: string) => void;
  onRememberNewSpot: (item: Item) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onUpdate,
  onDelete,
  onRememberNewSpot,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [locationName, setLocationName] = useState(item.location_name);
  const [description, setDescription] = useState(item.description || "");
  const [tagsInput, setTagsInput] = useState((item.tags || []).join(", "));
  const [confidence, setConfidence] = useState<ConfidenceLevel>(item.confidence);
  const [isListening, setIsListening] = useState(false);

  const voiceListenerRef = useRef<VoiceListener | null>(null);

  useEffect(() => {
    if (isSpeechRecognitionSupported()) {
      voiceListenerRef.current = new VoiceListener(
        (transcript, isFinal) => {
          setLocationName(transcript);
          if (isFinal) setIsListening(false);
        },
        () => setIsListening(false),
        () => setIsListening(false)
      );
    }
    return () => {
      if (voiceListenerRef.current) voiceListenerRef.current.stop();
    };
  }, []);

  const toggleLocationDictation = () => {
    if (!voiceListenerRef.current) {
      alert("Voice speech recognition is not supported on this browser.");
      return;
    }
    if (isListening) {
      voiceListenerRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      voiceListenerRef.current.start();
    }
  };

  const handleStartHoldDictate = () => {
    if (voiceListenerRef.current && !isListening) {
      setIsListening(true);
      voiceListenerRef.current.start();
    }
  };

  const handleEndHoldDictate = () => {
    if (voiceListenerRef.current && isListening) {
      voiceListenerRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSaveEdit = () => {
    const updatedTags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const updatedItem: Item = {
      ...item,
      name: name.trim() || item.name,
      location_name: locationName.trim() || item.location_name,
      description: description.trim(),
      tags: updatedTags.length > 0 ? updatedTags : item.tags,
      confidence,
      updated_at: new Date().toISOString(),
    };

    onUpdate(updatedItem);
    setIsEditing(false);
  };

  const togglePin = () => {
    const updatedItem: Item = { ...item, is_pinned: !item.is_pinned };
    onUpdate(updatedItem);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1816]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#23201C] border border-[#E8E4E1] dark:border-[#38332E] rounded-[32px] max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E4E1] dark:border-[#38332E] shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#2D2A26] dark:text-[#E8E4E1] truncate">
              {isEditing ? "Edit Item Details" : item.name}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={togglePin}
              className={`p-2 rounded-xl transition-colors ${
                item.is_pinned
                  ? "bg-[#C2847A] text-white"
                  : "bg-[#F2EDE9] dark:bg-[#2E2A25] text-[#8C847E] hover:text-[#2D2A26]"
              }`}
              title={item.is_pinned ? "Pinned Favorite" : "Pin to Favorites"}
            >
              <Pin className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#8C847E] hover:text-[#2D2A26] dark:hover:text-white rounded-xl hover:bg-[#F2EDE9] dark:hover:bg-[#2E2A25] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto py-4 space-y-4 pr-1 flex-1">
          {/* Main Photo View */}
          <div className="rounded-2xl overflow-hidden bg-[#F2EDE9] dark:bg-[#1E1B18] border border-[#E8E4E1] dark:border-[#38332E] relative flex items-center justify-center">
            <img
              src={item.image_path}
              alt={item.name}
              className="w-full max-h-[60vh] object-contain"
            />
            {item.space_name && (
              <span className="absolute bottom-3 left-3 bg-[#C2847A] text-white text-xs font-bold px-3 py-1 rounded-xl shadow-md">
                Part of: {item.space_name}
              </span>
            )}
          </div>

          {!isEditing ? (
            /* VIEW MODE */
            <div className="space-y-4">
              {/* Location Card */}
              <div className="p-4 bg-[#6B7E6D]/10 border border-[#6B7E6D]/20 rounded-2xl space-y-1">
                <p className="text-xs font-bold text-[#6B7E6D] dark:text-[#91A493] uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 shrink-0" />
                  Current Location
                </p>
                <p className="text-base font-bold text-[#2D2A26] dark:text-[#E8E4E1]">
                  {item.location_name}
                </p>
                {item.description && (
                  <p className="text-xs text-[#4A443F] dark:text-[#A3B0A5] pt-1">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Saved Time & Confidence */}
              <div className="flex flex-col gap-2 p-3 bg-[#F2EDE9] dark:bg-[#2E2A25] rounded-2xl text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#8C847E] dark:text-[#A3B0A5] flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#6B7E6D]" />
                    <span>Recorded Date: <strong className="text-[#2D2A26] dark:text-[#E8E4E1]">{formatFriendlyDateTime(item.created_at)}</strong></span>
                  </span>
                  <span className="font-bold text-[#6B7E6D] dark:text-[#91A493]">
                    {item.confidence}
                  </span>
                </div>
                {item.updated_at && item.updated_at !== item.created_at && (
                  <div className="text-[11px] text-[#8C847E] dark:text-[#A3B0A5] pl-5 border-t border-[#E8E4E1] dark:border-[#38332E] pt-1.5">
                    Last Updated / Re-stored: <strong>{formatFriendlyDateTime(item.updated_at)}</strong>
                  </div>
                )}
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[#8C847E] dark:text-[#A3B0A5] uppercase tracking-wider mb-2">
                    Tags:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-[#F2EDE9] dark:bg-[#2E2A25] text-[#4A443F] dark:text-[#E8E4E1] rounded-lg text-xs font-medium"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* LOCATION HISTORY TIMELINE */}
              {item.history && item.history.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#E8E4E1] dark:border-[#38332E]">
                  <h3 className="text-xs font-bold text-[#8C847E] dark:text-[#A3B0A5] uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-[#5A7D9A]" />
                    Previous Saved Locations ({item.history.length})
                  </h3>
                  <div className="space-y-2 pl-3 border-l-2 border-[#5A7D9A]">
                    {item.history.map((hist) => (
                      <div
                        key={hist.id}
                        className="p-2.5 bg-[#F2EDE9] dark:bg-[#2E2A25] rounded-xl text-xs space-y-0.5"
                      >
                        <p className="font-bold text-[#2D2A26] dark:text-[#E8E4E1]">
                          {hist.location_name}
                        </p>
                        <p className="text-[10px] text-[#8C847E]">
                          Saved: {formatFriendlyDateTime(hist.saved_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* EDIT MODE FORM */
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#8C847E] dark:text-[#A3B0A5] uppercase tracking-wider mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full py-2.5 px-3.5 text-sm font-semibold text-[#2D2A26] dark:text-[#E8E4E1] bg-[#F2EDE9] dark:bg-[#2E2A25] border border-[#E8E4E1] dark:border-[#38332E] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B7E6D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8C847E] dark:text-[#A3B0A5] uppercase tracking-wider mb-1">
                  Location Name
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full py-2.5 pl-3.5 pr-11 text-sm text-[#2D2A26] dark:text-[#E8E4E1] bg-[#F2EDE9] dark:bg-[#2E2A25] border border-[#E8E4E1] dark:border-[#38332E] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B7E6D]"
                  />
                  <button
                    type="button"
                    onClick={toggleLocationDictation}
                    onMouseDown={handleStartHoldDictate}
                    onMouseUp={handleEndHoldDictate}
                    onTouchStart={handleStartHoldDictate}
                    onTouchEnd={handleEndHoldDictate}
                    className={`absolute right-1.5 p-1.5 rounded-lg transition-all select-none active:scale-95 ${
                      isListening
                        ? "bg-[#C2847A] text-white animate-bounce"
                        : "bg-[#E8E4E1] dark:bg-[#38332E] text-[#4A443F] dark:text-[#E8E4E1] hover:bg-[#F2EDE9]"
                    }`}
                    title="Tap or hold to dictate location"
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <DictationIndicator
                  isListening={isListening}
                  transcript={locationName}
                  onStop={toggleLocationDictation}
                  label="Listening for Location Name..."
                  className="mt-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8C847E] dark:text-[#A3B0A5] uppercase tracking-wider mb-1">
                  Description / Notes
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full py-2.5 px-3.5 text-sm text-[#2D2A26] dark:text-[#E8E4E1] bg-[#F2EDE9] dark:bg-[#2E2A25] border border-[#E8E4E1] dark:border-[#38332E] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B7E6D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8C847E] dark:text-[#A3B0A5] uppercase tracking-wider mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full py-2.5 px-3.5 text-sm text-[#2D2A26] dark:text-[#E8E4E1] bg-[#F2EDE9] dark:bg-[#2E2A25] border border-[#E8E4E1] dark:border-[#38332E] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B7E6D]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3.5 border-t border-[#E8E4E1] dark:border-[#38332E] shrink-0 flex items-center justify-between gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => {
                  onClose();
                  onRememberNewSpot(item);
                }}
                className="py-3 px-4 bg-[#6B7E6D] hover:bg-[#586A5A] text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Remember New Spot</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-3 bg-[#F2EDE9] dark:bg-[#2E2A25] hover:bg-[#E8E4E1] text-[#4A443F] dark:text-[#E8E4E1] rounded-2xl text-xs font-semibold flex items-center gap-1"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${item.name}"?`)) {
                      onDelete(item.id);
                      onClose();
                    }
                  }}
                  className="p-3 text-[#C2847A] hover:bg-[#C2847A]/10 rounded-2xl text-xs font-semibold"
                  title="Delete Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="py-3 px-4 bg-[#F2EDE9] dark:bg-[#2E2A25] hover:bg-[#E8E4E1] text-[#4A443F] dark:text-[#E8E4E1] font-semibold rounded-2xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="py-3 px-5 bg-[#6B7E6D] hover:bg-[#586A5A] text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
