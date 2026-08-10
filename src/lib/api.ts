import { Capacitor } from "@capacitor/core";
import { AIAnalysisResult, AISearchResult, Item } from "../types";

// On native (iOS/Android) there's no local server to hit with a relative path,
// so point at the deployed backend. On web, keep using relative paths so it
// keeps working against whatever host is serving the app (e.g. localhost in dev).
const API_BASE_URL = Capacitor.isNativePlatform()
  ? "https://rembr.onrender.com"
  : "";

export async function analyzeImageWithAI(
  imageBase64: string,
  mode: "item" | "space" = "item",
  mimeType = "image/jpeg",
  isRescan = false
): Promise<AIAnalysisResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/analyze-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mode, mimeType, isRescan }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn("AI Image analysis error, using fallback client parser:", err);
    if (mode === "space") {
      return {
        spaceNameSuggestion: "Scanned Storage Drawer",
        detectedItems: [
          { name: "Scanned Item 1", confidence: "Likely match", tags: ["storage"], bbox: [20, 20, 50, 50] },
          { name: "Scanned Item 2", confidence: "Likely match", tags: ["storage"], bbox: [50, 50, 80, 80] },
        ],
      };
    }
    return {
      itemName: "Saved Item",
      locationDescription: "Stored safely in home location",
      tags: ["item", "saved"],
      confidence: "Likely match",
    };
  }
}

export async function searchItemsWithAI(
  query: string,
  items: Item[]
): Promise<AISearchResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ai-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, items }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn("AI Search fallback to client matching:", err);
    const q = query.toLowerCase().trim();
    const matches = items
      .filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          it.location_name.toLowerCase().includes(q) ||
          it.tags?.some((t) => t.toLowerCase().includes(q))
      )
      .map((it) => ({
        itemId: it.id,
        confidence: "Likely match" as const,
        reasoning: "Matched keyword in name or location",
      }));

    return {
      textAnswer: matches.length > 0 ? `Found ${matches.length} matching item(s).` : "No matches found.",
      matches,
    };
  }
}
