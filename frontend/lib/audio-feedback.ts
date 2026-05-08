type BeepOptions = {
  frequency: number
  durationMs: number
  delayMs?: number
}

function playBeep({ frequency, durationMs, delayMs = 0 }: BeepOptions) {
  if (typeof window === "undefined") return

  window.setTimeout(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const audioContext = new AudioContextClass()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()

    oscillator.type = "sine"
    oscillator.frequency.value = frequency
    gain.gain.value = 0.08

    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start()

    window.setTimeout(() => {
      oscillator.stop()
      audioContext.close()
    }, durationMs)
  }, delayMs)
}

export function beepSuccess() {
  playBeep({ frequency: 880, durationMs: 60 })
}

export function beepDuplicate() {
  playBeep({ frequency: 620, durationMs: 70 })
  playBeep({ frequency: 620, durationMs: 70, delayMs: 120 })
}

export function beepError() {
  playBeep({ frequency: 220, durationMs: 180 })
}
