import { Doughnut } from 'react-chartjs-2'
import { tooltipStyle } from '@/lib/chart'
import { usd } from '@/lib/format'

interface Slice {
  label: string
  value: number
  color: string
}

/** Dona de distribución con leyenda propia (saldo + cada moneda). */
export function AllocationChart({ slices, size = 180 }: { slices: Slice[]; size?: number }) {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div style={{ width: size, height: size }} className="relative shrink-0">
        <Doughnut
          data={{
            labels: slices.map((s) => s.label),
            datasets: [{ data: slices.map((s) => s.value), backgroundColor: slices.map((s) => s.color), borderWidth: 0, spacing: 2, borderRadius: 4 }],
          }}
          options={{
            cutout: '72%',
            plugins: {
              legend: { display: false },
              tooltip: { ...tooltipStyle, callbacks: { label: (i) => ` ${usd(Number(i.raw))} · ${((Number(i.raw) / total) * 100).toFixed(1)}%` } },
            },
          }}
        />
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-xs text-muted">Total</p>
            <p className="tabular font-display text-lg font-bold">{usd(total)}</p>
          </div>
        </div>
      </div>
      <ul className="flex w-full min-w-0 flex-col gap-2.5">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-3 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="flex-1 truncate">{s.label}</span>
            <span className="tabular text-muted">{((s.value / total) * 100).toFixed(1)}%</span>
            <span className="tabular w-24 text-right font-semibold">{usd(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
