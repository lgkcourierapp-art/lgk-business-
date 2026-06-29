// ─── LgkIcon — Next.js wrapper for the LGK Icon Pack ─────────────
// Renders inline SVG from lib/lgk-icon-pack.js. Same glyph data as
// the courier app (lgk-courier/src/components/Icon.js). Same brand
// silhouette across both stacks.
//
// Usage:
//   import LgkIcon from '@/components/LgkIcon'
//   <LgkIcon name="coins" size={20} color="#D4FF00" />
//   <LgkIcon name="menu" />  // defaults to size 20, currentColor
//
// Available names (see lib/lgk-icon-pack.js for canonical list):
//   menu · home · chevron-right · x · plus
//   route · map · package
//   coins · wallet · mileage · payouts
//   star · flame · map-pin · pulse · bolt
//   user · settings · bell · lock · power

'use client'
import { LGK_ICON_PACK } from '@/lib/lgk-icon-pack'

export default function LgkIcon({ name, size = 20, color = 'currentColor' }) {
  const icon = LGK_ICON_PACK[name]
  if (!icon) return null

  const sw = icon.strokeWidth ?? 1.5

  return (
    <svg
      width={size}
      height={size}
      viewBox={icon.viewBox}
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {icon.elements.map((el, i) => {
        const fill = el.fill ?? (el.fillSelf ? color : 'none')
        const fillOpacity = el.fillOpacity ?? 1
        const opacity = el.opacity ?? 1

        if (el.type === 'line') {
          return <line key={i} x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} opacity={opacity} />
        }
        if (el.type === 'path') {
          return <path key={i} d={el.d} fill={fill} fillOpacity={fillOpacity} opacity={opacity} />
        }
        if (el.type === 'circle') {
          return <circle key={i} cx={el.cx} cy={el.cy} r={el.r} fill={fill} fillOpacity={fillOpacity} opacity={opacity} />
        }
        if (el.type === 'rect') {
          return <rect key={i} x={el.x} y={el.y} width={el.width} height={el.height} rx={el.rx} opacity={opacity} />
        }
        if (el.type === 'polyline') {
          return <polyline key={i} points={el.points} fill="none" opacity={opacity} />
        }
        return null
      })}
    </svg>
  )
}
