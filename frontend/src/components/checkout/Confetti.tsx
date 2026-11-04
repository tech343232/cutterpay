import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const COLORS = ['#FF6FB5', '#C94BE0', '#9B8CFF', '#4FD1A5', '#FFA04D', '#FFF8F2']

/** Lluvia corta de confeti para celebrar una inversión. */
export function Confetti({ count = 28 }: { count?: number }) {
  const reduce = useReducedMotion()
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 340,
        y: -120 - Math.random() * 140,
        r: Math.random() * 540 - 270,
        size: 6 + Math.random() * 6,
        color: COLORS[i % COLORS.length],
        round: Math.random() > 0.5,
        delay: Math.random() * 0.15,
      })),
    [count],
  )
  if (reduce) return null
  return (
    <div className="pointer-events-none absolute left-1/2 top-24 z-10" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute block"
          style={{ width: p.size, height: p.size * (p.round ? 1 : 0.5), background: p.color, borderRadius: p.round ? 999 : 2 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: [0, p.x * 0.7, p.x], y: [0, p.y, p.y + 260], opacity: [1, 1, 0], rotate: p.r }}
          transition={{ duration: 1.6, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}
