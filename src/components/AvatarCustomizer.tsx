import React from "react";
import { AvatarConfig } from "../types";
import { Sparkles, Palette, HelpCircle, Save, Check } from "lucide-react";

interface Props {
  config: AvatarConfig;
  onChange: (config: AvatarConfig) => void;
  onSave?: () => void;
  saving?: boolean;
}

// Preset style arrays for the editor to render
export const SKIN_COLORS = [
  { value: "#F3C590", label: "Golden Honey" },
  { value: "#E0A96D", label: "Sunset Bronze" },
  { value: "#C5A880", label: "Copper Tone" },
  { value: "#F4D1AE", label: "Pale Peach" },
  { value: "#8D5524", label: "Midnight Coco" },
  { value: "#4E6E58", label: "Cyborg Emerald" }
];

export const HAIRSTYLES = [
  { value: "short_fade", label: "Fresh Buzz Fade" },
  { value: "dreads", label: "Heavy Dreadlocks" },
  { value: "mohawk", label: "Spiked Mohawk" },
  { value: "cyber_locks", label: "Hologram Locks" },
  { value: "bald", label: "Polished Chrome Bald" }
];

export const SHIRT_STYLES = [
  { value: "tshirt", label: "Street Tee" },
  { value: "hoodie", label: "Oversized Hoodie" },
  { value: "jersey", label: "All-Star Jersey" },
  { value: "leather_vest", label: "Anarchy Leather" },
  { value: "trench_coat", label: "Grid Trenchcoat" },
  { value: "flannel", label: "Grunge Flannel" }
];

export const HAT_STYLES = [
  { value: "none", label: "No Headwear" },
  { value: "headphones", label: "Studio DJ Cans" },
  { value: "backward_cap", label: "90s Retro Snapback" },
  { value: "crown", label: "Heavy Gold Crown" },
  { value: "beanie", label: "Street Knit Beanie" }
];

export const EARRING_STYLES = [
  { value: "none", label: "No Piercings" },
  { value: "gold_hoops", label: "Double Gold Hoops" },
  { value: "silver_stud", label: "VVS Diamond Stud" },
  { value: "golden_plug", label: "Heavy Gold Plugs" }
];

export const SUNGLASSES_STYLES = [
  { value: "none", label: "Eyes Open" },
  { value: "neon_orange", label: "Flame Orange Shades" },
  { value: "cyber_visor", label: "Cyber Punk Visor" },
  { value: "tinted_shades", label: "Dark Tint Aviators" },
  { value: "neon_matrix", label: "Green Rain Matrix Digits" }
];

export const EXPRESSIONS = [
  { value: "determined", label: "Ready to Spit" },
  { value: "smirk", label: "Arrogant Smirk" },
  { value: "roar", label: "Double-Time Spitfire" },
  { value: "neutral", label: "Silent Assasin" },
  { value: "evil_grin", label: "Grillz Smile (Gold Teeth)" }
];

export const MIC_STYLES = [
  { value: "classic", label: "Standard SM58" },
  { value: "gold", label: "Solid Gold Handheld" },
  { value: "red", label: "Neon Crimson Condenser" },
  { value: "vintage", label: "50s Chrome Swing Mic" },
  { value: "crystal", label: "Diamond Grid Cordless" },
  { value: "glowing", label: "Floating Plasma Mic" }
];

export const BG_STYLES = [
  { value: "underground_wall", label: "Concrete Dungeon" },
  { value: "glowing_rings", label: "Neon Orange Rings" },
  { value: "matrix", label: "Grid Data Rain" },
  { value: "fire", label: "Stage Pyro Flame" },
  { value: "bokeh", label: "Billboard Spotlights" },
  { value: "code_rain", label: "Cyber Orange Compiler" }
];

// Interactive SVG Avatar Drawing Node
export function RapperAvatar({ config, className = "w-full h-full" }: { config: AvatarConfig; className?: string }) {
  const { skinColor, hairstyle, shirtStyle, hatStyle, earringStyle, sunglassesStyle, expression, micStyle, bgStyle } = config;

  return (
    <svg viewBox="0 0 200 200" className={`${className} rounded-xl overflow-hidden shadow-2xl border-2 border-orange-500/20 bg-neutral-950`}>
      {/* Background Aura */}
      <defs>
        <radialGradient id="orangeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EA580C" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0B0B0B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fireGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#EA580C" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* RENDER BG STYLE */}
      {bgStyle === 'underground_wall' && (
        <>
          <rect width="200" height="200" fill="#1C1917" />
          <line x1="0" y1="70" x2="200" y2="70" stroke="#12100E" strokeWidth="3" />
          <line x1="0" y1="140" x2="200" y2="140" stroke="#12100E" strokeWidth="3" />
          <line x1="50" y1="0" x2="50" y2="70" stroke="#12100E" strokeWidth="2" />
          <line x1="150" y1="0" x2="150" y2="70" stroke="#12100E" strokeWidth="2" />
          <line x1="100" y1="70" x2="100" y2="140" stroke="#12100E" strokeWidth="2" />
          <line x1="30" y1="140" x2="30" y2="200" stroke="#12100E" strokeWidth="2" />
          <line x1="130" y1="140" x2="130" y2="200" stroke="#12100E" strokeWidth="2" />
          {/* Subtle graffiti tagging */}
          <path d="M 20 20 Q 30 10, 45 25 T 60 15" fill="none" stroke="#EA580C" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
          <text x="15" y="45" fill="#EA580C" fontSize="10" fontWeight="bold" opacity="0.25" fontFamily="monospace">SPITFIRE</text>
        </>
      )}

      {bgStyle === 'glowing_rings' && (
        <>
          <rect width="200" height="200" fill="#0A0A0A" />
          <rect width="200" height="200" fill="url(#orangeGlow)" />
          <circle cx="100" cy="100" r="80" fill="none" stroke="#F97316" strokeWidth="1" strokeDasharray="5, 10" opacity="0.3" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="#EA580C" strokeWidth="2" opacity="0.4" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="#EA580C" strokeWidth="1" opacity="0.5" />
        </>
      )}

      {bgStyle === 'matrix' && (
        <>
          <rect width="200" height="200" fill="#050805" />
          <text x="10" y="20" fill="#22C55E" fontSize="6" opacity="0.15" fontFamily="monospace">01101110 110100</text>
          <text x="150" y="40" fill="#22C55E" fontSize="6" opacity="0.2" fontFamily="monospace">R_BATTLE</text>
          <text x="25" y="80" fill="#22C55E" fontSize="7" opacity="0.1" fontFamily="monospace">SYS_BARS</text>
          <text x="120" y="150" fill="#22C55E" fontSize="6" opacity="0.15" fontFamily="monospace">FLOW_CO_V1</text>
          <line x1="40" y1="0" x2="40" y2="200" stroke="#22C55E" strokeWidth="0.5" opacity="0.1" strokeDasharray="3, 3" />
          <line x1="140" y1="0" x2="140" y2="200" stroke="#22C55E" strokeWidth="0.5" opacity="0.1" strokeDasharray="3, 3" />
        </>
      )}

      {bgStyle === 'fire' && (
        <>
          <rect width="200" height="200" fill="#120400" />
          <rect width="200" height="200" fill="url(#orangeGlow)" />
          <path d="M 0 200 Q 20 120, 40 180 T 80 140 T 120 170 T 160 130 T 200 200 Z" fill="url(#fireGrad)" opacity="0.6"/>
          <path d="M 10 200 Q 35 150, 60 190 T 110 160 T 150 180 T 190 200 Z" fill="url(#fireGrad)" opacity="0.8"/>
        </>
      )}

      {bgStyle === 'bokeh' && (
        <>
          <rect width="200" height="200" fill="#0D0D14" />
          <circle cx="40" cy="50" r="18" fill="#F97316" opacity="0.15" />
          <circle cx="160" cy="60" r="22" fill="#D97706" opacity="0.2" />
          <circle cx="100" cy="30" r="15" fill="#3B82F6" opacity="0.1" />
          <line x1="0" y1="0" x2="100" y2="200" stroke="#FFFFFF" strokeWidth="1" opacity="0.05" />
          <line x1="200" y1="0" x2="100" y2="200" stroke="#FFFFFF" strokeWidth="1" opacity="0.05" />
        </>
      )}

      {bgStyle === 'code_rain' && (
        <>
          <rect width="200" height="200" fill="#0A0600" />
          <text x="15" y="30" fill="#F97316" fontSize="7" opacity="0.2" fontFamily="monospace">compile(lyrics)</text>
          <text x="110" y="50" fill="#F97316" fontSize="7" opacity="0.15" fontFamily="monospace">assert true</text>
          <text x="20" y="150" fill="#F97316" fontSize="7" opacity="0.2" fontFamily="monospace">get_payout()</text>
          <text x="140" y="170" fill="#F97316" fontSize="7" opacity="0.2" fontFamily="monospace">rap_score: 99</text>
        </>
      )}

      {/* Body Shoulders */}
      {/* RENDER SHIRT STYLE */}
      {shirtStyle === 'tshirt' && (
        <path d="M 50 160 C 50 130, 150 130, 150 160 L 165 200 L 35 200 Z" fill="#FB923C" /> 
      )}
      {shirtStyle === 'hoodie' && (
        <>
          {/* Main hoodie body */}
          <path d="M 45 155 C 45 125, 155 125, 155 155 L 170 200 L 30 200 Z" fill="#262626" />
          <path d="M 60 142 C 60 142, 100 132, 140 142" stroke="#404040" strokeWidth="7" fill="none" strokeLinecap="round" />
          {/* DRAWSTRINGS */}
          <line x1="90" y1="145" x2="88" y2="180" stroke="#E5E5E5" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="110" y1="145" x2="112" y2="175" stroke="#E5E5E5" strokeWidth="2.5" strokeLinecap="round" />
          {/* Drawstring metal tips */}
          <circle cx="88" cy="180" r="1.5" fill="#D97706" />
          <circle cx="112" cy="175" r="1.5" fill="#D97706" />
        </>
      )}
      {shirtStyle === 'jersey' && (
        <>
          <path d="M 50 160 C 50 130, 150 130, 150 160 L 165 200 L 35 200 Z" fill="#EA580C" />
          {/* Sleeveless cuts */}
          <path d="M 50 160 L 58 178 L 48 200 L 35 200 Z" fill="#0F172A" />
          <path d="M 150 160 L 142 178 L 152 200 L 165 200 Z" fill="#0F172A" />
          {/* Yellow stripes */}
          <path d="M 75 145 L 75 200" stroke="#FBBF24" strokeWidth="4" />
          <path d="M 125 145 L 125 200" stroke="#FBBF24" strokeWidth="4" />
          {/* Jersey number */}
          <text x="100" y="185" fill="#FFFFFF" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">88</text>
        </>
      )}
      {shirtStyle === 'leather_vest' && (
        <>
          <path d="M 50 160 C 50 130, 150 130, 150 160 L 165 200 L 35 200 Z" fill="#F5E0C3" /> {/* bare chest */}
          <path d="M 48 160 L 80 160 L 85 200 L 35 200 Z" fill="#171717" /> {/* left vest block */}
          <path d="M 152 160 L 120 160 L 115 200 L 165 200 Z" fill="#171717" /> {/* right vest block */}
          {/* Metal spikes */}
          <polygon points="55,160 55,152 60,160" fill="#D4D4D8" />
          <polygon points="145,160 145,152 140,160" fill="#D4D4D8" />
          <circle cx="75" cy="180" r="2.5" fill="#FBBF24" />
          <circle cx="125" cy="180" r="2.5" fill="#FBBF24" />
        </>
      )}
      {shirtStyle === 'trench_coat' && (
        <>
          <path d="M 48 155 C 48 125, 152 125, 152 155 L 168 200 L 32 200 Z" fill="#1C1917" />
          {/* Orange high collar */}
          <polygon points="40,150 35,115 70,140" fill="#EA580C" />
          <polygon points="160,150 165,115 130,140" fill="#EA580C" />
          <path d="M 90 142 L 100 190 L 110 142" fill="#F97316" />
        </>
      )}
      {shirtStyle === 'flannel' && (
        <>
          <path d="M 50 160 C 50 130, 150 130, 150 160 L 165 200 L 35 200 Z" fill="#DC2626" />
          {/* Black flannel lines */}
          <line x1="75" y1="135" x2="75" y2="200" stroke="#000" strokeWidth="4" opacity="0.6" />
          <line x1="125" y1="135" x2="125" y2="200" stroke="#000" strokeWidth="4" opacity="0.6" />
          <line x1="35" y1="165" x2="165" y2="165" stroke="#000" strokeWidth="4" opacity="0.6" />
          <line x1="35" y1="185" x2="165" y2="185" stroke="#000" strokeWidth="4" opacity="0.6" />
          {/* Collar */}
          <polygon points="65,140 100,155 135,140 100,135" fill="#991B1B" />
        </>
      )}

      {/* Gold Medallion Neck Chain - Highly visual! */}
      <path d="M 70 145 Q 100 180, 130 145" fill="none" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="172" r="8" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
      <text x="100" y="175" fill="#78350F" fontSize="8" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">F</text> {/* Flow Token medallion */}

      {/* Rapper Neck */}
      <rect x="80" y="115" width="40" height="30" fill={skinColor} />
      {/* shadow under chin */}
      <rect x="80" y="115" width="40" height="6" fill="#111111" opacity="0.15" />

      {/* Ears */}
      <circle cx="75" cy="100" r="8" fill={skinColor} />
      <circle cx="125" cy="100" r="8" fill={skinColor} />

      {/* EARRING STYLE RENDER */}
      {earringStyle === 'gold_hoops' && (
        <>
          <circle cx="71" cy="103" r="6" fill="none" stroke="#FBBF24" strokeWidth="2.5" />
          <circle cx="129" cy="103" r="6" fill="none" stroke="#FBBF24" strokeWidth="2.5" />
        </>
      )}
      {earringStyle === 'silver_stud' && (
        <>
          <polygon points="73,101 76,104 73,107 70,104" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="0.5" />
          <polygon points="127,101 124,104 127,107 130,104" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="0.5" />
        </>
      )}
      {earringStyle === 'golden_plug' && (
        <>
          <circle cx="72" cy="104" r="3.5" fill="#D97706" stroke="#FBBF24" strokeWidth="1" />
          <circle cx="128" cy="104" r="3.5" fill="#D97706" stroke="#FBBF24" strokeWidth="1" />
        </>
      )}

      {/* Head Capsule */}
      <ellipse cx="100" cy="95" r="26" rx="26" ry="32" fill={skinColor} />

      {/* HAIR STYLES */}
      {hairstyle === 'short_fade' && (
        <>
          <path d="M 74 90 C 74 65, 126 65, 126 90 C 126 75, 74 75, 74 90 Z" fill="#262626" />
          {/* sideburn design cuts */}
          <polygon points="74,90 70,101 75,100" fill="#262626" />
          <polygon points="126,90 130,101 125,100" fill="#262626" />
        </>
      )}
      {hairstyle === 'dreads' && (
        <>
          {/* Heavy visual dreadlocks flowing down sides */}
          <rect x="67" y="65" width="8" height="60" rx="4" fill="#171717" />
          <rect x="125" y="65" width="8" height="60" rx="4" fill="#171717" />
          <rect x="60" y="70" width="8" height="50" rx="4" fill="#262626" />
          <rect x="132" y="70" width="8" height="50" rx="4" fill="#262626" />
          <rect x="74" y="60" width="52" height="15" rx="5" fill="#171717" />
          {/* Golden locks clips */}
          <rect x="67" y="90" width="8" height="4" fill="#FBBF24" />
          <rect x="132" y="100" width="8" height="4" fill="#FBBF24" />
          <rect x="125" y="85" width="8" height="4" fill="#FBBF24" />
        </>
      )}
      {hairstyle === 'mohawk' && (
        <>
          {/* Crazy spike mohawk down middle */}
          <path d="M 94 65 Q 100 20, 106 65 Z" fill="#DC2626" />
          <path d="M 97 65 Q 100 35, 103 65 Z" fill="#EA580C" />
          {/* faded sides */}
          <path d="M 74 90 C 74 80, 126 80, 126 90 Z" fill="#262626" silence="true" opacity="0.4" />
        </>
      )}
      {hairstyle === 'cyber_locks' && (
        <>
          {/* Glowing turquoise spikes */}
          <rect x="74" y="55" width="52" height="15" rx="4" fill="#0891B2" />
          <path d="M 70 70 Q 55 90, 68 115" fill="none" stroke="#22D3EE" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 130 70 Q 145 90, 132 115" fill="none" stroke="#22D3EE" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 100 55 Q 100 30, 95 25" fill="none" stroke="#22D3EE" strokeWidth="3" />
        </>
      )}

      {/* Eyes & Brows */}
      <rect x="85" y="82" width="10" height="2" fill="#262626" transform="rotate(-5, 90, 83)" />
      <rect x="105" y="82" width="10" height="2" fill="#262626" transform="rotate(5, 110, 83)" />
      <circle cx="90" cy="88" r="2.5" fill="#171717" />
      <circle cx="110" cy="88" r="2.5" fill="#171717" />
      <circle cx="91" cy="87" r="0.7" fill="#FFFFFF" />
      <circle cx="111" cy="87" r="0.7" fill="#FFFFFF" />

      {/* Mouth and Expression */}
      {expression === "determined" && (
        <path d="M 92 108 Q 100 106, 108 108" fill="none" stroke="#171717" strokeWidth="2.5" strokeLinecap="round" />
      )}
      {expression === "smirk" && (
        <path d="M 92 109 Q 104 112, 110 103" fill="none" stroke="#171717" strokeWidth="2.5" strokeLinecap="round" />
      )}
      {expression === "neutral" && (
        <line x1="93" y1="108" x2="107" y2="108" stroke="#171717" strokeWidth="2.5" strokeLinecap="round" />
      )}
      {expression === "roar" && (
        <>
          {/* Big open mouth spitting bars */}
          <ellipse cx="100" cy="111" rx="8" ry="5" fill="#7F1D1D" />
          <path d="M 95 109 Q 100 107, 105 109" fill="#FFFFFF" /> {/* Top teeth */}
        </>
      )}
      {expression === "evil_grin" && (
        <>
          {/* Golden Grillz smile */}
          <path d="M 91 107 Q 100 114, 109 107 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
          {/* tooth grids */}
          <line x1="95" y1="107" x2="96" y2="111" stroke="#451A03" strokeWidth="0.5" />
          <line x1="100" y1="107" x2="100" y2="112" stroke="#451A03" strokeWidth="0.5" />
          <line x1="105" y1="107" x2="104" y2="111" stroke="#451A03" strokeWidth="0.5" />
        </>
      )}

      {/* SUNGLASSES STYLE */}
      {sunglassesStyle === 'neon_orange' && (
        <>
          {/* Orange glowing visor wrap */}
          <polygon points="78,82 122,82 120,94 80,94" fill="#EA580C" opacity="0.9" stroke="#F97316" strokeWidth="1.5" />
          <line x1="78" y1="88" x2="122" y2="88" stroke="#FFF" strokeWidth="1" opacity="0.4" />
        </>
      )}
      {sunglassesStyle === 'cyber_visor' && (
        <>
          <polygon points="75,80 125,80 125,92 75,92" fill="#06B6D4" opacity="0.8" />
          <line x1="75" y1="86" x2="125" y2="86" stroke="#22D3EE" strokeWidth="1.5" />
          <circle cx="85" cy="86" r="1.5" fill="#FFFFFF" />
          <circle cx="115" cy="86" r="1.5" fill="#FFFFFF" />
        </>
      )}
      {sunglassesStyle === 'tinted_shades' && (
        <>
          {/* Classic black aviators */}
          <ellipse cx="90" cy="88" rx="8" ry="7" fill="#171717" stroke="#FBBF24" strokeWidth="1" />
          <ellipse cx="110" cy="88" rx="8" ry="7" fill="#171717" stroke="#FBBF24" strokeWidth="1" />
          <line x1="98" y1="84" x2="102" y2="84" stroke="#FBBF24" strokeWidth="1.5" />
        </>
      )}
      {sunglassesStyle === 'neon_matrix' && (
        <>
          <polygon points="77,84 123,84 121,93 79,93" fill="none" stroke="#22C55E" strokeWidth="2" />
          <rect x="80" y="86" width="40" height="5" fill="#000000" />
          {/* Little green matrix code dots inside lens */}
          <circle cx="85" cy="88" r="0.8" fill="#22C55E" />
          <circle cx="95" cy="89" r="0.8" fill="#22C55E" />
          <circle cx="105" cy="87" r="0.8" fill="#22C55E" />
          <circle cx="115" cy="88" r="0.8" fill="#22C55E" />
        </>
      )}

      {/* HEADWEAR STYLES */}
      {hatStyle === 'headphones' && (
        <>
          {/* Studio Headphone band over head */}
          <path d="M 72 80 A 28 28 0 0 1 128 80" fill="none" stroke="#171717" strokeWidth="6" />
          {/* Left and right ear cans */}
          <rect x="67" y="76" width="9" height="24" rx="3.5" fill="#F97316" stroke="#EA580C" strokeWidth="1.5" />
          <rect x="124" y="76" width="9" height="24" rx="3.5" fill="#F97316" stroke="#EA580C" strokeWidth="1.5" />
          {/* cord */}
          <path d="M 71 100 Q 65 140, 52 165" fill="none" stroke="#171717" strokeWidth="1.5" />
        </>
      )}
      {hatStyle === 'backward_cap' && (
        <>
          {/* Cap block angled back */}
          <path d="M 74 72 Q 100 52, 126 72 Z" fill="#EA580C" />
          {/* snap visor directed back */}
          <path d="M 72 70 Q 52 64, 76 60 Z" fill="#1E293B" />
          {/* cap button */}
          <circle cx="100" cy="58" r="2.5" fill="#171717" />
        </>
      )}
      {hatStyle === 'crown' && (
        <>
          {/* Golden heavy crown */}
          <polygon points="76,64 72,40 88,52 100,32 112,52 128,40 124,64" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
          {/* Rubies */}
          <circle cx="88" cy="54" r="1.5" fill="#EF4444" />
          <circle cx="100" cy="46" r="1.5" fill="#3B82F6" />
          <circle cx="112" cy="54" r="1.5" fill="#EF4444" />
        </>
      )}
      {hatStyle === 'beanie' && (
        <>
          {/* Knitted custom warm roll beanie */}
          <path d="M 74 72 C 74 48, 126 48, 126 72 Z" fill="#0284C7" />
          <rect x="71" y="66" width="58" height="10" rx="3" fill="#0369A1" />
          {/* Pom pom */}
          <circle cx="100" cy="48" r="6" fill="#F1F5F9" />
        </>
      )}

      {/* MICROPHONE OVERLAY HAND */}
      {/* We represent a stylized microphone held close or floating near mouth */}
      {micStyle === 'classic' && (
        <>
          {/* Grey standard handheld mic gracing the bottom left mouth area */}
          <rect x="55" y="115" width="6" height="35" rx="1.5" fill="#4B5563" transform="rotate(-30, 58, 115)" />
          <circle cx="43" cy="104" r="7.5" fill="#9CA3AF" stroke="#6B7280" strokeWidth="1" />
          <text x="40" y="106" fill="#4B5563" fontSize="5" fontWeight="bold">|||</text>
        </>
      )}

      {micStyle === 'gold' && (
        <>
          <rect x="55" y="115" width="6" height="35" rx="1.5" fill="#D97706" transform="rotate(-30, 58, 115)" />
          <circle cx="43" cy="104" r="8" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
          {/* sparkle on gold mic */}
          <polygon points="43,96 45,99 48,100 45,101 43,104 41,101 38,100 41,99" fill="#FFF" />
        </>
      )}

      {micStyle === 'red' && (
        <>
          <rect x="55" y="115" width="6" height="35" rx="1.5" fill="#18181B" transform="rotate(-30, 58, 115)" />
          <circle cx="43" cy="104" r="7.5" fill="#EF4444" stroke="#B91C1C" strokeWidth="1" />
          <circle cx="43" cy="104" r="5" fill="none" stroke="#FFA3A3" strokeWidth="1" opacity="0.7" />
        </>
      )}

      {micStyle === 'vintage' && (
        <>
          {/* Classic 50s square ribbed mic on high metal stand */}
          <line x1="30" y1="200" x2="50" y2="115" stroke="#9CA3AF" strokeWidth="2.5" />
          <rect x="42" y="98" width="13" height="18" rx="3" fill="#D1D5DB" stroke="#4B5563" strokeWidth="1.5" />
          {/* Horizontal chrome ribs */}
          <line x1="44" y1="102" x2="53" y2="102" stroke="#4B5563" strokeWidth="1" />
          <line x1="44" y1="106" x2="53" y2="106" stroke="#4B5563" strokeWidth="1" />
          <line x1="44" y1="110" x2="53" y2="110" stroke="#4B5563" strokeWidth="1" />
        </>
      )}

      {micStyle === 'crystal' && (
        <>
          <rect x="55" y="115" width="6" height="35" rx="1.5" fill="#0F172A" transform="rotate(-30, 58, 115)" />
          <circle cx="43" cy="104" r="8.5" fill="#38BDF8" stroke="#E0F2FE" strokeWidth="1" opacity="0.9" />
          {/* Crystal grid facets */}
          <line x1="36" y1="104" x2="51" y2="104" stroke="#FFF" strokeWidth="0.5" opacity="0.7" />
          <line x1="43" y1="96" x2="43" y2="111" stroke="#FFF" strokeWidth="0.5" opacity="0.7" />
        </>
      )}

      {micStyle === 'glowing' && (
        <>
          {/* Floating neon ring plasma microphone */}
          <rect x="56" y="125" width="4" height="25" rx="1" fill="#22D3EE" opacity="0.4" transform="rotate(-40, 56, 125)" />
          <circle cx="40" cy="105" r="9" fill="none" stroke="#22D3EE" strokeWidth="2" strokeDasharray="4,2" />
          <circle cx="40" cy="105" r="5" fill="#22D3EE" opacity="0.8" />
        </>
      )}
    </svg>
  );
}

export default function AvatarCustomizer({ config, onChange, onSave, saving = false }: Props) {
  const randomize = () => {
    const r = <T,>(arr: { value: T }[]): T => arr[Math.floor(Math.random() * arr.length)].value;
    onChange({
      skinColor: r(SKIN_COLORS),
      hairstyle: r(HAIRSTYLES),
      shirtStyle: r(SHIRT_STYLES),
      hatStyle: r(HAT_STYLES),
      earringStyle: r(EARRING_STYLES),
      sunglassesStyle: r(SUNGLASSES_STYLES),
      expression: r(EXPRESSIONS),
      micStyle: r(MIC_STYLES),
      bgStyle: r(BG_STYLES)
    });
  };

  const selectProp = (key: keyof AvatarConfig, value: string) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-white p-4">
      {/* LEFT: Live Preview */}
      <div className="lg:col-span-5 flex flex-col items-center justify-start sticky top-4">
        <h3 className="text-xl font-bold tracking-wider text-orange-500 mb-4 uppercase font-sans">
          Identity Matrix
        </h3>
        <div className="w-full max-w-[280px] aspect-square mb-6">
          <RapperAvatar config={config} />
        </div>

        <div className="flex gap-4 w-full max-w-[280px]">
          <button
            onClick={randomize}
            className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all text-xs font-bold tracking-widest uppercase border border-neutral-700 rounded-lg flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-orange-500" />
            Randomize
          </button>
          
          {onSave && (
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800 disabled:cursor-not-allowed text-xs font-bold tracking-widest uppercase rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Lock In
                </>
              )}
            </button>
          )}
        </div>
        <p className="mt-4 text-xs text-neutral-400 text-center px-4 leading-relaxed max-w-[280px]">
          Lock in your setup. Your custom avatar represents you in the arena and is visible globally.
        </p>
      </div>

      {/* RIGHT: Customize Editor Rails */}
      <div className="lg:col-span-7 space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-orange-500">
        
        {/* Skin selection */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">Skin Shade</label>
          <div className="grid grid-cols-6 gap-2">
            {SKIN_COLORS.map(item => (
              <button
                key={item.value}
                onClick={() => selectProp("skinColor", item.value)}
                className={`w-full aspect-square rounded-lg border-2 transition-all flex items-center justify-center ${
                  config.skinColor === item.value ? 'border-orange-500 scale-105 shadow-md shadow-orange-500/20' : 'border-neutral-800 hover:border-neutral-500'
                }`}
                style={{ backgroundColor: item.value }}
                title={item.label}
              >
                {config.skinColor === item.value && <Check className="w-4 h-4 text-neutral-950 font-bold" />}
              </button>
            ))}
          </div>
        </div>

        {/* Hairstyle */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">Crown & Locks (Hair)</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {HAIRSTYLES.map(item => (
              <button
                key={item.value}
                onClick={() => selectProp("hairstyle", item.value)}
                className={`py-2 px-3 text-xs bg-neutral-900 border rounded-lg text-left transition-all ${
                  config.hairstyle === item.value ? 'border-orange-500 text-orange-500 bg-orange-500/5 font-semibold' : 'border-neutral-800 hover:border-neutral-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shirt Style */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">Streetwear (Outfit)</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SHIRT_STYLES.map(item => (
              <button
                key={item.value}
                onClick={() => selectProp("shirtStyle", item.value)}
                className={`py-2 px-3 text-xs bg-neutral-900 border rounded-lg text-left transition-all ${
                  config.shirtStyle === item.value ? 'border-orange-500 text-orange-500 bg-orange-500/5 font-semibold' : 'border-neutral-800 hover:border-neutral-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hat Style */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">Hats & Headwear</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {HAT_STYLES.map(item => (
              <button
                key={item.value}
                onClick={() => selectProp("hatStyle", item.value)}
                className={`py-2 px-3 text-xs bg-neutral-900 border rounded-lg text-left transition-all ${
                  config.hatStyle === item.value ? 'border-orange-500 text-orange-500 bg-orange-500/5 font-semibold' : 'border-neutral-800 hover:border-neutral-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sunglasses */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">Eyewear (Shades)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUNGLASSES_STYLES.map(item => (
              <button
                key={item.value}
                onClick={() => selectProp("sunglassesStyle", item.value)}
                className={`py-2 px-3 text-xs bg-neutral-900 border rounded-lg text-left transition-all ${
                  config.sunglassesStyle === item.value ? 'border-orange-500 text-orange-500 bg-orange-500/5 font-semibold' : 'border-neutral-800 hover:border-neutral-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Expression */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">Facial Grillz & Vibe</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EXPRESSIONS.map(item => (
              <button
                key={item.value}
                onClick={() => selectProp("expression", item.value)}
                className={`py-2 px-3 text-xs bg-neutral-900 border rounded-lg text-left transition-all ${
                  config.expression === item.value ? 'border-orange-500 text-orange-500 bg-orange-500/5 font-semibold' : 'border-neutral-800 hover:border-neutral-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Microphone */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">Mic setup</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MIC_STYLES.map(item => (
              <button
                key={item.value}
                onClick={() => selectProp("micStyle", item.value)}
                className={`py-2 px-3 text-xs bg-neutral-900 border rounded-lg text-left transition-all ${
                  config.micStyle === item.value ? 'border-orange-500 text-orange-500 bg-orange-500/5 font-semibold' : 'border-neutral-800 hover:border-neutral-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Earings */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">Jewelry & Bling</label>
          <div className="grid grid-cols-2 gap-2">
            {EARRING_STYLES.map(item => (
              <button
                key={item.value}
                onClick={() => selectProp("earringStyle", item.value)}
                className={`py-2 px-3 text-xs bg-neutral-900 border rounded-lg text-left transition-all ${
                  config.earringStyle === item.value ? 'border-orange-500 text-orange-500 bg-orange-500/5 font-semibold' : 'border-neutral-800 hover:border-neutral-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Background */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">Studio Backdrop (Stage Aura)</label>
          <div className="grid grid-cols-2 gap-2">
            {BG_STYLES.map(item => (
              <button
                key={item.value}
                onClick={() => selectProp("bgStyle", item.value)}
                className={`py-2 px-3 text-xs bg-neutral-900 border rounded-lg text-left transition-all ${
                  config.bgStyle === item.value ? 'border-orange-500 text-orange-500 bg-orange-500/5 font-semibold' : 'border-neutral-800 hover:border-neutral-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
