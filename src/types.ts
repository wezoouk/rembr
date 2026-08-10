export type ConfidenceLevel = "High confidence" | "Likely match" | "Possible match";

export interface ItemHistoryRecord {
  id: string;
  item_id: string;
  location_name: string;
  description?: string;
  image_path: string; // base64 or data URL
  saved_at: string; // ISO string
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  location_name: string;
  image_path: string; // base64 thumbnail or preview
  created_at: string;
  updated_at: string;
  tags: string[];
  confidence: ConfidenceLevel;
  source_type: "remember" | "scan";
  is_pinned?: boolean;
  space_id?: string;
  space_name?: string;
  bbox?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in percentages 0-100
  history?: ItemHistoryRecord[];
}

export interface DetectedItem {
  id: string;
  space_id: string;
  item_name: string;
  confidence: ConfidenceLevel;
  bounding_box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in percentages
  tags: string[];
}

export interface Space {
  id: string;
  name: string;
  image_path: string; // base64 or data URL
  created_at: string;
  detected_items_count: number;
  detected_items: DetectedItem[];
}

export interface AppSettings {
  darkMode: boolean;
  retainOriginalPhotos: boolean;
  hasCompletedOnboarding: boolean;
  blurRecentlySaved?: boolean;
  blurLocationRecentlySaved?: boolean;
  allowDuplicateItems?: boolean;
  hideLocationsSection?: boolean;
}

export interface AIAnalysisResult {
  itemName?: string;
  locationDescription?: string;
  roomType?: string;
  furnitureContainer?: string;
  nearbyLandmarks?: string;
  tags?: string[];
  confidence?: ConfidenceLevel;
  spaceNameSuggestion?: string;
  detectedItems?: Array<{
    name: string;
    confidence: ConfidenceLevel;
    tags: string[];
    bbox: [number, number, number, number];
  }>;
}

export interface AISearchMatch {
  itemId: string;
  confidence: ConfidenceLevel;
  reasoning: string;
}

export interface AISearchResult {
  textAnswer?: string;
  matches: AISearchMatch[];
}
