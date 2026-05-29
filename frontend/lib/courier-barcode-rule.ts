import type { BarcodeRuleType } from "@/lib/barcode-parser"

type CourierBarcodeRuleInput = {
  name?: string | null
  code?: string | null
  barcode_rule_type?: BarcodeRuleType | null
}

const POSTAL_NAME_PATTERNS = ["ゆうパケット", "ゆうパック", "クリップポスト", "クリックポスト", "郵便", "邮政"]

export function resolveCourierBarcodeRuleType(courier: CourierBarcodeRuleInput): BarcodeRuleType {
  const configuredRule = courier.barcode_rule_type || "generic"

  if (configuredRule !== "generic") {
    return configuredRule
  }

  const name = courier.name || ""
  const code = (courier.code || "").toLowerCase()

  if (POSTAL_NAME_PATTERNS.some((pattern) => name.includes(pattern))) {
    return "postal"
  }

  if (code.startsWith("up") || code.startsWith("cp")) {
    return "postal"
  }

  return "generic"
}
