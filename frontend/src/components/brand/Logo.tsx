import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * Ícono oficial "Aurora": C cortada en diagonal con la moneda en la abertura.
 * animated: las dos mitades entran y se unen, la moneda aparece y cada pocos segundos
 * la C "respira" y la moneda sube (crecimiento). Al pasar el mouse se separa y la moneda sube.
 */
export function LogoIcon({ size = 40, className, glow = false, animated = false }: { size?: number; className?: string; glow?: boolean; animated?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const id = (k: string) => `${k}-${uid}`
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={cn('cp-logo shrink-0 overflow-visible', animated && 'is-animated', glow && 'drop-shadow-[0_12px_30px_rgba(201,75,224,0.45)]', className)}
      role="img"
      aria-label="CUTTERPAY"
    >
      <defs>
        <linearGradient id={id('g')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF6FB5" />
          <stop offset=".45" stopColor="#C94BE0" />
          <stop offset="1" stopColor="#6A4BFF" />
        </linearGradient>
        <linearGradient id={id('s')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".35" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id('sh')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={id('b')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <clipPath id={id('sq')}>
          <rect width="120" height="120" rx="30" />
        </clipPath>
        <clipPath id={id('ul')}>
          <polygon points="-10,-10 110,-10 -10,110" />
        </clipPath>
        <clipPath id={id('lr')}>
          <polygon points="110,-10 110,110 -10,110" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id('sq')})`}>
        <rect width="120" height="120" fill={`url(#${id('g')})`} />
        <g filter={`url(#${id('b')})`} className="cp-blobs">
          <circle cx="102" cy="18" r="34" fill="#FF9BCB" />
          <circle cx="110" cy="106" r="30" fill="#FFA04D" />
          <circle cx="12" cy="98" r="38" fill="#7A52FF" />
          <circle cx="40" cy="30" r="26" fill="#D23FD0" />
        </g>
        <rect width="120" height="120" fill={`url(#${id('s')})`} />
        {animated && <rect className="cp-shine" x="0" y="-20" width="50" height="160" fill={`url(#${id('sh')})`} />}
      </g>
      <svg x="24" y="24" width="72" height="72" viewBox="0 0 100 100" overflow="visible">
        <g fill="none" stroke="#FFF8F2" strokeWidth="16" strokeLinecap="round">
          <g className="cp-top">
            <path clipPath={`url(#${id('ul')})`} transform="translate(-3 -3)" d="M61 26.4 A26 26 0 1 0 61 73.6" />
          </g>
          <g className="cp-bottom">
            <path clipPath={`url(#${id('lr')})`} transform="translate(3 3)" d="M61 26.4 A26 26 0 1 0 61 73.6" />
          </g>
        </g>
        <circle className="cp-coin" cx="80" cy="50" r="7" fill="#FFF8F2" />
      </svg>
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-display font-extrabold lowercase tracking-[-0.04em]', className)}>
      cutter<span className="text-aurora">pay</span>
    </span>
  )
}

export function Logo({ size = 36, className, animated = true }: { size?: number; className?: string; animated?: boolean }) {
  return (
    <span className={cn('group inline-flex items-center gap-2.5', className)}>
      <LogoIcon size={size} animated={animated} />
      <Wordmark className="text-2xl" />
    </span>
  )
}
