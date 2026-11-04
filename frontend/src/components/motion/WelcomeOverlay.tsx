import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LogoIcon } from '@/components/brand/Logo'

const KEY = 'cp_welcome'

/** Se marca al iniciar sesión o crear cuenta; el panel lo muestra una vez al entrar. */
export function markWelcome(name: string, kind: 'login' | 'registro') {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ name, kind }))
  } catch {
    /* modo privado */
  }
}

/** Animación de bienvenida al entrar a CUTTERPAY: logo que se arma, destellos y saludo. */
export function WelcomeOverlay() {
  const [data, setData] = useState<{ name: string; kind: 'login' | 'registro' } | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY)
      if (raw) {
        sessionStorage.removeItem(KEY)
        setData(JSON.parse(raw))
      }
    } catch {
      /* sin almacenamiento */
    }
  }, [])

  useEffect(() => {
    if (!data) return
    const id = setTimeout(() => setData(null), 2300)
    return () => clearTimeout(id)
  }, [data])

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          key="welcome"
          className="fixed inset-0 z-[70] grid place-items-center bg-bg/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          onClick={() => setData(null)}
          role="status"
        >
          <div className="relative flex flex-col items-center gap-5 px-6 text-center">
            {/* anillos que se expanden */}
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute left-1/2 top-[56px] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/50"
                initial={{ scale: 0.6, opacity: 0.8 }}
                animate={{ scale: 3.2, opacity: 0 }}
                transition={{ duration: 1.6, delay: 0.2 + i * 0.25, ease: 'easeOut' }}
              />
            ))}
            {/* destellos */}
            {Array.from({ length: 10 }).map((_, i) => {
              const a = (i / 10) * Math.PI * 2
              return (
                <motion.span
                  key={`s${i}`}
                  className="absolute left-1/2 top-[56px] h-2 w-2 rounded-full bg-aurora"
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{ x: Math.cos(a) * 130, y: Math.sin(a) * 130, opacity: [0, 1, 0], scale: [0, 1.4, 0.6] }}
                  transition={{ duration: 1.1, delay: 0.35, ease: 'easeOut' }}
                />
              )
            })}
            <motion.div initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 13 }}>
              <LogoIcon size={112} animated glow />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <p className="font-display text-3xl font-extrabold sm:text-4xl">
                {data.kind === 'registro' ? `¡Tu cuenta está lista, ${data.name}!` : `¡Qué bueno verte, ${data.name}!`}
              </p>
              <p className="mt-2 text-muted">{data.kind === 'registro' ? 'Tus $1,000 de prueba ya te esperan.' : 'Tu dinero siguió creciendo mientras no estabas.'}</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
