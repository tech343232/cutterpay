/** Mini gráfica SVG sin librería (tarjetas de precio). */
export function Sparkline({ data, width = 120, height = 36, className }: { data: number[]; width?: number; height?: number; className?: string }) {
  if (data.length < 2) return <svg width={width} height={height} className={className} aria-hidden />
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const x = (i: number) => (i / (data.length - 1)) * (width - 4) + 2
  const y = (v: number) => height - 3 - ((v - min) / span) * (height - 6)
  const d = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const up = data[data.length - 1] >= data[0]
  const color = up ? 'rgb(79,209,165)' : 'rgb(255,127,168)'
  const last = data.length - 1
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <path d={`${d} L${x(last)} ${height} L${x(0)} ${height} Z`} fill={color} opacity={0.12} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last)} cy={y(data[last])} r={2.6} fill={color} />
    </svg>
  )
}
