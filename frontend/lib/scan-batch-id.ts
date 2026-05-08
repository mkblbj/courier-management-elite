type BatchCrypto = {
  randomUUID?: () => string
  getRandomValues?: (array: Uint8Array) => Uint8Array
}

const uuidByteToHex = Array.from({ length: 256 }, (_, index) => index.toString(16).padStart(2, "0"))

function formatUuid(bytes: Uint8Array): string {
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  return [
    uuidByteToHex[bytes[0]],
    uuidByteToHex[bytes[1]],
    uuidByteToHex[bytes[2]],
    uuidByteToHex[bytes[3]],
    "-",
    uuidByteToHex[bytes[4]],
    uuidByteToHex[bytes[5]],
    "-",
    uuidByteToHex[bytes[6]],
    uuidByteToHex[bytes[7]],
    "-",
    uuidByteToHex[bytes[8]],
    uuidByteToHex[bytes[9]],
    "-",
    uuidByteToHex[bytes[10]],
    uuidByteToHex[bytes[11]],
    uuidByteToHex[bytes[12]],
    uuidByteToHex[bytes[13]],
    uuidByteToHex[bytes[14]],
    uuidByteToHex[bytes[15]],
  ].join("")
}

export function createScanBatchId(cryptoSource: BatchCrypto | undefined = globalThis.crypto): string {
  if (typeof cryptoSource?.randomUUID === "function") {
    return cryptoSource.randomUUID()
  }

  const bytes = new Uint8Array(16)
  if (typeof cryptoSource?.getRandomValues === "function") {
    cryptoSource.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }

  return formatUuid(bytes)
}
