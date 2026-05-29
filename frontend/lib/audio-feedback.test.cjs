const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")

function loadTsModule(relativePath) {
  const filename = path.join(__dirname, relativePath)
  const source = fs.readFileSync(filename, "utf8")
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText

  const module = { exports: {} }
  const fn = new Function("module", "exports", "require", "__dirname", "__filename", compiled)
  fn(module, module.exports, require, __dirname, filename)
  return module.exports
}

let oscillatorStarts = 0
let vibrateCalls = 0

class FakeAudioContext {
  static instances = []

  constructor() {
    this.state = "suspended"
    this.currentTime = 0
    this.destination = {}
    FakeAudioContext.instances.push(this)
  }

  resume() {
    this.state = "running"
    return Promise.resolve()
  }

  createOscillator() {
    return {
      type: "sine",
      frequency: { value: 0 },
      connect: () => undefined,
      start: () => {
        oscillatorStarts += 1
      },
      stop: () => undefined,
    }
  }

  createGain() {
    return {
      gain: {
        value: 0,
        setValueAtTime: () => undefined,
        linearRampToValueAtTime: () => undefined,
      },
      connect: () => undefined,
    }
  }
}

global.window = {
  AudioContext: FakeAudioContext,
  setTimeout: (callback) => {
    callback()
    return 0
  },
}

Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: {
    vibrate: () => {
      vibrateCalls += 1
      return true
    },
  },
})

const { beepSuccess, unlockAudioFeedback } = loadTsModule("audio-feedback.ts")

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

async function run() {
  assert.equal(typeof unlockAudioFeedback, "function")
  assert.equal(await unlockAudioFeedback(), true)
  assert.equal(FakeAudioContext.instances.length, 1)
  assert.equal(FakeAudioContext.instances[0].state, "running")

  beepSuccess()
  await flushPromises()

  assert.equal(FakeAudioContext.instances.length, 1)
  assert.ok(oscillatorStarts >= 2)
  assert.equal(vibrateCalls, 1)

  console.log("audio-feedback tests passed")
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
