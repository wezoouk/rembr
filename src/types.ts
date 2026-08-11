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
  hideBorrowedSection?: boolean;
  autoSecondScanPass?: boolean;
}

// How long after the borrow date to send the first reminder. "none" = no reminder.
export type ReminderInterval = "3days" | "1week" | "2weeks" | "none";

export interface BorrowedItem {
  id: string;
  item_name: string;
  borrowed_to: string; // person's name
  image_path?: string; // optional photo of the item
  date_borrowed: string; // ISO string
  reminder_interval: ReminderInterval;
  next_reminder_at?: string; // ISO string - when the next nag is due
  is_returned: boolean;
  returned_at?: string;
  created_at: string;
  updated_at: string;
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
