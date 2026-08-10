// Helper utility to generate realistic canvas SVG data URLs for demo items and scanned spaces

function xmlEscape(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function createSVGDataURL(
  width: number,
  height: number,
  bgGradient: [string, string],
  svgContent: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradient[0]}"/>
        <stop offset="100%" stop-color="${bgGradient[1]}"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.25"/>
      </filter>
    </defs>
    <rect width="${width}" height="${height}" rx="16" fill="url(#bg)"/>
    ${svgContent}
  </svg>`;

  try {
    const encoded = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${encoded}`;
  } catch (e) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}

// Sample Image Data URLs
export const DEMO_PHOTOS = {
  carKeys: createSVGDataURL(
    600,
    450,
    ["#f3f4f6", "#e5e7eb"],
    `<!-- Wooden Table Top -->
    <rect x="0" y="0" width="600" height="450" fill="#d97706" opacity="0.15"/>
    <path d="M 0 0 L 600 450 M 0 150 L 600 600 M 0 -150 L 600 300" stroke="#b45309" stroke-width="2" opacity="0.1"/>
    <!-- Red Bowl nearby -->
    <circle cx="480" cy="140" r="70" fill="#ef4444" filter="url(#shadow)"/>
    <circle cx="480" cy="140" r="50" fill="#dc2626"/>
    <!-- Car Keys -->
    <g filter="url(#shadow)" transform="translate(220, 200)">
      <!-- Key Ring -->
      <circle cx="50" cy="50" r="35" fill="none" stroke="#9ca3af" stroke-width="10"/>
      <circle cx="50" cy="50" r="35" fill="none" stroke="#e5e7eb" stroke-width="4"/>
      <!-- Key FOB -->
      <rect x="70" y="30" width="100" height="130" rx="20" fill="#1f2937"/>
      <rect x="85" y="45" width="70" height="40" rx="8" fill="#374151"/>
      <circle cx="120" cy="110" r="12" fill="#ef4444"/>
      <!-- Metallic Key -->
      <path d="M 35 75 L -40 130 L -30 140 L -20 130 L -10 140 L 10 120 L 25 85 Z" fill="#cbd5e1" stroke="#64748b" stroke-width="2"/>
    </g>
    <!-- Label Overlay -->
    <rect x="25" y="385" width="230" height="40" rx="8" fill="#111827" opacity="0.8"/>
    <text x="40" y="410" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="600">Hallway Table Location</text>`
  ),

  passport: createSVGDataURL(
    600,
    450,
    ["#f8fafc", "#f1f5f9"],
    `<!-- Drawer Interior -->
    <rect x="20" y="20" width="560" height="410" rx="12" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="8"/>
    <!-- Passport -->
    <g filter="url(#shadow)" transform="translate(180, 100) rotate(-6)">
      <rect x="0" y="0" width="180" height="250" rx="10" fill="#1e3a8a"/>
      <rect x="10" y="10" width="160" height="230" rx="6" fill="none" stroke="#fbbf24" stroke-width="2"/>
      <circle cx="90" cy="100" r="35" fill="none" stroke="#fbbf24" stroke-width="3"/>
      <text x="90" y="55" fill="#fbbf24" font-family="serif" font-size="20" font-weight="bold" text-anchor="middle">PASSPORT</text>
      <text x="90" y="170" fill="#fbbf24" font-family="serif" font-size="12" text-anchor="middle">OFFICIAL DOCUMENT</text>
    </g>
    <!-- Blue Notebook partially under -->
    <g filter="url(#shadow)" transform="translate(260, 180) rotate(12)">
      <rect x="0" y="0" width="190" height="220" rx="6" fill="#0284c7"/>
      <line x1="20" y1="0" x2="20" y2="220" stroke="#38bdf8" stroke-width="6"/>
      <text x="100" y="110" fill="#ffffff" font-family="sans-serif" font-size="14" text-anchor="middle">NOTES</text>
    </g>
    <rect x="25" y="385" width="220" height="40" rx="8" fill="#111827" opacity="0.8"/>
    <text x="40" y="410" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="600">Bedroom Cabinet Drawer</text>`
  ),

  aaBatteries: createSVGDataURL(
    600,
    450,
    ["#fef3c7", "#fde68a"],
    `<!-- Drawer Lining -->
    <rect x="0" y="0" width="600" height="450" fill="#fffbebe6"/>
    <!-- Battery Pack -->
    <g filter="url(#shadow)" transform="translate(160, 140)">
      <!-- 4 AA Batteries side by side -->
      <rect x="0" y="0" width="50" height="150" rx="8" fill="#000000"/>
      <rect x="0" y="30" width="50" height="90" fill="#f59e0b"/>
      <rect x="18" y="-10" width="14" height="10" fill="#9ca3af"/>

      <rect x="65" y="0" width="50" height="150" rx="8" fill="#000000"/>
      <rect x="65" y="30" width="50" height="90" fill="#f59e0b"/>
      <rect x="83" y="-10" width="14" height="10" fill="#9ca3af"/>

      <rect x="130" y="0" width="50" height="150" rx="8" fill="#000000"/>
      <rect x="130" y="30" width="50" height="90" fill="#f59e0b"/>
      <rect x="148" y="-10" width="14" height="10" fill="#9ca3af"/>

      <rect x="195" y="0" width="50" height="150" rx="8" fill="#000000"/>
      <rect x="195" y="30" width="50" height="90" fill="#f59e0b"/>
      <rect x="213" y="-10" width="14" height="10" fill="#9ca3af"/>

      <text x="140" y="80" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle">AA 1.5V</text>
    </g>
    <!-- Tape nearby -->
    <circle cx="470" cy="260" r="55" fill="#e2e8f0" stroke="#94a3b8" stroke-width="16" filter="url(#shadow)"/>
    <rect x="25" y="385" width="220" height="40" rx="8" fill="#111827" opacity="0.8"/>
    <text x="40" y="410" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="600">Kitchen Junk Drawer</text>`
  ),

  blueScrewdriver: createSVGDataURL(
    600,
    450,
    ["#e0f2fe", "#bae6fd"],
    `<!-- Toolbox Tray -->
    <rect x="30" y="30" width="540" height="390" rx="16" fill="#334155"/>
    <rect x="50" y="50" width="500" height="350" rx="12" fill="#1e293b"/>
    <!-- Blue Screwdriver -->
    <g filter="url(#shadow)" transform="translate(100, 210) rotate(-18)">
      <!-- Handle -->
      <rect x="0" y="-20" width="180" height="40" rx="12" fill="#2563eb"/>
      <rect x="20" y="-18" width="140" height="8" rx="4" fill="#60a5fa"/>
      <rect x="20" y="10" width="140" height="8" rx="4" fill="#1d4ed8"/>
      <!-- Shaft -->
      <rect x="180" y="-6" width="220" height="12" fill="#cbd5e1"/>
      <!-- Tip -->
      <polygon points="400,-6 425,-2 425,2 400,6" fill="#94a3b8"/>
    </g>
    <rect x="25" y="385" width="200" height="40" rx="8" fill="#111827" opacity="0.8"/>
    <text x="40" y="410" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="600">Garage Toolbox</text>`
  ),

  readingGlasses: createSVGDataURL(
    600,
    450,
    ["#fdf2f8", "#fce7f3"],
    `<!-- Nightstand Surface -->
    <rect x="0" y="0" width="600" height="450" fill="#fae8ff" opacity="0.5"/>
    <!-- Glasses -->
    <g filter="url(#shadow)" transform="translate(180, 180)">
      <!-- Frame Left -->
      <circle cx="60" cy="50" r="45" fill="#fbcfe8" opacity="0.3" stroke="#be185d" stroke-width="8"/>
      <!-- Frame Right -->
      <circle cx="190" cy="50" r="45" fill="#fbcfe8" opacity="0.3" stroke="#be185d" stroke-width="8"/>
      <!-- Bridge -->
      <path d="M 105 45 Q 125 35 145 45" fill="none" stroke="#be185d" stroke-width="8"/>
      <!-- Arms -->
      <path d="M 15 45 L -60 10" fill="none" stroke="#be185d" stroke-width="6"/>
      <path d="M 235 45 L 310 10" fill="none" stroke="#be185d" stroke-width="6"/>
    </g>
    <!-- Book nearby -->
    <rect x="350" y="240" width="180" height="140" rx="8" fill="#475569" filter="url(#shadow)"/>
    <rect x="25" y="385" width="220" height="40" rx="8" fill="#111827" opacity="0.8"/>
    <text x="40" y="410" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="600">Bedside Nightstand</text>`
  ),

  cameraCharger: createSVGDataURL(
    600,
    450,
    ["#f3f4f6", "#e5e7eb"],
    `<!-- Shelf surface -->
    <rect x="0" y="0" width="600" height="450" fill="#e5e7eb"/>
    <!-- Charger Block -->
    <g filter="url(#shadow)" transform="translate(200, 150)">
      <rect x="0" y="0" width="160" height="120" rx="14" fill="#111827"/>
      <rect x="20" y="20" width="120" height="80" rx="8" fill="#1f2937"/>
      <circle cx="120" cy="35" r="6" fill="#22c55e"/>
      <text x="80" y="65" fill="#9ca3af" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">CANON BATTERY</text>
      <!-- Cable -->
      <path d="M 80 120 C 80 200, 280 180, 280 260" fill="none" stroke="#374151" stroke-width="10"/>
      <!-- Plug -->
      <rect x="260" y="260" width="40" height="60" rx="6" fill="#111827"/>
    </g>
    <rect x="25" y="385" width="220" height="40" rx="8" fill="#111827" opacity="0.8"/>
    <text x="40" y="410" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="600">Office Desk Shelf</text>`
  ),

  officeJunkDrawerSpace: createSVGDataURL(
    800,
    600,
    ["#f1f5f9", "#e2e8f0"],
    `<!-- Drawer Box Frame -->
    <rect x="20" y="20" width="760" height="560" rx="20" fill="#cbd5e1" stroke="#94a3b8" stroke-width="12"/>
    <rect x="40" y="40" width="720" height="520" rx="12" fill="#f8fafc"/>

    <!-- Stapler (bbox approx 10%, 10% to 35%, 35%) -->
    <g filter="url(#shadow)" transform="translate(80, 80)">
      <rect x="0" y="0" width="180" height="70" rx="12" fill="#1e293b"/>
      <rect x="10" y="50" width="160" height="20" fill="#64748b"/>
      <text x="90" y="35" fill="#f8fafc" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">STAPLER</text>
    </g>

    <!-- Scissors (bbox approx 15%, 50% to 45%, 85%) -->
    <g filter="url(#shadow)" transform="translate(420, 100) rotate(15)">
      <path d="M 0 0 L 180 -20 M 0 20 L 180 40" stroke="#cbd5e1" stroke-width="16"/>
      <circle cx="-20" cy="-15" r="28" fill="#ef4444"/>
      <circle cx="-20" cy="25" r="28" fill="#ef4444"/>
    </g>

    <!-- AA Batteries (bbox approx 55%, 15% to 85%, 40%) -->
    <g filter="url(#shadow)" transform="translate(120, 340)">
      <rect x="0" y="0" width="35" height="110" rx="6" fill="#000000"/>
      <rect x="0" y="25" width="35" height="65" fill="#f59e0b"/>
      <rect x="45" y="0" width="35" height="110" rx="6" fill="#000000"/>
      <rect x="45" y="25" width="35" height="65" fill="#f59e0b"/>
      <rect x="90" y="0" width="35" height="110" rx="6" fill="#000000"/>
      <rect x="90" y="25" width="35" height="65" fill="#f59e0b"/>
    </g>

    <!-- Tape (bbox approx 55%, 55% to 85%, 85%) -->
    <g filter="url(#shadow)" transform="translate(500, 330)">
      <circle cx="70" cy="70" r="65" fill="#38bdf8"/>
      <circle cx="70" cy="70" r="35" fill="#ffffff"/>
    </g>

    <rect x="50" y="510" width="300" height="40" rx="8" fill="#0f172a" opacity="0.85"/>
    <text x="65" y="535" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold">SCANNED: Office Top Drawer</text>`
  ),
};

export function createTextNoteSVG(itemName: string, locationName: string): string {
  const safeItem = xmlEscape((itemName || "Saved Item").slice(0, 30));
  const safeLocation = xmlEscape((locationName || "Stored in home").slice(0, 35));
  
  return createSVGDataURL(
    600,
    450,
    ["#38332E", "#23201C"],
    `<!-- Background Card Design -->
    <rect x="30" y="30" width="540" height="390" rx="24" fill="#2E2A25" stroke="#4A443F" stroke-width="3"/>
    
    <!-- Pin Icon badge -->
    <circle cx="300" cy="140" r="48" fill="#6B7E6D" filter="url(#shadow)"/>
    <path d="M 292 125 L 308 125 L 308 140 L 318 155 L 282 155 L 292 140 Z" fill="#ffffff"/>
    <line x1="300" y1="155" x2="300" y2="175" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>

    <!-- Text overlay -->
    <text x="300" y="240" fill="#E8E4E1" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="bold" text-anchor="middle">${safeItem}</text>
    
    <rect x="100" y="280" width="400" height="50" rx="16" fill="#1E1B18"/>
    <text x="300" y="312" fill="#DA9E94" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="medium" text-anchor="middle">📍 ${safeLocation}</text>
    
    <text x="300" y="380" fill="#8C847E" font-family="system-ui, -apple-system, sans-serif" font-size="13" text-anchor="middle">Voice / Text Note Record</text>`
  );
}
