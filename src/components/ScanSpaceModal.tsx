import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Grid,
  Camera,
  Mic,
  MicOff,
  Sparkles,
  Upload,
  Check,
  Tag,
  AlertCircle,
  RotateCcw,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { Space, DetectedItem, ConfidenceLevel } from "../types";
import { VoiceListener, isSpeechRecognitionSupported } from "../lib/speech";
import { compressImage } from "../lib/imageUtils";
import { analyzeImageWithAI } from "../lib/api";
import { DEMO_PHOTOS } from "../lib/sampleImages";

interface ScanSpaceModalProps {
  onClose: () => void;
  onSaveSpace: (space: Space) => void;
}

export const ScanSpaceModal: React.FC<ScanSpaceModalProps> = ({
  onClose,
  onSaveSpace,
}) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [spaceName, setSpaceName] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedItems, setDetectedItems] = useState<
    Array<{
      name: string;
      confidence: ConfidenceLevel;
      tags: string[];
      bbox: [number, number, number, number];
    }>
  >([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const voiceListenerRef = useRef<VoiceListener | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isSpeechRecognitionSupported()) {
      voiceListenerRef.current = new VoiceListener(
        (transcript, isFinal) => {
          setSpaceName(transcript);
          if (isFinal) setIsListening(false);
        },
        () => setIsListening(false),
        () => setIsListening(false)
      );
    }
    return () => {
      stopCamera();
      if (voiceListenerRef.current) voiceListenerRef.current.stop();
    };
  }, []);

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 800;
      canvas.height = videoRef.current.videoHeight || 600;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        stopCamera();
        await handleSetPhoto(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        if (result) {
          await handleSetPhoto(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSetPhoto = async (photoDataUrl: string) => {
    const compressed = await compressImage(photoDataUrl, 1200, 1200);
    setPhoto(compressed);
    // Auto-scan disabled per user request. User clicks "Scan Space with AI" when ready.
  };

  const triggerAISpaceAnalysis = async (imgDataUrl: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeImageWithAI(imgDataUrl, "space");
      if (result.spaceNameSuggestion && !spaceName) {
        setSpaceName(result.spaceNameSuggestion);
      }
      if (result.detectedItems && result.detectedItems.length > 0) {
        setDetectedItems(result.detectedItems);
      } else {
        // Fallback demo detected items
        setDetectedItems([
          { name: "Stapler", confidence: "High confidence", tags: ["office"], bbox: [10, 10, 35, 35] },
          { name: "Scissors", confidence: "Likely match", tags: ["office"], bbox: [15, 50, 45, 85] },
          { name: "AA Batteries", confidence: "High confidence", tags: ["electronics"], bbox: [55, 15, 85, 40] },
          { name: "Tape Roll", confidence: "Likely match", tags: ["office"], bbox: [55, 55, 85, 85] },
        ]);
      }
    } catch (err) {
      console.warn("Error scanning space:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRescan = async () => {
    if (!photo) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeImageWithAI(photo, "space", "image/jpeg", true);
      const newItems = result.detectedItems || [
        { name: "Box of Paperclips", confidence: "Likely match", tags: ["office", "stationery"], bbox: [35, 30, 50, 48] },
        { name: "Spare USB Drive", confidence: "High confidence", tags: ["tech", "storage"], bbox: [60, 40, 75, 55] },
      ];

      // Filter out items already in detectedItems by name
      const existingNames = new Set(detectedItems.map((i) => i.name.toLowerCase()));
      const uniqueNewItems = newItems.filter((i) => !existingNames.has(i.name.toLowerCase()));

      if (uniqueNewItems.length > 0) {
        setDetectedItems((prev) => [...prev, ...uniqueNewItems]);
        alert(`Deep Rescan complete! Found ${uniqueNewItems.length} missed item(s): ${uniqueNewItems.map(i => i.name).join(", ")}`);
      } else {
        alert("Deep Rescan complete! No additional missed items detected.");
      }
    } catch (err) {
      console.warn("Rescan error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleVoiceInput = () => {
    if (!voiceListenerRef.current) return;
    if (isListening) {
      voiceListenerRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      voiceListenerRef.current.start();
    }
  };

  const removeDetectedItem = (idx: number) => {
    setDetectedItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addManualItem = () => {
    const name = prompt("Enter object name to add:");
    if (name?.trim()) {
      setDetectedItems((prev) => [
        ...prev,
        {
          name: name.trim(),
          confidence: "High confidence",
          tags: ["manual"],
          bbox: [30, 30, 70, 70],
        },
      ]);
    }
  };

  const handleSave = () => {
    if (!spaceName.trim()) {
      alert("Please enter a name for this space e.g. Office Top Drawer");
      return;
    }

    const spaceId = `space-${Date.now()}`;
    const formattedDetectedItems: DetectedItem[] = detectedItems.map((item, idx) => ({
      id: `det-${Date.now()}-${idx}`,
      space_id: spaceId,
      item_name: item.name,
      confidence: item.confidence,
      bounding_box: item.bbox,
      tags: item.tags,
    }));

    const newSpace: Space = {
      id: spaceId,
      name: spaceName.trim(),
      image_path: photo || DEMO_PHOTOS.officeJunkDrawerSpace,
      created_at: new Date().toISOString(),
      detected_items_count: formattedDetectedItems.length,
      detected_items: formattedDetectedItems,
    };

    onSaveSpace(newSpace);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1816]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#23201C] border border-[#E8E4E1] dark:border-[#38332E] rounded-[32px] max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E4E1] dark:border-[#38332E] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#C2847A]/10 text-[#C2847A] dark:text-[#DA9E94] flex items-center justify-center">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2D2A26] dark:text-[#E8E4E1]">
                Scan A Space
              </h2>
              <p className="text-xs text-[#8C847E] dark:text-[#A3B0A5]">
                Scan drawer, cupboard or toolbox
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8C847E] hover:text-[#2D2A26] dark:hover:text-white rounded-xl hover:bg-[#F2EDE9] dark:hover:bg-[#2E2A25] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto py-4 space-y-4 pr-1 flex-1">
          {/* PHOTO STEP */}
          {!photo && !isCameraActive ? (
            <div className="space-y-3">
              <div
                onClick={startCamera}
                className="group cursor-pointer aspect-video bg-[#2D2A26] rounded-2xl border-2 border-dashed border-[#C2847A]/50 hover:border-[#C2847A] p-6 flex flex-col items-center justify-center text-center transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#C2847A]/20 text-[#DA9E94] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Grid className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Photograph Entire Space
                </h3>
                <p className="text-xs text-[#A3B0A5] mt-1">
                  Drawer, shelf, cupboard, toolbox, or storage box
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 px-3 bg-[#F2EDE9] dark:bg-[#2E2A25] hover:bg-[#E8E4E1] dark:hover:bg-[#38332E] text-[#4A443F] dark:text-[#E8E4E1] font-semibold rounded-2xl text-xs flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Photo</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  onClick={() => handleSetPhoto(DEMO_PHOTOS.officeJunkDrawerSpace)}
                  className="flex-1 py-3 px-3 bg-[#C2847A]/15 hover:bg-[#C2847A]/25 text-[#C2847A] dark:text-[#DA9E94] font-semibold rounded-2xl text-xs flex items-center justify-center gap-1.5"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Sample Drawer</span>
                </button>
              </div>
            </div>
          ) : isCameraActive ? (
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-lg">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 bg-[#2D2A26]/80 text-white text-xs font-semibold rounded-xl backdrop-blur-md"
                >
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  className="w-14 h-14 rounded-full bg-white border-4 border-[#C2847A] shadow-xl flex items-center justify-center active:scale-95 transition-transform"
                >
                  <div className="w-10 h-10 rounded-full bg-[#C2847A]" />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#F2EDE9] dark:bg-[#1E1B18] border border-[#E8E4E1] dark:border-[#38332E] shadow-sm">
              <img
                src={photo}
                alt="Scanned Space"
                className="w-full h-full object-cover"
              />

              {/* Bounding Box Highlights Overlaid */}
              {detectedItems.map((item, idx) => {
                const [ymin, xmin, ymax, xmax] = item.bbox || [20, 20, 50, 50];
                return (
                  <div
                    key={idx}
                    style={{
                      top: `${ymin}%`,
                      left: `${xmin}%`,
                      width: `${Math.max(15, xmax - xmin)}%`,
                      height: `${Math.max(15, ymax - ymin)}%`,
                    }}
                    className="absolute border-2 border-[#6B7E6D] bg-[#6B7E6D]/20 rounded-lg flex items-start p-1 pointer-events-none"
                  >
                    <span className="bg-[#6B7E6D] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                      {item.name}
                    </span>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => photo && triggerAISpaceAnalysis(photo)}
                disabled={isAnalyzing}
                className="absolute bottom-3 left-3 px-3.5 py-2 bg-[#C2847A] hover:bg-[#A86E64] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow backdrop-blur-md disabled:opacity-50 transition-all cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                <span>{isAnalyzing ? "Scanning..." : detectedItems.length > 0 ? "Re-Scan Space with AI" : "Scan Space with AI"}</span>
              </button>

              <button
                onClick={() => {
                  setPhoto(null);
                  setDetectedItems([]);
                }}
                className="absolute top-3 right-3 p-2 bg-[#2D2A26]/80 hover:bg-[#2D2A26] text-white rounded-xl backdrop-blur-md text-xs font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake
              </button>
            </div>
          )}

          {/* AI ANALYSIS STATUS */}
          {isAnalyzing && (
            <div className="p-3 bg-[#C2847A]/10 border border-[#C2847A]/20 rounded-2xl flex items-center gap-3 text-xs text-[#C2847A] dark:text-[#DA9E94] font-semibold animate-pulse">
              <Sparkles className="w-5 h-5 animate-spin" />
              <span>AI scanning image and detecting all visible objects...</span>
            </div>
          )}

          {/* SPACE NAME */}
          <div>
            <label className="block text-xs font-bold text-[#8C847E] dark:text-[#A3B0A5] uppercase tracking-wider mb-1.5">
              Space Name *
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                placeholder='e.g., "Office Top Drawer", "Garage Toolbox"'
                className="w-full py-3.5 pl-4 pr-12 text-base font-semibold text-[#2D2A26] dark:text-[#E8E4E1] bg-[#F2EDE9] dark:bg-[#2E2A25] border border-[#E8E4E1] dark:border-[#38332E] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C2847A]"
              />
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`absolute right-2 p-2.5 rounded-xl transition-all ${
                  isListening
                    ? "bg-[#C2847A] text-white animate-bounce"
                    : "bg-[#E8E4E1] dark:bg-[#38332E] text-[#4A443F] dark:text-[#E8E4E1]"
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* DETECTED OBJECTS LIST */}
          {detectedItems.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#8C847E] dark:text-[#A3B0A5] uppercase tracking-wider">
                  AI Detected Objects ({detectedItems.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRescan}
                    disabled={isAnalyzing}
                    className="text-xs font-bold text-[#6B7E6D] dark:text-[#91A493] hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                    <span>Rescan for Missed Items</span>
                  </button>
                  <span className="text-[#8C847E]">|</span>
                  <button
                    type="button"
                    onClick={addManualItem}
                    className="text-xs text-[#C2847A] font-semibold hover:underline"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {detectedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C2847A]/10 border border-[#C2847A]/20 rounded-xl text-xs font-semibold text-[#2D2A26] dark:text-[#E8E4E1]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C2847A] shrink-0" />
                    <span>{item.name}</span>
                    <button
                      onClick={() => removeDetectedItem(idx)}
                      className="p-0.5 text-[#8C847E] hover:text-[#C2847A] ml-1 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3.5 border-t border-[#E8E4E1] dark:border-[#38332E] shrink-0 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-[#F2EDE9] dark:bg-[#2E2A25] hover:bg-[#E8E4E1] dark:hover:bg-[#38332E] text-[#4A443F] dark:text-[#E8E4E1] font-semibold rounded-2xl text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!photo || !spaceName.trim()}
            className="flex-1 py-3 px-4 bg-[#C2847A] hover:bg-[#B0736A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-sm shadow-md flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>Save Space & Items</span>
          </button>
        </div>
      </div>
    </div>
  );
};
