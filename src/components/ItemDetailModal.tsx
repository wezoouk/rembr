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
    <div className="fixed inset-0 z-50 bg-[#161412]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#211F1B] rounded-[32px] max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E5E3DA] dark:border-[#3E3D3A] shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#30302E] dark:text-[#E5E3DA] truncate">
              {isEditing ? "Edit Item Details" : item.name}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={togglePin}
              className={`p-2 rounded-xl transition-colors ${
                item.is_pinned
                  ? "bg-[#7CA65B] text-white"
                  : "bg-[#EFEEE7] dark:bg-[#1E1C19] text-[#83827C] hover:text-[#30302E]"
              }`}
              title={item.is_pinned ? "Pinned Favorite" : "Pin to Favorites"}
            >
              <Pin className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#83827C] hover:text-[#30302E] dark:hover:text-white rounded-xl hover:bg-[#EFEEE7] dark:hover:bg-[#1E1C19] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto py-4 space-y-4 pr-1 flex-1">
          {/* Main Photo View */}
          <div className="rounded-2xl overflow-hidden bg-[#EFEEE7] dark:bg-[#100F0D] relative flex items-center justify-center">
            <img
              src={item.image_path}
              alt={item.name}
              className="w-full max-h-[60vh] object-contain"
            />
            {item.space_name && (
              <span className="absolute bottom-3 left-3 bg-[#7CA65B] text-white text-xs font-bold px-3 py-1 rounded-xl shadow-md">
                Part of: {item.space_name}
              </span>
            )}
          </div>

          {!isEditing ? (
            /* VIEW MODE */
            <div className="space-y-4">
              {/* Location Card */}
              <div className="p-4 bg-[#7CA65B]/10 border border-[#7CA65B]/20 rounded-2xl space-y-1">
                <p className="text-xs font-bold text-[#7CA65B] dark:text-[#A8C98B] uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 shrink-0" />
                  Current Location
                </p>
                <p className="text-base font-bold text-[#30302E] dark:text-[#E5E3DA]">
                  {item.location_name}
                </p>
                {item.description && (
                  <p className="text-xs text-[#44433F] dark:text-[#A8A7A2] pt-1">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Saved Time & Confidence */}
              <div className="flex flex-col gap-2 p-3 bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-2xl text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#83827C] dark:text-[#A8A7A2] flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#7CA65B]" />
                    <span>Recorded Date: <strong className="text-[#30302E] dark:text-[#E5E3DA]">{formatFriendlyDateTime(item.created_at)}</strong></span>
                  </span>
                  <span className="font-bold text-[#7CA65B] dark:text-[#A8C98B]">
                    {item.confidence}
                  </span>
                </div>
                {item.updated_at && item.updated_at !== item.created_at && (
                  <div className="text-[11px] text-[#83827C] dark:text-[#A8A7A2] pl-5 border-t border-[#E5E3DA] dark:border-[#3E3D3A] pt-1.5">
                    Last Updated / Re-stored: <strong>{formatFriendlyDateTime(item.updated_at)}</strong>
                  </div>
                )}
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[#83827C] dark:text-[#A8A7A2] uppercase tracking-wider mb-2">
                    Tags:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-[#EFEEE7] dark:bg-[#1E1C19] text-[#44433F] dark:text-[#E5E3DA] rounded-lg text-xs font-medium"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* LOCATION HISTORY TIMELINE */}
              {item.history && item.history.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#E5E3DA] dark:border-[#3E3D3A]">
                  <h3 className="text-xs font-bold text-[#83827C] dark:text-[#A8A7A2] uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-[#7CA65B]" />
                    Previous Saved Locations ({item.history.length})
                  </h3>
                  <div className="space-y-2 pl-3 border-l-2 border-[#7CA65B]">
                    {item.history.map((hist) => (
                      <div
                        key={hist.id}
                        className="p-2.5 bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-xl text-xs space-y-0.5"
                      >
                        <p className="font-bold text-[#30302E] dark:text-[#E5E3DA]">
                          {hist.location_name}
                        </p>
                        <p className="text-[10px] text-[#83827C]">
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
                <label className="block text-xs font-bold text-[#83827C] dark:text-[#A8A7A2] uppercase tracking-wider mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full py-2.5 px-3.5 text-sm font-semibold text-[#30302E] dark:text-[#E5E3DA] bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7CA65B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#83827C] dark:text-[#A8A7A2] uppercase tracking-wider mb-1">
                  Location Name
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full py-2.5 pl-3.5 pr-11 text-sm text-[#30302E] dark:text-[#E5E3DA] bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7CA65B]"
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
                        ? "bg-[#7CA65B] text-white animate-bounce"
                        : "bg-[#E5E3DA] dark:bg-[#3E3D3A] text-[#44433F] dark:text-[#E5E3DA] hover:bg-[#EFEEE7]"
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
                <label className="block text-xs font-bold text-[#83827C] dark:text-[#A8A7A2] uppercase tracking-wider mb-1">
                  Description / Notes
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full py-2.5 px-3.5 text-sm text-[#30302E] dark:text-[#E5E3DA] bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7CA65B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#83827C] dark:text-[#A8A7A2] uppercase tracking-wider mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full py-2.5 px-3.5 text-sm text-[#30302E] dark:text-[#E5E3DA] bg-[#EFEEE7] dark:bg-[#1E1C19] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7CA65B]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3.5 border-t border-[#E5E3DA] dark:border-[#3E3D3A] shrink-0 flex items-center justify-between gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => {
                  onClose();
                  onRememberNewSpot(item);
                }}
                className="py-3 px-4 bg-[#7CA65B] hover:bg-[#6B9149] text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Remember New Spot</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-3 bg-[#EFEEE7] dark:bg-[#1E1C19] hover:bg-[#E5E3DA] text-[#44433F] dark:text-[#E5E3DA] rounded-2xl text-xs font-semibold flex items-center gap-1"
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
                  className="p-3 text-[#7CA65B] hover:bg-[#7CA65B]/10 rounded-2xl text-xs font-semibold"
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
                className="py-3 px-4 bg-[#EFEEE7] dark:bg-[#1E1C19] hover:bg-[#E5E3DA] text-[#44433F] dark:text-[#E5E3DA] font-semibold rounded-2xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="py-3 px-5 bg-[#7CA65B] hover:bg-[#6B9149] text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md"
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
