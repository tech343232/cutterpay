import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type ArtName = 'grow' | 'shield' | 'gift'

const ALT: Record<ArtName, string> = {
  grow: 'Planta de vidrio que brota de una pila de monedas',
  shield: 'Escudo de seguridad con un sobre de correo',
  gift: 'Billetera de regalo con monedas',
}

/**
 * Ilustración 3D (generada con IA) que flota, con halo de luz y partículas.
 * mix-blend-mode: screen hace invisible su fondo negro sobre el fondo oscuro de la app.
 */
export function FloatingArt({ name, size = 220, className, delay = 0 }: { name: ArtName; size?: number; className?: string; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <div className={cn('relative grid place-items-center', className)} style={{ width: size, height: size }} aria-hidden={false}>
      {/* halo que respira */}
      <motion.span
        aria-hidden
        className="absolute inset-[18%] rounded-full bg-aurora blur-3xl"
        initial={{ opacity: 0.25, scale: 0.9 }}
        animate={reduce ? undefined : { opacity: [0.25, 0.45, 0.25], scale: [0.9, 1.05, 0.9] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
      />
      {/* partículas que suben */}
      {!reduce &&
        [0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute h-1.5 w-1.5 rounded-full bg-ok"
            style={{ left: `${22 + i * 14}%`, bottom: '18%' }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -size * 0.55, opacity: [0, 1, 0] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: delay + i * 0.7, ease: 'easeOut' }}
          />
        ))}
      <motion.img
        src={`/img/${name}.jpg`}
        alt={ALT[name]}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="relative select-none mix-blend-screen"
        style={{
          // bordes que se desvanecen: el fondo negro de la imagen no se nota sobre ningún fondo
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 50%, transparent 70%)',
          maskImage: 'radial-gradient(circle at 50% 50%, #000 50%, transparent 70%)',
        }}
        initial={{ y: 0, rotate: 0 }}
        animate={reduce ? undefined : { y: [0, -10, 0], rotate: [0, 1.5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay }}
      />
    </div>
  )
}
