// ─── LGK Icon Pack — portable across React Native + Next.js + vanilla ─
// One source of truth for the LGK glyph set. The courier app's
// src/components/Icon.js renders these via react-native-svg; lgk-business
// (Next.js) renders the same data via inline <svg>. Same paths, same
// strokes, same brand silhouette everywhere.
//
// To use in lgk-business (Next.js / React):
//   1. Copy this file to lgk-business: e.g. lib/lgk-icon-pack.js
//   2. Wrap in a component (see <LgkIcon> example at the bottom).
//   3. <LgkIcon name="menu" size={20} color="#000" />
//
// To add a new icon: add the entry here, then also export it from
// src/components/Icon.js (RN side) so both stacks pick it up.
//
// Defaults: strokeWidth 1.5, viewBox 24×24, fill="none",
// strokeLinecap="round", strokeLinejoin="round".

export const LGK_ICON_PACK = {
  // ─── Navigation ──────────────────────────────────────────────────
  menu: {
    viewBox: '0 0 24 24',
    strokeWidth: 1.75,
    elements: [
      { type: 'line', x1: 4, y1: 7,  x2: 20, y2: 7  },
      { type: 'line', x1: 4, y1: 12, x2: 14, y2: 12 },
      { type: 'line', x1: 4, y1: 17, x2: 20, y2: 17 },
    ],
  },
  home: {
    viewBox: '0 0 24 24',
    elements: [
      { type: 'path', d: 'M3 11l9-7 9 7v9a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-6v6H4.5A1.5 1.5 0 0 1 3 20z' },
    ],
  },
  'chevron-right': {
    viewBox: '0 0 24 24',
    strokeWidth: 1.75,
    elements: [{ type: 'polyline', points: '9 18 15 12 9 6' }],
  },
  x: {
    viewBox: '0 0 24 24',
    strokeWidth: 2,
    elements: [
      { type: 'line', x1: 18, y1: 6, x2: 6,  y2: 18 },
      { type: 'line', x1: 6,  y1: 6, x2: 18, y2: 18 },
    ],
  },
  plus: {
    viewBox: '0 0 24 24',
    strokeWidth: 1.75,
    elements: [
      { type: 'line', x1: 12, y1: 5,  x2: 12, y2: 19 },
      { type: 'line', x1: 5,  y1: 12, x2: 19, y2: 12 },
    ],
  },

  // ─── Today ───────────────────────────────────────────────────────
  route: {
    viewBox: '0 0 24 24',
    elements: [
      { type: 'circle', cx: 5,  cy: 6,  r: 2 },
      { type: 'circle', cx: 19, cy: 18, r: 2 },
      { type: 'path', d: 'M5 8c0 4 4 4 7 4s7 2 7 6' },
    ],
  },
  map: {
    viewBox: '0 0 24 24',
    elements: [
      { type: 'path', d: 'M3 6.5l5.5-2 7 2 5.5-2v13l-5.5 2-7-2-5.5 2z' },
      { type: 'path', d: 'M8.5 4.5v13M15.5 6.5v13' },
    ],
  },
  package: {
    viewBox: '0 0 24 24',
    elements: [
      { type: 'path', d: 'M16.5 9.4 7.5 4.21' },
      { type: 'path', d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' },
      { type: 'polyline', points: '3.27 6.96 12 12.01 20.73 6.96' },
      { type: 'line', x1: 12, y1: 22.08, x2: 12, y2: 12 },
    ],
  },

  // ─── My money ────────────────────────────────────────────────────
  coins: {
    viewBox: '0 0 24 24',
    elements: [
      { type: 'path', d: 'M3 7c0-1.7 4-3 9-3s9 1.3 9 3-4 3-9 3-9-1.3-9-3z' },
      { type: 'path', d: 'M3 7v4c0 1.7 4 3 9 3s9-1.3 9-3V7' },
      { type: 'path', d: 'M3 11v4c0 1.7 4 3 9 3s9-1.3 9-3v-4' },
      { type: 'path', d: 'M3 15v3c0 1.7 4 3 9 3s9-1.3 9-3v-3' },
    ],
  },
  wallet: {
    viewBox: '0 0 24 24',
    elements: [
      { type: 'path', d: 'M3 7.5C3 6.1 4.1 5 5.5 5h12A2.5 2.5 0 0 1 20 7.5V8h-2.5C16.1 8 15 9.1 15 10.5v1c0 1.4 1.1 2.5 2.5 2.5H20v3.5a2.5 2.5 0 0 1-2.5 2.5h-12A2.5 2.5 0 0 1 3 17.5z' },
      { type: 'circle', cx: 17.5, cy: 11, r: 1, fillSelf: true },
    ],
  },
  mileage: {
    viewBox: '0 0 24 24',
    elements: [
      { type: 'path', d: 'M3 13.5a9 9 0 0 1 18 0' },
      { type: 'path', d: 'M12 13.5L15.5 8' },
      { type: 'circle', cx: 12, cy: 13.5, r: 1.4, fillSelf: true },
      { type: 'path', d: 'M5 17h2M17 17h2M11.2 18.2h1.6' },
    ],
  },
  payouts: {
    viewBox: '0 0 24 24',
    elements: [
      { type: 'rect', x: 3.5, y: 5.5, width: 17, height: 15, rx: 2 },
      { type: 'line', x1: 3.5, y1: 10,  x2: 20.5, y2: 10 },
      { type: 'line', x1: 8,   y1: 3.5, x2: 8,    y2: 7 },
      { type: 'line', x1: 16,  y1: 3.5, x2: 16,   y2: 7 },
      { type: 'path', d: 'M9 15h4.5M11 13l2.5 2-2.5 2' },
    ],
  },

  // ─── My data ─────────────────────────────────────────────────────
  star: {
    viewBox: '0 0 24 24',
    elements: [
      { type: 'path', d: 'M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M5.5 18.5l2.1-2.1M16.4 7.6l2.1-2.1' },
      { type: 'path', d: 'M12 8.5l2 3.5-2 3.5-2-3.5z' },
    ],
  },
  flame: {
    viewBox: '0 0 24 24',
    elements: [
      { type: 'path', d: 'M12 3c0 3.5 2 5 4 7s2.5 4.5 1.5 7-4 4-5.5 4-4.5-1.5-5.5-4 1-5 1.5-6.5' },
      { type: 'path', d: 'M12 11c1 1 1.5 2.5 0.5 4s-3 1.5-3.5 0' },
    ],
  },
  'map-pin': {
    viewBox: '0 0 24 24',
    elements: [
      { type: 'path', d: 'M19 10c0 6-7 11-7 11s-7-5-7-11a7 7 0 0 1 14 0z' },
      { type: 'circle', cx: 12, cy: 10, r: 2 },
      { type: 'path', d: 'M3 4.5c1.5 0 3 1 3 3M21 4.5c-1.5 0-3 1-3 3', opacity: 0.7 },
    ],
  },
  pulse: {
    viewBox: '0 0 24 24',
    strokeWidth: 1.75,
    elements: [{ type: 'path', d: 'M2 12h4l2-5 4 10 2-5h8' }],
  },
  bolt: {
    viewBox: '0 0 24 24',
    elements: [
      { type: 'path', d: 'M13 3 4 14h6l-1 7 9-11h-6z', fillSelf: true, fillOpacity: 0.12 },
    ],
  },

  // ─── Account ─────────────────────────────────────────────────────
  user: {
    viewBox: '0 0 24 24',
    elements: [
      { type: 'circle', cx: 12, cy: 8, r: 3.5 },
      { type: 'path', d: 'M4.5 21c0-3.6 3.4-6.5 7.5-6.5s7.5 2.9 7.5 6.5' },
    ],
  },
  settings: {
    viewBox: '0 0 24 24',
    elements: [
      { type: 'line', x1: 4, y1: 7,  x2: 20, y2: 7 },
      { type: 'line', x1: 4, y1: 12, x2: 20, y2: 12 },
      { type: 'line', x1: 4, y1: 17, x2: 20, y2: 17 },
      { type: 'circle', cx: 9,  cy: 7,  r: 2.2, fill: '#0A0A0A' },
      { type: 'circle', cx: 15, cy: 12, r: 2.2, fill: '#0A0A0A' },
      { type: 'circle', cx: 8,  cy: 17, r: 2.2, fill: '#0A0A0A' },
    ],
  },
  bell: {
    viewBox: '0 0 24 24',
    elements: [
      { type: 'path', d: 'M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5z' },
      { type: 'path', d: 'M10 19a2 2 0 0 0 4 0' },
    ],
  },
  lock: {
    viewBox: '0 0 24 24',
    elements: [
      { type: 'rect', x: 3.5, y: 10.5, width: 17, height: 11.5, rx: 2.5 },
      { type: 'path', d: 'M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5' },
      { type: 'circle', cx: 12, cy: 16, r: 1.2, fillSelf: true },
    ],
  },
  power: {
    viewBox: '0 0 24 24',
    strokeWidth: 1.75,
    elements: [
      { type: 'path', d: 'M7 6a8 8 0 1 0 10 0' },
      { type: 'line', x1: 12, y1: 3, x2: 12, y2: 12 },
    ],
  },
};

// ─── Example Next.js / vanilla React wrapper ──────────────────────
//
// import { LGK_ICON_PACK } from './lgk-icon-pack';
//
// export function LgkIcon({ name, size = 20, color = 'currentColor' }) {
//   const icon = LGK_ICON_PACK[name];
//   if (!icon) return null;
//   const sw = icon.strokeWidth ?? 1.5;
//   return (
//     <svg
//       width={size}
//       height={size}
//       viewBox={icon.viewBox}
//       fill="none"
//       stroke={color}
//       strokeWidth={sw}
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       {icon.elements.map((el, i) => {
//         const fill = el.fill ?? (el.fillSelf ? color : 'none');
//         const fillOpacity = el.fillOpacity ?? 1;
//         const opacity = el.opacity ?? 1;
//         if (el.type === 'line')
//           return <line key={i} x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} opacity={opacity} />;
//         if (el.type === 'path')
//           return <path key={i} d={el.d} fill={fill} fillOpacity={fillOpacity} opacity={opacity} />;
//         if (el.type === 'circle')
//           return <circle key={i} cx={el.cx} cy={el.cy} r={el.r} fill={fill} fillOpacity={fillOpacity} opacity={opacity} />;
//         if (el.type === 'rect')
//           return <rect key={i} x={el.x} y={el.y} width={el.width} height={el.height} rx={el.rx} opacity={opacity} />;
//         if (el.type === 'polyline')
//           return <polyline key={i} points={el.points} fill="none" opacity={opacity} />;
//         return null;
//       })}
//     </svg>
//   );
// }
//
// Usage: <LgkIcon name="coins" size={20} color="#D4FF00" />
