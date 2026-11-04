import { useId } from 'react'
import { Link } from 'react-router-dom'
import { X, Sparkles, ArrowRight } from 'lucide-react'

/** Degradado de marca para trazos finos (userSpaceOnUse: no desaparece en líneas rectas). */
function Grad({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="10" y1="10" x2="110" y2="110">
        <stop offset="0" stopColor="#FF6FB5" />
        <stop offset=".5" stopColor="#C94BE0" />
        <stop offset="1" stopColor="#8A6BFF" />
      </linearGradient>
    </defs>
  )
}

/** Profesional: maletín del que salen monedas (su sueldo se va). */
function ArtProfessional() {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 120 120" className="cp-persona-art h-full w-full" aria-hidden>
      <Grad id={id} />
      <g fill="none" stroke={`url(#${id})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <rect className="cp-draw" x="22" y="48" width="76" height="48" rx="10" pathLength={1} />
        <path className="cp-draw" d="M46 48 V40 a6 6 0 0 1 6 -6 h16 a6 6 0 0 1 6 6 v8" pathLength={1} style={{ animationDelay: '.3s' }} />
        <path className="cp-draw" d="M22 68 H98" pathLength={1} style={{ animationDelay: '.5s' }} />
        <rect x="54" y="63" width="12" height="10" rx="2" />
      </g>
      {[0, 1, 2].map((i) => (
        <g key={i} className="cp-coin-fly" style={{ animationDelay: `${i * 0.9}s` }}>
          <circle cx={44 + i * 16} cy="44" r="7" fill="#F7931A" stroke="#FFD08A" strokeWidth="2" />
          <text x={44 + i * 16} y="47.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff">$</text>
        </g>
      ))}
    </svg>
  )
}

/** Independiente: laptop con barras que suben (ingresos que suben y bajan). */
function ArtFreelancer() {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 120 120" className="cp-persona-art h-full w-full" aria-hidden>
      <Grad id={id} />
      <g fill="none" stroke={`url(#${id})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <rect className="cp-draw" x="22" y="28" width="76" height="50" rx="7" pathLength={1} />
        <path className="cp-draw" d="M12 86 H108 l-7 8 H19 Z" pathLength={1} style={{ animationDelay: '.3s' }} />
      </g>
      {[
        { x: 34, h: 14, d: 0 },
        { x: 48, h: 24, d: 0.25 },
        { x: 62, h: 10, d: 0.5 },
        { x: 76, h: 30, d: 0.75 },
      ].map((b) => (
        <rect key={b.x} className="cp-bar" x={b.x} y={70 - b.h} width="9" height={b.h} rx="2.5" fill="#4FD1A5" style={{ animationDelay: `${b.d}s` }} />
      ))}
      <path className="cp-draw-loop" d="M32 58 L50 44 L64 52 L88 34" fill="none" stroke="#FF6FB5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
      <circle className="cp-blink" cx="88" cy="34" r="4" fill="#FF6FB5" />
    </svg>
  )
}

/** Dueño de negocio: tienda con monedas que crecen al lado (ganancias que pueden trabajar). */
function ArtBusiness() {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 120 120" className="cp-persona-art h-full w-full" aria-hidden>
      <Grad id={id} />
      <g fill="none" stroke={`url(#${id})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path className="cp-draw" d="M16 46 L24 26 H84 L92 46" pathLength={1} />
        <path className="cp-draw" d="M16 46 q9 10 19 0 q9 10 19 0 q9 10 19 0 q9 10 19 0" pathLength={1} style={{ animationDelay: '.3s' }} />
        <path className="cp-draw" d="M22 52 V96 H86 V52" pathLength={1} style={{ animationDelay: '.5s' }} />
        <rect x="44" y="68" width="18" height="28" rx="3" />
      </g>
      {[0, 1, 2, 3].map((i) => (
        <ellipse key={i} className="cp-stack" cx="104" cy={94 - i * 7} rx="11" ry="4" fill="#C94BE0" stroke="#FFB4E0" strokeWidth="1.5" style={{ animationDelay: `${i * 0.35}s` }} />
      ))}
      <path className="cp-rise-arrow" d="M104 52 V36 M97 43 L104 36 L111 43" fill="none" stroke="#4FD1A5" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const PERSONAS = [
  {
    Art: ArtProfessional,
    tag: 'Profesional',
    title: 'Cansado de depender solo de su sueldo',
    pains: [
      'Tu sueldo llega y a fin de mes ya se fue. Nada queda trabajando para ti.',
      'Tus ahorros duermen en la cuenta del banco ganando casi nada.',
      'Si mañana fallara tu empleo, no tienes otro ingreso que te respalde.',
    ],
    win: 'Con CUTTERPAY pones una parte de tu sueldo a trabajar desde $1, sin dejar tu empleo.',
  },
  {
    Art: ArtFreelancer,
    tag: 'Independiente',
    title: 'Quiere crear otra fuente de ingresos',
    pains: [
      'Tus ingresos suben y bajan cada mes. Un mes flojo te deja sin colchón.',
      'Si un día dejas de trabajar, ese día dejas de ganar.',
      'Lo que te sobra en los meses buenos se queda quieto en el banco.',
    ],
    win: 'Con CUTTERPAY lo que te sobra en un buen mes se mueve en monedas digitales y no se queda quieto.',
  },
  {
    Art: ArtBusiness,
    tag: 'Dueño de negocio',
    title: 'Quiere invertir sus ganancias',
    pains: [
      'Las ganancias de tu negocio se acumulan en la cuenta sin crecer.',
      'Todo tu dinero depende de un solo negocio: si bajan las ventas, baja todo.',
      'No tienes tiempo para aprender inversiones complicadas.',
    ],
    win: 'Con CUTTERPAY inviertes tus ganancias en minutos, en 3 pasos y sin asesores.',
  },
]

/** Sección "¿Para quién es CUTTERPAY?": 3 perfiles, 3 dolores cada uno y la solución. */
export function Personas() {
  return (
    <section className="flex flex-col gap-8 py-16">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-primary">¿Para quién es CUTTERPAY?</p>
        <h2 className="text-3xl font-bold sm:text-5xl">Para quien quiere que su dinero deje de estar quieto</h2>
        <p className="text-lg text-muted">Si te ves en alguno de estos perfiles, CUTTERPAY es para ti.</p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-3">
        {PERSONAS.map(({ Art, tag, title, pains, win }, i) => (
          <article key={tag} className="cp-persona group relative flex flex-col gap-5 overflow-hidden rounded-4xl border border-line bg-surface p-6" style={{ animationDelay: `${i * 0.12}s` }}>
            <span className="cp-glow-ring opacity-0 transition duration-500 group-hover:opacity-100" />
            <span aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-aurora opacity-15 blur-3xl transition duration-500 group-hover:opacity-30" />
            <div className="relative flex items-center gap-4">
              <div className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl border border-line bg-bg/70 p-2 transition duration-500 group-hover:scale-105 group-hover:border-primary/50">
                <Art />
              </div>
              <div className="min-w-0">
                <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">{tag}</span>
                <h3 className="mt-2 text-xl font-bold leading-snug">{title}</h3>
              </div>
            </div>
            <ul className="relative flex flex-col gap-3">
              {pains.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[15px]">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-bad/15 text-bad"><X className="h-3.5 w-3.5" strokeWidth={3} /></span>
                  <span className="text-fg/90">{p}</span>
                </li>
              ))}
            </ul>
            <p className="relative mt-auto flex items-start gap-3 rounded-3xl border border-ok/25 bg-ok/10 p-4 text-[15px] font-semibold">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
              {win}
            </p>
          </article>
        ))}
      </div>
      <div className="flex justify-center">
        <Link to="/registro">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-aurora px-7 py-4 text-lg font-semibold text-white shadow-glow transition hover:brightness-110">
            Quiero que mi dinero trabaje <ArrowRight className="h-5 w-5" />
          </span>
        </Link>
      </div>
    </section>
  )
}
