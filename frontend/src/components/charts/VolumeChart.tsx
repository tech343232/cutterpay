import { Bar } from 'react-chartjs-2'
import { COLORS, tooltipStyle } from '@/lib/chart'
import { usd } from '@/lib/format'

interface Row {
  symbol: string
  buyUsd: number
  sellUsd: number
}

/** Volumen comprado vs vendido por moneda (barras horizontales agrupadas). */
export function VolumeChart({ rows, height = 240 }: { rows: Row[]; height?: number }) {
  return (
    <div style={{ height }} className="relative w-full">
      <Bar
        data={{
          labels: rows.map((r) => r.symbol),
          datasets: [
            { label: 'Comprado', data: rows.map((r) => r.buyUsd), backgroundColor: COLORS.primary, borderRadius: 8, maxBarThickness: 22 },
            { label: 'Vendido', data: rows.map((r) => r.sellUsd), backgroundColor: COLORS.pink, borderRadius: 8, maxBarThickness: 22 },
          ],
        }}
        options={{
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, useBorderRadius: true, borderRadius: 3 } },
            tooltip: { ...tooltipStyle, callbacks: { label: (i) => `${i.dataset.label}: ${usd(Number(i.raw))}` } },
          },
          scales: {
            x: { beginAtZero: true, grid: { color: COLORS.grid }, border: { display: false }, ticks: { maxTicksLimit: 5, callback: (v) => usd(Number(v)) } },
            y: { grid: { display: false }, border: { display: false }, ticks: { font: { weight: 600 } } },
          },
        }}
      />
    </div>
  )
}
