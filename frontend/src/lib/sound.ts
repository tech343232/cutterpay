// Sonidos cortos de la interfaz (Web Audio, sin archivos).
// El navegador solo deja sonar audio después de un clic: por eso primeAudio() se llama al pulsar un botón.
let ctx: AudioContext | null = null

export function primeAudio() {
  try {
    ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    /* sin audio */
  }
}

function tone(freq: number, start: number, dur: number, vol: number, type: OscillatorType = 'sine') {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(vol, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(gain).connect(ctx.destination)
  osc.start(start)
  osc.stop(start + dur + 0.05)
}

/** "Listo": al completar una inversión, compra o retiro. */
export function playSuccess() {
  primeAudio()
  if (!ctx) return
  const now = ctx.currentTime
  ;[523.25, 659.25, 783.99].forEach((f, i) => tone(f, now + i * 0.09, 0.45, 0.12))
}

/** Bienvenida: al entrar a CUTTERPAY (arpegio que sube + destello). */
export function playWelcome() {
  primeAudio()
  if (!ctx) return
  const now = ctx.currentTime
  ;[392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, now + i * 0.08, 0.6, 0.1))
  tone(2093, now + 0.42, 0.5, 0.04, 'triangle')
  tone(2637, now + 0.5, 0.6, 0.03, 'triangle')
}
