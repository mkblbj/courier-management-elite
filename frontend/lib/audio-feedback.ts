type BeepOptions = {
  frequency: number
  durationMs: number
  delayMs?: number
}

let sharedAudioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
  if (!AudioContextClass) return null

  if (!sharedAudioContext || sharedAudioContext.state === "closed") {
    sharedAudioContext = new AudioContextClass()
  }

  return sharedAudioContext
}

export async function unlockAudioFeedback(): Promise<boolean> {
  const audioContext = getAudioContext()
  if (!audioContext) return false

  if (audioContext.state === "suspended") {
    await audioContext.resume()
  }

  // iOS/Safari often needs a tiny sound created directly inside the tap handler.
  playBeep({ frequency: 1200, durationMs: 20 })
  return audioContext.state === "running"
}

function playBeep({ frequency, durationMs, delayMs = 0 }: BeepOptions) {
  if (typeof window === "undefined") return

  window.setTimeout(() => {
    const audioContext = getAudioContext()
    if (!audioContext || audioContext.state !== "running") return

    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    const now = audioContext.currentTime

    oscillator.type = "sine"
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(0.12, now + 0.005)
    gain.gain.linearRampToValueAtTime(0.0001, now + durationMs / 1000)

    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start(now)
    oscillator.stop(now + durationMs / 1000)
  }, delayMs)
}

function vibrate(pattern: VibratePattern) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern)
  }
}

export function beepSuccess() {
  vibrate(35)
  playBeep({ frequency: 880, durationMs: 60 })
}

export function beepDuplicate() {
  vibrate([40, 40, 40])
  playBeep({ frequency: 620, durationMs: 70 })
  playBeep({ frequency: 620, durationMs: 70, delayMs: 120 })
}

export function beepError() {
  vibrate(120)
  playBeep({ frequency: 220, durationMs: 180 })
}
