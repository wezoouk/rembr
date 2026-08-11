import React, { useState, useEffect } from "react";
import { Item, Space, AppSettings, BorrowedItem } from "./types";
import {
  getAllItems,
  getAllSpaces,
  getSettings,
  saveItem,
  deleteItem,
  saveSpace,
  deleteSpace,
  saveSettings,
  resetDemoData,
  clearAllData,
  getAllBorrowedItems,
  saveBorrowedItem,
  deleteBorrowedItem,
} from "./lib/storage";
import { Header } from "./components/Header";
import { HomeScreen } from "./components/HomeScreen";
import { OnboardingModal } from "./components/OnboardingModal";
import { RememberModal } from "./components/RememberModal";
import { FindModal } from "./components/FindModal";
import { ScanSpaceModal } from "./components/ScanSpaceModal";
import { ItemDetailModal } from "./components/ItemDetailModal";
import { SpaceDetailModal } from "./components/SpaceDetailModal";
import { SettingsModal } from "./components/SettingsModal";
import { LocationsModal } from "./components/LocationsModal";
import { BorrowedModal } from "./components/BorrowedModal";
import { HelpModal } from "./components/HelpModal";
import { BottomNav } from "./components/BottomNav";

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [borrowedItems, setBorrowedItems] = useState<BorrowedItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: true,
    retainOriginalPhotos: true,
    hasCompletedOnboarding: false,
    hideLocationsSection: true,
    hideBorrowedSection: false,
  });

  // Active Modals
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showRememberModal, setShowRememberModal] = useState(false);
  const [showFindModal, setShowFindModal] = useState(false);
  const [findInitialQuery, setFindInitialQuery] = useState("");
  const [showScanSpaceModal, setShowScanSpaceModal] = useState(false);
  const [showLocationsModal, setShowLocationsModal] = useState(false);
  const [showBorrowedModal, setShowBorrowedModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [locationsInitialName, setLocationsInitialName] = useState<string | null>(null);
  const [rememberInitialLocation, setRememberInitialLocation] = useState<string>("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);

  // Load Initial Data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const fetchedSettings = await getSettings();
      setSettings(fetchedSettings);
      if (!fetchedSettings.hasCompletedOnboarding) {
        setShowOnboarding(true);
      }

      const fetchedItems = await getAllItems();
      setItems(fetchedItems);

      const fetchedSpaces = await getAllSpaces();
      setSpaces(fetchedSpaces);

      const fetchedBorrowed = await getAllBorrowedItems();
      setBorrowedItems(fetchedBorrowed);
    } catch (err) {
      console.warn("Failed to load initial storage data:", err);
    }
  };

  // Sync Dark Mode class on document
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.darkMode]);

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleCompleteOnboarding = async () => {
    setShowOnboarding(false);
    const updated = { ...settings, hasCompletedOnboarding: true };
    setSettings(updated);
    await saveSettings(updated);
  };

  const handleSaveItem = async (newItem: Item) => {
    setItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
    try {
      await saveItem(newItem);
      const updatedItems = await getAllItems();
      setItems(updatedItems);
    } catch (err) {
      console.warn("Error persisting saved item:", err);
    }
  };

  const handleUpdateItem = async (updatedItem: Item) => {
    setItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
    try {
      await saveItem(updatedItem);
      const updatedItems = await getAllItems();
      setItems(updatedItems);
    } catch (err) {
      console.warn("Error persisting updated item:", err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteItem(id);
      const updatedItems = await getAllItems();
      setItems(updatedItems);
    } catch (err) {
      console.warn("Error persisting deleted item:", err);
    }
  };

  const handleSaveSpace = async (newSpace: Space) => {
    setSpaces((prev) => [newSpace, ...prev.filter((s) => s.id !== newSpace.id)]);
    try {
      await saveSpace(newSpace);
      const updatedSpaces = await getAllSpaces();
      setSpaces(updatedSpaces);
      const updatedItems = await getAllItems();
      setItems(updatedItems);
    } catch (err) {
      console.warn("Error persisting saved space:", err);
    }
  };

  const handleDeleteSpace = async (id: string) => {
    await deleteSpace(id);
    const updatedSpaces = await getAllSpaces();
    setSpaces(updatedSpaces);
  };

  const handleSaveBorrowedItem = async (item: BorrowedItem) => {
    setBorrowedItems((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);
    try {
      await saveBorrowedItem(item);
      setBorrowedItems(await getAllBorrowedItems());
    } catch (err) {
      console.warn("Error persisting borrowed item:", err);
    }
  };

  const handleUpdateBorrowedItem = async (item: BorrowedItem) => {
    setBorrowedItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    try {
      await saveBorrowedItem(item);
      setBorrowedItems(await getAllBorrowedItems());
    } catch (err) {
      console.warn("Error persisting updated borrowed item:", err);
    }
  };

  const handleDeleteBorrowedItem = async (id: string) => {
    setBorrowedItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteBorrowedItem(id);
      setBorrowedItems(await getAllBorrowedItems());
    } catch (err) {
      console.warn("Error deleting borrowed item:", err);
    }
  };

  const handleResetDemoData = async () => {
    await resetDemoData();
    await loadAllData();
  };

  const handleClearAllData = async () => {
    await clearAllData();
    setItems([]);
    setSpaces([]);
  };

  const handleOpenFindWithQuery = (query?: string) => {
    setFindInitialQuery(query || "");
    setShowFindModal(true);
  };

  const handleOpenLocations = (locationName?: string) => {
    setLocationsInitialName(locationName || null);
    setShowLocationsModal(true);
  };

  const handleAddNewItemInLocation = (locationName: string) => {
    setShowLocationsModal(false);
    setRememberInitialLocation(locationName);
    setShowRememberModal(true);
  };

  const handleRememberNewSpot = (item: Item) => {
    setShowFindModal(false);
    setShowLocationsModal(false);
    setSelectedItem(null);
    setRememberInitialLocation("");
    setShowRememberModal(true);
  };

  const handleGoHome = () => {
    setShowOnboarding(false);
    setShowRememberModal(false);
    setShowFindModal(false);
    setShowScanSpaceModal(false);
    setShowLocationsModal(false);
    setShowSettingsModal(false);
    setShowBorrowedModal(false);
    setShowHelpModal(false);
    setSelectedItem(null);
    setSelectedSpace(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F4EF] dark:bg-[#161412] text-[#44433F] dark:text-[#E5E3DA] font-sans transition-colors duration-200 antialiased selection:bg-[#7CA65B] selection:text-white">
      {/* Header */}
      <Header
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenFind={() => handleOpenFindWithQuery("")}
        onOpenLocations={() => handleOpenLocations()}
        onOpenHelp={() => setShowHelpModal(true)}
        onGoHome={handleGoHome}
      />

      {/* Main Body */}
      <main className="max-w-2xl mx-auto px-4 py-5">
        <HomeScreen
          items={items}
          spaces={spaces}
          borrowedItems={borrowedItems}
          blurRecentlySaved={settings.blurRecentlySaved}
          blurLocationRecentlySaved={settings.blurLocationRecentlySaved}
          hideLocationsSection={settings.hideLocationsSection}
          hideBorrowedSection={settings.hideBorrowedSection}
          onOpenRemember={() => {
            setRememberInitialLocation("");
            setShowRememberModal(true);
          }}
          onOpenFind={handleOpenFindWithQuery}
          onOpenScanSpace={() => setShowScanSpaceModal(true)}
          onOpenLocations={handleOpenLocations}
          onOpenBorrowed={() => setShowBorrowedModal(true)}
          onSelectItem={(item) => setSelectedItem(item)}
          onSelectSpace={(space) => setSelectedSpace(space)}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onMarkBorrowedReturned={(item) =>
            handleUpdateBorrowedItem({ ...item, is_returned: true, returned_at: new Date().toISOString() })
          }
        />
      </main>

      {/* BOTTOM TAB BAR */}
      <BottomNav
        onGoHome={handleGoHome}
        onOpenFind={() => handleOpenFindWithQuery("")}
        onOpenRemember={() => {
          setRememberInitialLocation("");
          setShowRememberModal(true);
        }}
        onOpenScanSpace={() => setShowScanSpaceModal(true)}
        onOpenBorrowed={() => setShowBorrowedModal(true)}
        onOpenMore={() => setShowSettingsModal(true)}
        hideBorrowedSection={settings.hideBorrowedSection}
        activeOverdueCount={
          borrowedItems.filter(
            (b) =>
              !b.is_returned &&
              b.reminder_interval !== "none" &&
              b.next_reminder_at &&
              new Date(b.next_reminder_at).getTime() <= Date.now()
          ).length
        }
      />

      {/* MODALS */}
      {showOnboarding && (
        <OnboardingModal onComplete={handleCompleteOnboarding} />
      )}

      {showRememberModal && (
        <RememberModal
          onClose={() => {
            setShowRememberModal(false);
            setRememberInitialLocation("");
          }}
          onSave={handleSaveItem}
          existingItems={items}
          allowDuplicateItems={settings.allowDuplicateItems}
          initialLocation={rememberInitialLocation}
        />
      )}

      {showLocationsModal && (
        <LocationsModal
          items={items}
          spaces={spaces}
          initialLocationName={locationsInitialName}
          onClose={() => setShowLocationsModal(false)}
          onSelectItem={(item) => {
            setShowLocationsModal(false);
            setSelectedItem(item);
          }}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onAddNewItemInLocation={handleAddNewItemInLocation}
          onOpenRemember={() => {
            setShowLocationsModal(false);
            setRememberInitialLocation("");
            setShowRememberModal(true);
          }}
        />
      )}

      {showFindModal && (
        <FindModal
          items={items}
          initialQuery={findInitialQuery}
          onClose={() => setShowFindModal(false)}
          onSelectItem={(item) => {
            setShowFindModal(false);
            setSelectedItem(item);
          }}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onRememberNewSpot={handleRememberNewSpot}
          onOpenRemember={() => {
            setShowFindModal(false);
            setRememberInitialLocation("");
            setShowRememberModal(true);
          }}
        />
      )}

      {showScanSpaceModal && (
        <ScanSpaceModal
          onClose={() => setShowScanSpaceModal(false)}
          onSaveSpace={handleSaveSpace}
          autoSecondScanPass={settings.autoSecondScanPass}
        />
      )}

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
          onRememberNewSpot={handleRememberNewSpot}
        />
      )}

      {selectedSpace && (
        <SpaceDetailModal
          space={selectedSpace}
          allItems={items}
          onClose={() => setSelectedSpace(null)}
          onDeleteSpace={handleDeleteSpace}
          onUpdateSpace={handleSaveSpace}
          onSelectItem={(item) => {
            setSelectedSpace(null);
            setSelectedItem(item);
          }}
        />
      )}

      {showBorrowedModal && (
        <BorrowedModal
          borrowedItems={borrowedItems}
          onClose={() => setShowBorrowedModal(false)}
          onSave={handleSaveBorrowedItem}
          onUpdate={handleUpdateBorrowedItem}
          onDelete={handleDeleteBorrowedItem}
        />
      )}

      {showHelpModal && (
        <HelpModal
          onClose={() => setShowHelpModal(false)}
          onReplayTour={() => {
            setShowHelpModal(false);
            setShowOnboarding(true);
          }}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onResetDemoData={handleResetDemoData}
          onClearAllData={handleClearAllData}
          onClose={() => setShowSettingsModal(false)}
          onOpenHelp={() => {
            setShowSettingsModal(false);
            setShowHelpModal(true);
          }}
        />
      )}
    </div>
  );
}
