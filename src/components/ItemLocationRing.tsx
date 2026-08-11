import React from "react";

interface ItemLocationRingProps {
  /** [ymin, xmin, ymax, xmax] in percentages 0-100, as stored on Item.bbox */
  bbox: [number, number, number, number];
}

/**
 * Highlights exactly where an item sits within a wider photo (e.g. a scanned
 * space) — a pulsing ring centered on the item's bounding box, sized to it.
 * Used anywhere an item with a `bbox` + shared space photo is shown, so the
 * user can spot it at a glance instead of hunting across the whole image.
 */
export const ItemLocationRing: React.FC<ItemLocationRingProps> = ({ bbox }) => {
  const [ymin, xmin, ymax, xmax] = bbox;
  const top = (ymin + ymax) / 2;
  const left = (xmin + xmax) / 2;
  const width = Math.max(xmax - xmin, 14);
  const height = Math.max(ymax - ymin, 14);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        width: `${width}%`,
        height: `${height}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <span className="absolute inset-0 rounded-full border-2 border-[#7CA65B] animate-ping opacity-75" />
      <span className="absolute inset-[-4px] rounded-full border-[3px] border-[#7CA65B] shadow-[0_0_12px_rgba(124,166,91,0.6)]" />
    </div>
  );
};
