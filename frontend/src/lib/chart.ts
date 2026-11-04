// Registro único de Chart.js y estilos compartidos para todas las gráficas
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend)

ChartJS.defaults.color = 'rgb(164, 157, 191)'
ChartJS.defaults.font.family = '"Plus Jakarta Sans", system-ui, sans-serif'
ChartJS.defaults.font.size = 12
ChartJS.defaults.borderColor = 'rgba(42, 37, 64, 0.8)'

export const COLORS = {
  primary: 'rgb(155, 140, 255)',
  pink: 'rgb(255, 111, 181)',
  magenta: 'rgb(201, 75, 224)',
  ok: 'rgb(79, 209, 165)',
  bad: 'rgb(255, 127, 168)',
  grid: 'rgba(42, 37, 64, 0.6)',
  muted: 'rgb(164, 157, 191)',
}

export const tooltipStyle = {
  backgroundColor: 'rgba(20, 17, 30, 0.96)',
  borderColor: 'rgba(155, 140, 255, 0.35)',
  borderWidth: 1,
  padding: 10,
  cornerRadius: 12,
  titleColor: 'rgb(244, 242, 255)',
  bodyColor: 'rgb(244, 242, 255)',
  titleFont: { weight: 600 as const },
  displayColors: true,
  boxPadding: 4,
}

export { ChartJS }
