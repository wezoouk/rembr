import React, { useState } from "react";
import {
  X,
  MapPin,
  Search,
  ChevronRight,
  ArrowLeft,
  Plus,
  Pin,
  Trash2,
  Clock,
  FolderOpen,
  Tag,
  CheckCircle,
  ExternalLink,
  AlertCircle,
  Layers,
} from "lucide-react";
import { Item, Space } from "../types";
import { formatShortDateTime } from "../lib/imageUtils";

interface GroupedLocation {
  name: string;
  items: Item[];
  itemCount: number;
  latestUpdatedAt: string;
  previewImages: string[];
  associatedSpace?: Space;
}

interface LocationsModalProps {
  items: Item[];
  spaces: Space[];
  initialLocationName?: string | null;
  onClose: () => void;
  onSelectItem: (item: Item) => void;
  onUpdateItem?: (item: Item) => void;
  onDeleteItem?: (id: string) => void;
  onAddNewItemInLocation?: (locationName: string) => void;
}

export const LocationsModal: React.FC<LocationsModalProps> = ({
  items,
  spaces,
  initialLocationName = null,
  onClose,
  onSelectItem,
  onUpdateItem,
  onDeleteItem,
  onAddNewItemInLocation,
}) => {
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedLocationName, setSelectedLocationName] = useState<string | null>(
    initialLocationName
  );
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Group items by location_name
  const locationMap = new Map<string, Item[]>();

  items.forEach((item) => {
    const loc = (item.location_name || "General Storage").trim();
    if (!locationMap.has(loc)) {
      locationMap.set(loc, []);
    }
    locationMap.get(loc)!.push(item);
  });

  const groupedLocations: GroupedLocation[] = Array.from(locationMap.entries()).map(
    ([locName, locItems]) => {
      const sorted = [...locItems].sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime()
      );
      const previewImages = Array.from(new Set(sorted.map((i) => i.image_path))).slice(0, 4);
      const matchingSpace = spaces.find(
        (s) => s.name.toLowerCase().trim() === locName.toLowerCase()
      );

      return {
        name: locName,
        items: sorted,
        itemCount: sorted.length,
        latestUpdatedAt: sorted[0]?.updated_at || sorted[0]?.created_at || new Date().toISOString(),
        previewImages,
        associatedSpace: matchingSpace,
      };
    }
  );

  // Sort locations by item count (highest first)
  groupedLocations.sort((a, b) => b.itemCount - a.itemCount);

  // Filter locations by search query
  const filteredLocations = groupedLocations.filter((group) => {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return true;
    if (group.name.toLowerCase().includes(q)) return true;
    return group.items.some(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  const activeGroup = selectedLocationName
    ? groupedLocations.find(
        (g) => g.name.toLowerCase().trim() === selectedLocationName.toLowerCase().trim()
      ) || {
        name: selectedLocationName,
        items: items.filter(
          (i) => i.location_name.toLowerCase().trim() === selectedLocationName.toLowerCase().trim()
        ),
        itemCount: items.filter(
          (i) => i.location_name.toLowerCase().trim() === selectedLocationName.toLowerCase().trim()
        ).length,
        latestUpdatedAt: new Date().toISOString(),
        previewImages: [],
      }
    : null;

  // Filter items within active location detail view
  const activeLocationItems = activeGroup
    ? activeGroup.items.filter((item) => {
        const q = itemSearchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
        );
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-[#F7F5F2] dark:bg-[#1A1816] border border-[#E8E4E1] dark:border-[#38332E] w-full max-w-2xl rounded-3xl sm:rounded-[36px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-white dark:bg-[#23201C] border-b border-[#E8E4E1] dark:border-[#38332E] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {activeGroup ? (
              <button
                type="button"
                onClick={() => setSelectedLocationName(null)}
                className="p-2 bg-[#F2EDE9] dark:bg-[#2E2A25] hover:bg-[#E8E4E1] dark:hover:bg-[#38332E] text-[#2D2A26] dark:text-[#E8E4E1] rounded-2xl transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>All Locations</span>
              </button>
            ) : (
              <div className="w-10 h-10 bg-[#6B7E6D]/15 text-[#6B7E6D] dark:text-[#91A493] rounded-2xl flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
            )}

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#2D2A26] dark:text-[#E8E4E1]">
                {activeGroup ? activeGroup.name : "Locations Catalog"}
              </h2>
              <p className="text-xs text-[#8C847E] dark:text-[#A3B0A5] font-medium">
                {activeGroup
                  ? `${activeGroup.itemCount} ${
                      activeGroup.itemCount === 1 ? "item" : "items"
                    } stored in this location`
                  : `${groupedLocations.length} locations • ${items.length} total items`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 text-[#8C847E] hover:text-[#2D2A26] dark:hover:text-white hover:bg-[#F2EDE9] dark:hover:bg-[#2E2A25] rounded-2xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* SCENARIO A: Viewing List of All Locations */}
          {!activeGroup && (
            <>
              {/* Filter Search Bar */}
              <div className="relative flex items-center bg-white dark:bg-[#23201C] border border-[#E8E4E1] dark:border-[#38332E] rounded-2xl p-1 shadow-sm">
                <Search className="w-4 h-4 text-[#8C847E] ml-3 shrink-0" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter locations or items inside..."
                  className="w-full py-2.5 pl-2 pr-8 text-sm text-[#2D2A26] dark:text-[#E8E4E1] bg-transparent placeholder-[#8C847E] focus:outline-none"
                />
                {filterQuery && (
                  <button
                    onClick={() => setFilterQuery("")}
                    className="p-1.5 text-[#8C847E] hover:text-[#2D2A26] rounded-xl mr-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Locations Grid */}
              {filteredLocations.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-[#23201C] rounded-3xl border border-dashed border-[#E8E4E1] dark:border-[#38332E] p-6">
                  <MapPin className="w-10 h-10 text-[#8C847E] mx-auto mb-2" />
                  <p className="text-base font-bold text-[#2D2A26] dark:text-[#E8E4E1]">
                    No matching locations found
                  </p>
                  <p className="text-xs text-[#8C847E] mt-1">
                    Try typing a different location keyword or save a new item with a location.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredLocations.map((group) => {
                    const sampleNames = group.items
                      .map((i) => i.name)
                      .slice(0, 3)
                      .join(", ");

                    return (
                      <div
                        key={group.name}
                        onClick={() => setSelectedLocationName(group.name)}
                        className="group cursor-pointer bg-white dark:bg-[#23201C] border border-[#E8E4E1] dark:border-[#38332E] hover:border-[#6B7E6D]/50 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative overflow-hidden"
                      >
                        {/* Location Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#6B7E6D]/15 text-[#6B7E6D] dark:text-[#91A493] rounded-xl flex items-center justify-center shrink-0">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-[#2D2A26] dark:text-[#E8E4E1] group-hover:text-[#6B7E6D] dark:group-hover:text-[#91A493] transition-colors leading-tight">
                                {group.name}
                              </h3>
                              <p className="text-[11px] text-[#8C847E] dark:text-[#A3B0A5] font-medium mt-0.5">
                                Updated {formatShortDateTime(group.latestUpdatedAt)}
                              </p>
                            </div>
                          </div>

                          <span className="text-xs font-extrabold bg-[#6B7E6D]/15 text-[#6B7E6D] dark:text-[#91A493] px-2.5 py-1 rounded-full shrink-0">
                            {group.itemCount} {group.itemCount === 1 ? "item" : "items"}
                          </span>
                        </div>

                        {/* Image Preview Collage */}
                        <div className="grid grid-cols-4 gap-1.5 bg-[#F2EDE9] dark:bg-[#1E1B18] p-1.5 rounded-2xl">
                          {group.previewImages.slice(0, 4).map((imgUrl, i) => (
                            <div
                              key={i}
                              className="aspect-square rounded-xl overflow-hidden bg-black/10"
                            >
                              <img
                                src={imgUrl}
                                alt="Item preview"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ))}
                          {group.previewImages.length < 4 &&
                            Array.from({ length: 4 - group.previewImages.length }).map((_, i) => (
                              <div
                                key={`empty-${i}`}
                                className="aspect-square rounded-xl bg-[#E8E4E1]/50 dark:bg-[#2A2622]/50 flex items-center justify-center"
                              >
                                <Layers className="w-3.5 h-3.5 text-[#8C847E]/40" />
                              </div>
                            ))}
                        </div>

                        {/* Text summary & action button */}
                        <div className="flex items-center justify-between pt-1 border-t border-[#E8E4E1]/60 dark:border-[#38332E]/60 text-xs">
                          <span className="text-[#8C847E] dark:text-[#A3B0A5] font-medium truncate max-w-[180px]">
                            {sampleNames}
                          </span>
                          <span className="font-bold text-[#6B7E6D] dark:text-[#91A493] flex items-center gap-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform">
                            View Items
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* SCENARIO B: Viewing Items Inside Selected Location */}
          {activeGroup && (
            <div className="space-y-4">
              {/* Location Controls Banner */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white dark:bg-[#23201C] border border-[#E8E4E1] dark:border-[#38332E] p-3 rounded-2xl shadow-sm">
                {/* Search within location */}
                <div className="relative flex-1 flex items-center bg-[#F7F5F2] dark:bg-[#1A1816] rounded-xl px-2.5 py-1">
                  <Search className="w-3.5 h-3.5 text-[#8C847E] mr-2 shrink-0" />
                  <input
                    type="text"
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    placeholder={`Search in ${activeGroup.name}...`}
                    className="w-full py-1.5 text-xs text-[#2D2A26] dark:text-[#E8E4E1] bg-transparent focus:outline-none"
                  />
                  {itemSearchQuery && (
                    <button
                      onClick={() => setItemSearchQuery("")}
                      className="text-[#8C847E] hover:text-[#2D2A26]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Add Item Button */}
                {onAddNewItemInLocation && (
                  <button
                    onClick={() => onAddNewItemInLocation(activeGroup.name)}
                    className="py-2 px-3.5 bg-[#6B7E6D] hover:bg-[#586A5A] text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item Here</span>
                  </button>
                )}
              </div>

              {/* Items List Grid */}
              {activeLocationItems.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-[#23201C] rounded-3xl border border-dashed border-[#E8E4E1] dark:border-[#38332E] p-6">
                  <FolderOpen className="w-10 h-10 text-[#8C847E] mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#2D2A26] dark:text-[#E8E4E1]">
                    No items found in this location
                  </p>
                  <p className="text-xs text-[#8C847E] mt-1">
                    {itemSearchQuery
                      ? "Try clearing your search query."
                      : "Tap '+ Add Item Here' above to store an item in this location!"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeLocationItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectItem(item)}
                      className="group cursor-pointer bg-white dark:bg-[#23201C] border border-[#E8E4E1] dark:border-[#38332E] rounded-3xl p-3 shadow-sm hover:shadow-md transition-all flex gap-3 relative overflow-hidden"
                    >
                      {/* Thumbnail Photo */}
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#F2EDE9] dark:bg-[#1E1B18] shrink-0 relative">
                        <img
                          src={item.image_path}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-lg backdrop-blur-sm">
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-sm text-[#2D2A26] dark:text-[#E8E4E1] group-hover:text-[#6B7E6D] dark:group-hover:text-[#91A493] truncate">
                              {item.name}
                            </h4>
                          </div>

                          <p className="text-[11px] text-[#8C847E] dark:text-[#A3B0A5] line-clamp-1 mt-0.5 font-medium">
                            {item.description || item.location_name}
                          </p>

                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#6B7E6D] dark:text-[#91A493] bg-[#6B7E6D]/10 px-1.5 py-0.5 rounded-md">
                              <Clock className="w-2.5 h-2.5" />
                              {formatShortDateTime(item.created_at || item.updated_at)}
                            </span>
                          </div>
                        </div>

                        {/* Pin and Delete Controls */}
                        <div className="flex items-center justify-end gap-1 mt-1 pt-1 border-t border-[#E8E4E1]/40 dark:border-[#38332E]/40">
                          {deletingItemId === item.id ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1"
                            >
                              <span className="text-[10px] font-bold text-[#C2847A]">Delete?</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onDeleteItem) onDeleteItem(item.id);
                                  setDeletingItemId(null);
                                }}
                                className="px-1.5 py-0.5 bg-[#C2847A] text-white text-[10px] font-bold rounded"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingItemId(null);
                                }}
                                className="px-1.5 py-0.5 bg-[#E8E4E1] dark:bg-[#38332E] text-[10px] rounded"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onUpdateItem) {
                                    onUpdateItem({ ...item, is_pinned: !item.is_pinned });
                                  }
                                }}
                                className={`p-1 rounded-lg transition-colors ${
                                  item.is_pinned
                                    ? "bg-[#C2847A] text-white"
                                    : "text-[#8C847E] hover:text-[#2D2A26] dark:hover:text-white"
                                }`}
                                title={item.is_pinned ? "Unpin item" : "Pin item"}
                              >
                                <Pin className={`w-3.5 h-3.5 ${item.is_pinned ? "fill-current" : ""}`} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingItemId(item.id);
                                }}
                                className="p-1 rounded-lg text-[#8C847E] hover:text-[#C2847A] transition-colors"
                                title="Delete item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
