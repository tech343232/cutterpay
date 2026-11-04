import { Bar } from 'react-chartjs-2'
import { COLORS, tooltipStyle } from '@/lib/chart'
import { shortDay, usd } from '@/lib/format'
import type { ActivityDay } from '@/types'

/** Barras apiladas: compras vs ventas por día. mode="count" (operaciones) o "usd" (volumen). */
export function ActivityChart({ days, mode = 'count', height = 260 }: { days: ActivityDay[]; mode?: 'count' | 'usd'; height?: number }) {
  const buy = days.map((d) => (mode === 'count' ? d.buys : d.buyUsd))
  const sell = days.map((d) => (mode === 'count' ? d.sells : d.sellUsd))
  return (
    <div style={{ height }} className="relative w-full">
      <Bar
        data={{
          labels: days.map((d) => shortDay(d.day)),
          datasets: [
            { label: 'Compras', data: buy, backgroundColor: COLORS.primary, borderRadius: 6, maxBarThickness: 18, stack: 's' },
            { label: 'Ventas', data: sell, backgroundColor: COLORS.pink, borderRadius: 6, maxBarThickness: 18, stack: 's' },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, useBorderRadius: true, borderRadius: 3 } },
            tooltip: {
              ...tooltipStyle,
              callbacks: { label: (i) => `${i.dataset.label}: ${mode === 'usd' ? usd(Number(i.raw)) : i.raw}` },
            },
          },
          scales: {
            x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { maxTicksLimit: 8, maxRotation: 0 } },
            y: {
              stacked: true,
              beginAtZero: true,
              grid: { color: COLORS.grid },
              border: { display: false },
              ticks: { precision: 0, maxTicksLimit: 5, callback: (v) => (mode === 'usd' ? usd(Number(v)) : v) },
            },
          },
        }}
      />
    </div>
  )
}
