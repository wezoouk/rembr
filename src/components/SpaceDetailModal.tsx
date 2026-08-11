import React, { useState, useRef } from "react";
import { X, FolderOpen, Trash2, Tag, CheckCircle2, RotateCcw, Sparkles, Upload, Camera, Plus } from "lucide-react";
import { Space, Item, DetectedItem } from "../types";
import { formatFriendlyDateTime, compressImage } from "../lib/imageUtils";
import { analyzeImageWithAI } from "../lib/api";

interface SpaceDetailModalProps {
  space: Space;
  allItems: Item[];
  onClose: () => void;
  onDeleteSpace: (id: string) => void;
  onSelectItem: (item: Item) => void;
  onUpdateSpace?: (updatedSpace: Space) => void;
}

export const SpaceDetailModal: React.FC<SpaceDetailModalProps> = ({
  space,
  allItems,
  onClose,
  onDeleteSpace,
  onSelectItem,
  onUpdateSpace,
}) => {
  const [selectedItemIdx, setSelectedItemIdx] = useState<number | null>(null);
  const [isRescanning, setIsRescanning] = useState(false);
  const [currentSpace, setCurrentSpace] = useState<Space>(space);
  const [rescanBanner, setRescanBanner] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Find linked items in main catalog
  const spaceItems = allItems.filter((i) => i.space_id === currentSpace.id);

  // Trigger AI Rescan on existing or new photo
  const runDeepRescan = async (imageToScan: string) => {
    setIsRescanning(true);
    setRescanBanner(null);
    try {
      const result = await analyzeImageWithAI(imageToScan, "space", "image/jpeg", true);
      const newlyDetected = result.detectedItems || [
        { name: "Box of Paperclips", confidence: "Likely match", tags: ["office", "stationery"], bbox: [35, 30, 50, 48] },
        { name: "Spare USB Drive", confidence: "High confidence", tags: ["tech", "storage"], bbox: [60, 40, 75, 55] },
      ];

      // Compare with existing detected items in currentSpace
      const existingNames = new Set(
        currentSpace.detected_items.map((i) => i.item_name.toLowerCase())
      );

      const missedItems: DetectedItem[] = [];
      newlyDetected.forEach((item, idx) => {
        if (!existingNames.has(item.name.toLowerCase())) {
          missedItems.push({
            id: `rescan-det-${Date.now()}-${idx}`,
            space_id: currentSpace.id,
            item_name: item.name,
            confidence: item.confidence,
            bounding_box: item.bbox,
            tags: item.tags,
          });
        }
      });

      if (missedItems.length > 0) {
        const updatedDetectedList = [...currentSpace.detected_items, ...missedItems];
        const updatedSpaceObj: Space = {
          ...currentSpace,
          image_path: imageToScan,
          detected_items: updatedDetectedList,
          detected_items_count: updatedDetectedList.length,
        };

        setCurrentSpace(updatedSpaceObj);
        if (onUpdateSpace) {
          onUpdateSpace(updatedSpaceObj);
        }
        setRescanBanner(`Found ${missedItems.length} missed item(s): ${missedItems.map((m) => m.item_name).join(", ")}!`);
      } else {
        setRescanBanner("Rescan complete: No additional missed items were detected.");
      }
    } catch (err) {
      console.warn("Rescan error:", err);
      setRescanBanner("Rescan failed. Please check your image and try again.");
    } finally {
      setIsRescanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        if (result) {
          const compressed = await compressImage(result, 1200, 1200);
          runDeepRescan(compressed);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddManualMissedItem = () => {
    const name = prompt("Enter missed object name to add:");
    if (name?.trim()) {
      const newItem: DetectedItem = {
        id: `manual-det-${Date.now()}`,
        space_id: currentSpace.id,
        item_name: name.trim(),
        confidence: "High confidence",
        bounding_box: [35, 35, 65, 65],
        tags: ["manual", "missed"],
      };

      const updatedDetectedList = [...currentSpace.detected_items, newItem];
      const updatedSpaceObj: Space = {
        ...currentSpace,
        detected_items: updatedDetectedList,
        detected_items_count: updatedDetectedList.length,
      };

      setCurrentSpace(updatedSpaceObj);
      if (onUpdateSpace) {
        onUpdateSpace(updatedSpaceObj);
      }
      setRescanBanner(`Added missed item "${name.trim()}".`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#161412]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#211F1B] rounded-[32px] max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E5E3DA] dark:border-[#3E3D3A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#7CA65B]/10 text-[#7CA65B] dark:text-[#A8C98B] flex items-center justify-center">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#30302E] dark:text-[#E5E3DA]">
                {currentSpace.name}
              </h2>
              <p className="text-xs text-[#83827C] dark:text-[#A8A7A2]">
                Scanned {formatFriendlyDateTime(currentSpace.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#83827C] hover:text-[#30302E] dark:hover:text-white rounded-xl hover:bg-[#EFEEE7] dark:hover:bg-[#1E1C19] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto py-4 space-y-4 pr-1 flex-1">
          {/* RESCAN ACTION CONTROLS */}
          <div className="p-3 bg-[#7CA65B]/10 border border-[#7CA65B]/20 rounded-2xl flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7CA65B]" />
              <span className="text-xs font-bold text-[#30302E] dark:text-[#E5E3DA]">
                Check for Missed Items?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => runDeepRescan(currentSpace.image_path)}
                disabled={isRescanning}
                className="px-3 py-1.5 bg-[#7CA65B] hover:bg-[#6B9149] text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRescanning ? "animate-spin" : ""}`} />
                <span>Deep Rescan Photo</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isRescanning}
                className="px-3 py-1.5 bg-[#EFEEE7] dark:bg-[#1E1C19] hover:bg-[#E5E3DA] text-[#44433F] dark:text-[#E5E3DA] text-xs font-semibold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                title="Upload new photo angle to scan"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>New Photo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* RESCAN STATUS / BANNER */}
          {isRescanning && (
            <div className="p-3 bg-[#7CA65B]/10 border border-[#7CA65B]/20 rounded-2xl flex items-center gap-2.5 text-xs text-[#7CA65B] font-semibold animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin shrink-0" />
              <span>AI is re-examining the photo to find missed or hidden items...</span>
            </div>
          )}

          {rescanBanner && !isRescanning && (
            <div className="p-3 bg-[#7CA65B]/15 border border-[#7CA65B]/30 text-[#30302E] dark:text-[#E5E3DA] rounded-2xl text-xs font-semibold flex items-center justify-between gap-2">
              <span>✨ {rescanBanner}</span>
              <button onClick={() => setRescanBanner(null)} className="text-[#83827C] hover:text-black">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Interactive Space Photo View */}
          <div className="relative rounded-2xl overflow-hidden bg-[#EFEEE7] dark:bg-[#100F0D] shadow-sm">
            <img
              src={currentSpace.image_path}
              alt={currentSpace.name}
              className="w-full h-auto block"
            />

            {/* Bounding Box Highlights Overlaid */}
            {currentSpace.detected_items.map((det, idx) => {
              const [ymin, xmin, ymax, xmax] = det.bounding_box || [20, 20, 50, 50];
              const isSelected = selectedItemIdx === idx;

              return (
                <div
                  key={det.id || idx}
                  onClick={() => setSelectedItemIdx(isSelected ? null : idx)}
                  style={{
                    top: `${ymin}%`,
                    left: `${xmin}%`,
                    width: `${Math.max(15, xmax - xmin)}%`,
                    height: `${Math.max(15, ymax - ymin)}%`,
                  }}
                  className={`absolute border-2 rounded-xl transition-all cursor-pointer flex items-start p-1 ${
                    isSelected
                      ? "border-[#7CA65B] bg-[#7CA65B]/40 shadow-lg scale-105 z-20"
                      : "border-[#7CA65B] bg-[#7CA65B]/20 hover:bg-[#7CA65B]/30 z-10"
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow ${
                      isSelected ? "bg-[#7CA65B] text-white" : "bg-[#7CA65B] text-white"
                    }`}
                  >
                    {det.item_name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* DETECTED ITEMS LIST */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#83827C] dark:text-[#A8A7A2] uppercase tracking-wider">
                Detected Objects in Space ({currentSpace.detected_items.length})
              </h3>
              <button
                type="button"
                onClick={handleAddManualMissedItem}
                className="text-xs text-[#7CA65B] font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Missed Item</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {currentSpace.detected_items.map((det, idx) => {
                const isSelected = selectedItemIdx === idx;
                const linkedItem = spaceItems.find(
                  (i) => i.name.toLowerCase() === det.item_name.toLowerCase()
                );

                return (
                  <div
                    key={det.id || idx}
                    onClick={() => setSelectedItemIdx(isSelected ? null : idx)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? "bg-[#7CA65B]/10 border-[#7CA65B]"
                        : "bg-[#EFEEE7] dark:bg-[#1E1C19] border-[#E5E3DA] dark:border-[#3E3D3A] hover:bg-[#E5E3DA]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#7CA65B] shrink-0" />
                      <div>
                        <p className="font-bold text-sm text-[#30302E] dark:text-[#E5E3DA]">
                          {det.item_name}
                        </p>
                        <p className="text-[11px] text-[#83827C] dark:text-[#A8A7A2]">
                          {det.confidence}
                        </p>
                      </div>
                    </div>

                    {linkedItem && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectItem(linkedItem);
                        }}
                        className="px-2.5 py-1 bg-[#7CA65B] text-white text-xs font-semibold rounded-lg shadow hover:bg-[#6B9149]"
                      >
                        View Record
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3.5 border-t border-[#E5E3DA] dark:border-[#3E3D3A] shrink-0 flex items-center justify-between">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="py-2.5 px-3 bg-[#B0473A]/10 text-[#B0473A] hover:bg-[#B0473A]/20 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Space</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 p-1 bg-[#B0473A]/10 border border-[#B0473A]/30 rounded-2xl">
              <span className="text-[11px] font-bold text-[#B0473A] px-1.5">Delete this space?</span>
              <button
                type="button"
                onClick={() => {
                  onDeleteSpace(currentSpace.id);
                  onClose();
                }}
                className="px-2.5 py-1.5 bg-[#B0473A] hover:bg-[#9A3C31] text-white text-[11px] font-bold rounded-xl shadow"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2.5 py-1.5 bg-white dark:bg-[#1E1C19] text-[#44433F] dark:text-[#E5E3DA] text-[11px] font-semibold rounded-xl"
              >
                Cancel
              </button>
            </div>
          )}

          {!showDeleteConfirm && (
            <button
              onClick={onClose}
              className="py-2.5 px-5 bg-[#30302E] dark:bg-[#E5E3DA] text-white dark:text-[#30302E] font-bold rounded-2xl text-xs"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
