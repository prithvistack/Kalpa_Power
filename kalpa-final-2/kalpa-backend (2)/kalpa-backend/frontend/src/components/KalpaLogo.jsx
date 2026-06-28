/* KalpaLogo.jsx — Five solar-themed SVG logo concepts for Kalpa Power
 *
 * Usage (in-app icon, default):
 *   import KalpaLogo from './KalpaLogo';
 *   <KalpaLogo size={32} />            ← Concept 1: Solar Grid (default)
 *
 * Usage (picking a concept):
 *   import { LogoSunArc } from './KalpaLogo';
 *   <LogoSunArc size={64} />
 *
 * All logos use white fill so they render on any coloured container.
 * Pass fill="currentColor" to inherit CSS colour instead.
 */

/**
 * Concept 1 — Solar Grid  ★ DEFAULT
 * A 3×2 rectangular PV cell array with mounting rail.
 * Most immediately readable as "solar panels" at any size.
 * Recommended for production — clean, iconic, scalable to 16px.
 */
export function LogoSolarGrid({ size = 32, fill = 'white' }) {
  const cells = [
    [4, 4], [24, 4], [44, 4],
    [4, 36], [24, 36], [44, 36],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {cells.map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width={16} height={22} rx="2" fill={fill} fillOpacity={i % 3 === 1 ? 1 : 0.82} />
          <line x1={x + 8}  y1={y + 2}  x2={x + 8}  y2={y + 20} stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />
          <line x1={x + 2}  y1={y + 11} x2={x + 14} y2={y + 11} stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />
        </g>
      ))}
      {/* Mounting rail between rows */}
      <rect x="2" y="30" width="60" height="3" rx="1.5" fill={fill} fillOpacity="0.5" />
    </svg>
  );
}

/**
 * Concept 2 — Sun Arc
 * A minimalist rising-sun arc with horizontal rays above a solar panel bar.
 * Friendly and immediately "solar energy". Great for marketing materials.
 */
export function LogoSunArc({ size = 32, fill = 'white' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 32 A18 18 0 0 1 50 32" stroke={fill} strokeWidth="4" strokeLinecap="round" fill="none" />
      <line x1="32" y1="5"  x2="32" y2="13" stroke={fill} strokeWidth="3" strokeLinecap="round" />
      <line x1="51" y1="11" x2="46" y2="17" stroke={fill} strokeWidth="3" strokeLinecap="round" />
      <line x1="13" y1="11" x2="18" y2="17" stroke={fill} strokeWidth="3" strokeLinecap="round" />
      <line x1="58" y1="32" x2="50" y2="32" stroke={fill} strokeWidth="3" strokeLinecap="round" />
      <line x1="6"  y1="32" x2="14" y2="32" stroke={fill} strokeWidth="3" strokeLinecap="round" />
      <rect x="6"  y="40" width="52" height="16" rx="3" fill={fill} />
      <line x1="25" y1="40" x2="25" y2="56" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" />
      <line x1="39" y1="40" x2="39" y2="56" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" />
      <line x1="6"  y1="48" x2="58" y2="48" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" />
    </svg>
  );
}

/**
 * Concept 3 — Honeycomb Cell
 * Large outer hexagon with a centre core and 6 surrounding petals.
 * References photovoltaic silicon wafer geometry. Modern and tech-forward.
 */
export function LogoHexCell({ size = 32, fill = 'white' }) {
  const hexPath = (cx, cy, r) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    });
    return `M ${pts.join(' ')} Z`;
  };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={hexPath(32, 32, 28)} fill="none" stroke={fill} strokeWidth="2.5" />
      <path d={hexPath(32, 32, 11)} fill={fill} />
      {[0, 1, 2, 3, 4, 5].map(i => {
        const a = (Math.PI / 3) * i;
        return (
          <path
            key={i}
            d={hexPath(32 + 19 * Math.cos(a), 32 + 19 * Math.sin(a), 6)}
            fill={fill}
            fillOpacity={i % 2 === 0 ? 0.85 : 0.5}
          />
        );
      })}
    </svg>
  );
}

/**
 * Concept 4 — Leaf Panel
 * Leaf silhouette with horizontal cell lines inside.
 * Represents the union of renewable energy and nature. Works well in green themes.
 */
export function LogoLeafPanel({ size = 32, fill = 'white' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M32 58C32 58 7 44 7 22C7 10 18 4 32 8C46 4 57 10 57 22C57 44 32 58 32 58Z"
        fill={fill}
      />
      <line x1="32" y1="58" x2="32" y2="10"  stroke="rgba(0,0,0,0.2)"  strokeWidth="1.5"  strokeLinecap="round" />
      <line x1="13" y1="30" x2="51" y2="30"  stroke="rgba(0,0,0,0.15)" strokeWidth="1.2"  strokeLinecap="round" />
      <line x1="16" y1="22" x2="48" y2="22"  stroke="rgba(0,0,0,0.15)" strokeWidth="1.2"  strokeLinecap="round" />
      <line x1="16" y1="38" x2="48" y2="38"  stroke="rgba(0,0,0,0.15)" strokeWidth="1.2"  strokeLinecap="round" />
      <line x1="20" y1="46" x2="44" y2="46"  stroke="rgba(0,0,0,0.12)" strokeWidth="1.2"  strokeLinecap="round" />
    </svg>
  );
}

/**
 * Concept 5 — Smart Cell
 * A single large PV cell (2×2 grid) with a lightning-bolt overlay.
 * "Energy intelligence" — the platform's core proposition in one mark.
 * High contrast, works as an app icon at 512px.
 */
export function LogoSmartCell({ size = 32, fill = 'white' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="8" fill={fill} />
      <line x1="6"  y1="25" x2="58" y2="25" stroke="rgba(0,0,0,0.15)" strokeWidth="1.2" />
      <line x1="6"  y1="39" x2="58" y2="39" stroke="rgba(0,0,0,0.15)" strokeWidth="1.2" />
      <line x1="25" y1="6"  x2="25" y2="58" stroke="rgba(0,0,0,0.15)" strokeWidth="1.2" />
      <line x1="39" y1="6"  x2="39" y2="58" stroke="rgba(0,0,0,0.15)" strokeWidth="1.2" />
      <path
        d="M36 10L26 36L33 36L28 54L44 28L37 28Z"
        fill="rgba(0,0,0,0.2)"
      />
    </svg>
  );
}

/** Default export — Concept 1: Solar Grid (the in-app icon) */
export default function KalpaLogo({ size = 32, fill = 'white' }) {
  return <LogoSolarGrid size={size} fill={fill} />;
}
