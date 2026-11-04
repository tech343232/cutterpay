import { Line } from 'react-chartjs-2'
import type { ScriptableContext } from 'chart.js'
import { COLORS, tooltipStyle } from '@/lib/chart'
import { usd, time, dateTime } from '@/lib/format'
import type { PricePoint } from '@/types'

/** Gráfica de precio con relleno degradado; verde si sube en el rango, rosa si baja. */
export function PriceChart({ points, range, height = 280 }: { points: PricePoint[]; range: '24h' | '7d'; height?: number }) {
  const up = points.length > 1 && points[points.length - 1].p >= points[0].p
  const color = up ? COLORS.ok : COLORS.bad
  const rgba = (a: number) => color.replace('rgb(', 'rgba(').replace(')', `, ${a})`)

  return (
    <div style={{ height }} className="relative w-full">
      <Line
        data={{
          labels: points.map((p) => p.t),
          datasets: [
            {
              data: points.map((p) => p.p),
              borderColor: color,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: color,
              tension: 0.25,
              fill: true,
              backgroundColor: (ctx: ScriptableContext<'line'>) => {
                const { chart } = ctx
                const area = chart.chartArea
                if (!area) return rgba(0.1)
                const g = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom)
                g.addColorStop(0, rgba(0.28))
                g.addColorStop(1, rgba(0))
                return g
              },
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 400 },
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              ...tooltipStyle,
              displayColors: false,
              callbacks: {
                title: (items) => dateTime(String(items[0].label)),
                label: (item) => usd(Number(item.raw), { price: true }),
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: {
                maxTicksLimit: 6,
                maxRotation: 0,
                callback(_v, i) {
                  const t = points[i]?.t
                  if (!t) return ''
                  return range === '24h' ? time(t) : new Intl.DateTimeFormat('es-GT', { day: '2-digit', month: 'short' }).format(new Date(t))
                },
              },
            },
            y: {
              position: 'right',
              grid: { color: COLORS.grid },
              border: { display: false },
              ticks: { maxTicksLimit: 5, callback: (v) => usd(Number(v), { price: true }) },
            },
          },
        }}
      />
    </div>
  )
}
