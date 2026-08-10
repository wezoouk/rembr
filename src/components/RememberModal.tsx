import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  Mic,
  MicOff,
  Sparkles,
  Upload,
  Check,
  MapPin,
  Tag,
  AlertCircle,
  RotateCcw,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { Item, AIAnalysisResult, ConfidenceLevel } from "../types";
import { VoiceListener, isSpeechRecognitionSupported } from "../lib/speech";
import { compressImage } from "../lib/imageUtils";
import { analyzeImageWithAI } from "../lib/api";
import { DEMO_PHOTOS, createTextNoteSVG } from "../lib/sampleImages";
import { DictationIndicator } from "./DictationIndicator";

interface RememberModalProps {
  onClose: () => void;
  onSave: (item: Item) => void;
  existingItems?: Item[];
  allowDuplicateItems?: boolean;
  initialLocation?: string;
}

// Intelligent phrase parsing helper for voice dictation
function parseSpokenPhrase(phrase: string): { name?: string; location?: string } {
  const clean = phrase.trim().replace(/^(remember|please remember|i put|i placed|i left|my|where is|i stored)\s+/i, "");
  
  // Look for prepositions like "is in", "is on", "in the", "on the", "at the", "under the", "inside"
  const prepRegex = /\s+(is\s+in|is\s+on|is\s+at|is\s+under|is\s+inside|in\s+the|on\s+the|at\s+the|under\s+the|inside\s+the|in|on|at|under|inside)\s+/i;
  const match = clean.match(prepRegex);
  
  if (match && match.index !== undefined) {
    const item = clean.slice(0, match.index).trim();
    const loc = clean.slice(match.index + match[0].length).trim();
    if (item && loc) {
      return {
        name: item.charAt(0).toUpperCase() + item.slice(1),
        location: loc.charAt(0).toUpperCase() + loc.slice(1)
      };
    }
  }
  
  return { name: clean.charAt(0).toUpperCase() + clean.slice(1) };
}

export const RememberModal: React.FC<RememberModalProps> = ({
  onClose,
  onSave,
  existingItems = [],
  allowDuplicateItems = false,
  initialLocation = "",
}) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [locationName, setLocationName] = useState(initialLocation || "");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<ConfidenceLevel>("High confidence");

  // Duplicate Item Name Check State
  const [showDuplicatePrompt, setShowDuplicatePrompt] = useState(false);
  const [descriptiveNameInput, setDescriptiveNameInput] = useState("");

  const [entryMode, setEntryMode] = useState<"photo" | "voice">("photo");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [listeningTarget, setListeningTarget] = useState<"both" | "item" | "location" | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const voiceListenerRef = useRef<VoiceListener | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeTargetRef = useRef<"both" | "item" | "location" | null>(null);
  activeTargetRef.current = listeningTarget;

  // Initialize Speech Recognition
  useEffect(() => {
    if (isSpeechRecognitionSupported()) {
      voiceListenerRef.current = new VoiceListener(
        (transcript, isFinal) => {
          const target = activeTargetRef.current;
          if (target === "location") {
            setLocationName(transcript);
          } else if (target === "item") {
            setItemName(transcript);
          } else {
            const parsed = parseSpokenPhrase(transcript);
            if (parsed.name) setItemName(parsed.name);
            if (parsed.location) setLocationName(parsed.location);
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
      stopCamera();
      if (voiceListenerRef.current) {
        voiceListenerRef.current.stop();
      }
    };
  }, []);


  // Camera Management
  const startCamera = async () => {
    setCameraError(null);
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
    } catch (err: any) {
      console.warn("Camera access denied or unavailable:", err);
      setCameraError("Camera unavailable in preview. Select an image or use a sample photo.");
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
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        stopCamera();
        await handleSetPhoto(dataUrl);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const compressed = await compressImage(photoDataUrl);
    setPhoto(compressed);
    // Auto-scan disabled per user preference. User can click "Scan Photo with AI".
  };

  const triggerAIAnalysis = async (imgDataUrl: string) => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const result = await analyzeImageWithAI(imgDataUrl, "item");
      setAiAnalysis(result);

      if (result.itemName && !itemName) {
        setItemName(result.itemName);
      }
      if (result.locationDescription) {
        setLocationName(result.locationDescription);
      }
      if (result.tags) {
        setTags(result.tags);
      }
      if (result.confidence) {
        setConfidence(result.confidence);
      }
    } catch (err) {
      console.warn("AI Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleVoiceInput = async (target: "both" | "item" | "location" = "both") => {
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

  const handleSave = (finalItemNameOverride?: string | React.MouseEvent | React.FormEvent) => {
    const overrideStr = typeof finalItemNameOverride === "string" ? finalItemNameOverride : undefined;
    const finalName = (overrideStr || itemName).trim();
    if (!finalName) {
      alert("Please specify what item you are remembering.");
      return;
    }

    // Duplicate Item Name Check
    if (!allowDuplicateItems && !overrideStr) {
      const existingMatch = (existingItems || []).find(
        (i) => i && i.name && typeof i.name === "string" && i.name.trim().toLowerCase() === finalName.toLowerCase()
      );
      if (existingMatch) {
        setDescriptiveNameInput(finalName);
        setShowDuplicatePrompt(true);
        return;
      }
    }

    try {
      if (voiceListenerRef.current && isListening) {
        voiceListenerRef.current.stop();
        setIsListening(false);
      }

      let finalPhoto = photo;
      if (!finalPhoto) {
        try {
          finalPhoto = createTextNoteSVG(finalName, locationName.trim() || "Stored in home");
        } catch (svgErr) {
          console.warn("SVG note creation fallback:", svgErr);
          finalPhoto = DEMO_PHOTOS.carKeys;
        }
      }

      const newItem: Item = {
        id: `item-${Date.now()}`,
        name: finalName,
        description: description.trim() || aiAnalysis?.nearbyLandmarks || (photo ? "" : "Text/Voice dictated record"),
        location_name: locationName.trim() || "Stored in home",
        image_path: finalPhoto,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: tags.length > 0 ? tags : ["item"],
        confidence: confidence,
        source_type: "remember",
        is_pinned: false,
      };

      onSave(newItem);
      onClose();
    } catch (err) {
      console.error("Error saving item:", err);
      alert("Failed to save item. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1816]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#23201C] border border-[#E8E4E1] dark:border-[#38332E] rounded-[32px] max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* DUPLICATE ITEM PROMPT OVERLAY */}
        {showDuplicatePrompt && (
          <div className="absolute inset-0 z-50 bg-white/95 dark:bg-[#23201C]/95 backdrop-blur-md p-6 flex flex-col justify-center animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-[#C2847A]/15 text-[#C2847A] flex items-center justify-center mb-4 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-center text-[#2D2A26] dark:text-[#E8E4E1] mb-2">
              Duplicate Item Name
            </h3>
            <p className="text-sm text-center text-[#8C847E] dark:text-[#A3B0A5] mb-5">
              An item named <span className="font-bold text-[#2D2A26] dark:text-[#E8E4E1]">"{itemName}"</span> already exists in your records. Please provide a more descriptive name to keep items easy to find:
            </p>

            <div className="space-y-3 mb-6">
              <input
                type="text"
                value={descriptiveNameInput}
                onChange={(e) => setDescriptiveNameInput(e.target.value)}
                placeholder='e.g., "Brown Wallet", "Hallway Keys"'
                className="w-full py-3 px-4 text-base font-semibold text-[#2D2A26] dark:text-[#E8E4E1] bg-[#F2EDE9] dark:bg-[#2E2A25] border border-[#E8E4E1] dark:border-[#38332E] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6B7E6D]"
                autoFocus
              />
              <p className="text-[11px] text-[#8C847E] dark:text-[#A3B0A5]">
                Tip: Adding details like color or location (e.g. "Brown Wallet") helps distinguish items easily.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (descriptiveNameInput.trim()) {
                    setItemName(descriptiveNameInput.trim());
                    setShowDuplicatePrompt(false);
                    handleSave(descriptiveNameInput.trim());
                  }
                }}
                disabled={!descriptiveNameInput.trim()}
                className="w-full py-3 px-4 bg-[#6B7E6D] hover:bg-[#586A5A] text-white font-bold rounded-2xl text-sm shadow-md transition-all disabled:opacity-50"
              >
                Save with New Name
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDuplicatePrompt(false);
                    handleSave(itemName);
                  }}
                  className="flex-1 py-2.5 px-3 bg-[#F2EDE9] dark:bg-[#2E2A25] hover:bg-[#E8E4E1] dark:hover:bg-[#38332E] text-[#4A443F] dark:text-[#E8E4E1] text-xs font-semibold rounded-xl"
                >
                  Save Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => setShowDuplicatePrompt(false)}
                  className="flex-1 py-2.5 px-3 bg-[#E8E4E1] dark:bg-[#38332E] text-[#4A443F] dark:text-[#E8E4E1] text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E4E1] dark:border-[#38332E] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#6B7E6D]/10 text-[#6B7E6D] dark:text-[#91A493] flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2D2A26] dark:text-[#E8E4E1] leading-tight">
                Remember Item
              </h2>
              <p className="text-xs text-[#8C847E] dark:text-[#A3B0A5]">
                Save by voice, typing, or photo
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
          {/* VOICE / DICTATION FAST BANNER */}
          <div className="p-4 bg-[#6B7E6D]/10 border border-[#6B7E6D]/30 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6B7E6D] dark:text-[#91A493] uppercase tracking-wider flex items-center gap-1.5">
                <Mic className="w-4 h-4" /> Speak Full Phrase
              </span>
              <button
                type="button"
                onClick={() => toggleVoiceInput("both")}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm select-none active:scale-95 cursor-pointer ${
                  isListening && listeningTarget === "both"
                    ? "bg-[#C2847A] text-white animate-bounce"
                    : "bg-[#6B7E6D] text-white hover:bg-[#586A5A]"
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
            <p className="text-xs text-[#4A443F] dark:text-[#A3B0A5]">
              Say e.g., <span className="italic font-medium text-[#2D2A26] dark:text-[#E8E4E1]">"Remember my spare keys are in the top kitchen drawer"</span>
            </p>
          </div>

          {/* DICTATION INDICATOR */}
          <DictationIndicator
            isListening={isListening}
            transcript={
              listeningTarget === "item"
                ? itemName
                : listeningTarget === "location"
                ? locationName
                : `${itemName} ${locationName}`.trim()
            }
            audioLevel={audioLevel}
            onStop={() => toggleVoiceInput(listeningTarget || "both")}
            label={
              listeningTarget === "item"
                ? "Listening for Item Name..."
                : listeningTarget === "location"
                ? "Listening for Location Spot..."
                : "Listening for Item & Location Phrase..."
            }
          />

          {/* ITEM NAME & VOICE INPUT */}
          <div>
            <label className="block text-xs font-bold text-[#8C847E] dark:text-[#A3B0A5] uppercase tracking-wider mb-1.5">
              Item Name *
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder='e.g., "Car keys", "Passport", "Reading glasses"'
                className="w-full py-3.5 pl-4 pr-12 text-base font-semibold text-[#2D2A26] dark:text-[#E8E4E1] bg-[#F2EDE9] dark:bg-[#2E2A25] border border-[#E8E4E1] dark:border-[#38332E] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6B7E6D]"
              />
              <button
                type="button"
                onClick={() => toggleVoiceInput("item")}
                className={`absolute right-2 p-2.5 rounded-xl transition-all select-none active:scale-95 cursor-pointer ${
                  isListening && listeningTarget === "item"
                    ? "bg-[#C2847A] text-white animate-bounce"
                    : "bg-[#E8E4E1] dark:bg-[#38332E] text-[#4A443F] dark:text-[#E8E4E1] hover:bg-[#F2EDE9]"
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

          {/* LOCATION DESCRIPTION */}
          <div>
            <label className="block text-xs font-bold text-[#8C847E] dark:text-[#A3B0A5] uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Location / Spot</span>
              {aiAnalysis?.locationDescription && (
                <span className="text-[10px] text-[#6B7E6D] dark:text-[#91A493] font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Suggested
                </span>
              )}
            </label>
            <div className="relative flex items-center">
              <MapPin className="w-4 h-4 text-[#6B7E6D] absolute left-3.5 shrink-0" />
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder='e.g., "Top drawer of kitchen cabinet"'
                className="w-full py-3 pl-10 pr-12 text-sm text-[#2D2A26] dark:text-[#E8E4E1] bg-[#F2EDE9] dark:bg-[#2E2A25] border border-[#E8E4E1] dark:border-[#38332E] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6B7E6D]"
              />
              <button
                type="button"
                onClick={() => toggleVoiceInput("location")}
                className={`absolute right-2 p-2 rounded-xl transition-all select-none active:scale-95 cursor-pointer ${
                  isListening && listeningTarget === "location"
                    ? "bg-[#C2847A] text-white animate-bounce"
                    : "bg-[#E8E4E1] dark:bg-[#38332E] text-[#4A443F] dark:text-[#E8E4E1] hover:bg-[#F2EDE9]"
                }`}
                title="Tap to dictate location spot"
              >
                {isListening && listeningTarget === "location" ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* OPTIONAL PHOTO SECTION */}
          <div className="pt-2 border-t border-[#E8E4E1] dark:border-[#38332E] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#8C847E] dark:text-[#A3B0A5] uppercase tracking-wider">
                Photo (Optional)
              </label>
              {photo && (
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setAiAnalysis(null);
                  }}
                  className="text-xs font-semibold text-[#C2847A] hover:underline"
                >
                  Remove Photo
                </button>
              )}
            </div>

            {!photo && !isCameraActive ? (
              <div className="space-y-2">
                <div
                  onClick={startCamera}
                  className="group cursor-pointer aspect-video bg-[#2D2A26] rounded-2xl border-2 border-dashed border-[#6B7E6D]/50 hover:border-[#6B7E6D] p-5 flex flex-col items-center justify-center text-center transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#6B7E6D]/20 text-[#A3B0A5] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    Tap to Add Photo (Optional)
                  </h3>
                  <p className="text-xs text-[#A3B0A5] mt-0.5">
                    Snap where you put it or skip if typing/dictating
                  </p>
                </div>

                {cameraError && (
                  <div className="p-3 bg-[#C2847A]/10 text-[#C2847A] rounded-xl text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {/* Upload or Demo Photo Picker Options */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 px-3 bg-[#F2EDE9] dark:bg-[#2E2A25] hover:bg-[#E8E4E1] dark:hover:bg-[#38332E] text-[#4A443F] dark:text-[#E8E4E1] font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors"
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
                    type="button"
                    onClick={() => handleSetPhoto(DEMO_PHOTOS.carKeys)}
                    className="flex-1 py-2.5 px-3 bg-[#6B7E6D]/15 hover:bg-[#6B7E6D]/25 text-[#6B7E6D] dark:text-[#A3B0A5] font-semibold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Sample Keys</span>
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
                    className="w-14 h-14 rounded-full bg-white border-4 border-[#6B7E6D] shadow-xl flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#6B7E6D]" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#F2EDE9] dark:bg-[#1E1B18] border border-[#E8E4E1] dark:border-[#38332E] shadow-sm">
                <img
                  src={photo}
                  alt="Captured location"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => photo && triggerAIAnalysis(photo)}
                  disabled={isAnalyzing}
                  className="absolute bottom-3 left-3 px-3 py-1.5 bg-[#6B7E6D] hover:bg-[#586A5A] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow backdrop-blur-md disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                  <span>{isAnalyzing ? "Scanning..." : "Scan Photo with AI"}</span>
                </button>
                <button
                  onClick={() => {
                    setPhoto(null);
                    setAiAnalysis(null);
                  }}
                  className="absolute top-3 right-3 p-2 bg-[#2D2A26]/80 hover:bg-[#2D2A26] text-white rounded-xl backdrop-blur-md text-xs font-semibold flex items-center gap-1 shadow"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retake
                </button>
              </div>
            )}
          </div>

          {/* AI ANALYSIS STATUS */}
          {isAnalyzing && (
            <div className="p-3 bg-[#6B7E6D]/10 border border-[#6B7E6D]/20 rounded-2xl flex items-center gap-3 text-xs text-[#6B7E6D] dark:text-[#91A493] font-semibold animate-pulse">
              <Sparkles className="w-5 h-5 animate-spin" />
              <span>AI is analyzing photo context & detecting location...</span>
            </div>
          )}

          {/* CONFIDENCE BADGE */}
          {aiAnalysis && (
            <div className="flex items-center justify-between p-3 bg-[#F2EDE9] dark:bg-[#2E2A25] rounded-2xl border border-[#E8E4E1] dark:border-[#38332E] text-xs">
              <span className="text-[#8C847E] dark:text-[#A3B0A5] font-medium">
                AI Recognition Confidence:
              </span>
              <span className="font-bold text-[#6B7E6D] dark:text-[#91A493] bg-[#6B7E6D]/15 px-2.5 py-1 rounded-lg">
                {confidence}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3.5 border-t border-[#E8E4E1] dark:border-[#38332E] shrink-0 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-[#F2EDE9] dark:bg-[#2E2A25] hover:bg-[#E8E4E1] dark:hover:bg-[#38332E] text-[#4A443F] dark:text-[#E8E4E1] font-semibold rounded-2xl text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave()}
            disabled={!itemName.trim()}
            className="flex-1 py-3 px-4 bg-[#6B7E6D] hover:bg-[#586A5A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-5 h-5" />
            <span>Save Location</span>
          </button>
        </div>
      </div>

      {/* FLOATING SAVE POPUP — pinned to the screen itself (not the scrollable
          card) so it stays reachable even when a mobile keyboard is covering
          the footer button above. Shows as soon as there's an item name. */}
      {itemName.trim() && !showDuplicatePrompt && (
        <div className="fixed bottom-5 inset-x-0 z-[60] flex justify-center px-4 pointer-events-none animate-fade-in">
          <button
            type="button"
            onClick={() => handleSave()}
            className="pointer-events-auto flex items-center gap-2 py-3.5 px-6 bg-[#6B7E6D] hover:bg-[#586A5A] text-white font-bold rounded-full text-sm shadow-2xl active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-5 h-5" />
            <span>Save Location</span>
          </button>
        </div>
      )}
    </div>
  );
};
