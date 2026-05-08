export type BarcodeRuleType = "postal" | "sagawa" | "generic"

export type BarcodeParseError =
  | "empty"
  | "tooShort"
  | "badFormat"
  | "looksLikeNonShipping"

export type BarcodeParseResult =
  | { ok: true; rawInput: string; trackingNumber: string }
  | { ok: false; rawInput: string; reason: BarcodeParseError }

const GUARD_LETTER_PATTERN = /^[ABCD]$/i
const POSTAL_PATTERN = /^([ABCD])?(\d{10,13})([ABCD])?$/i
const SAGAWA_PATTERN = /^([ABCD])?(\d{10,13})([ABCD])?$/i
const GENERIC_PATTERN = /^[A-Za-z0-9]{8,50}$/

export function parseBarcode(input: string, ruleType: BarcodeRuleType): BarcodeParseResult {
  const rawInput = input.trim()

  if (!rawInput) {
    return { ok: false, rawInput, reason: "empty" }
  }

  if (rawInput.includes("-") || /\s/.test(rawInput)) {
    return { ok: false, rawInput, reason: "looksLikeNonShipping" }
  }

  if (rawInput.length < 8) {
    return { ok: false, rawInput, reason: "tooShort" }
  }

  if (ruleType === "postal") {
    const match = rawInput.match(POSTAL_PATTERN)
    if (!match) {
      return { ok: false, rawInput, reason: "badFormat" }
    }

    const leading = match[1]
    const digits = match[2]
    const trailing = match[3]
    const hasGuardPair = leading && trailing && GUARD_LETTER_PATTERN.test(leading) && GUARD_LETTER_PATTERN.test(trailing)

    return {
      ok: true,
      rawInput,
      trackingNumber: hasGuardPair ? digits : rawInput,
    }
  }

  if (ruleType === "sagawa") {
    if (!SAGAWA_PATTERN.test(rawInput) && !/^\d{10,13}$/.test(rawInput)) {
      return { ok: false, rawInput, reason: "badFormat" }
    }

    return { ok: true, rawInput, trackingNumber: rawInput }
  }

  if (!GENERIC_PATTERN.test(rawInput)) {
    return { ok: false, rawInput, reason: "badFormat" }
  }

  return { ok: true, rawInput, trackingNumber: rawInput }
}

export function getBarcodeErrorMessage(reason: BarcodeParseError): string {
  switch (reason) {
    case "looksLikeNonShipping":
      return "扫到的不是运单号，请重新扫描运单号条形码"
    case "empty":
      return "扫码内容为空"
    case "tooShort":
      return "扫码内容过短，请重新扫描"
    default:
      return "运单号格式不正确，请重新扫描"
  }
}
