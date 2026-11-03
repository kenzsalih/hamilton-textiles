import { COUNTRIES } from "./shipping";

export const DIAL_CODES: Record<(typeof COUNTRIES)[number], string> = {
  BH: "973", SA: "966", AE: "971", KW: "965", QA: "974", OM: "968", IN: "91", PK: "92", PH: "63",
  BD: "880", LK: "94", EG: "20", JO: "962", LB: "961", GB: "44", US: "1", CA: "1", AU: "61",
  DE: "49", FR: "33", IT: "39", NL: "31", TR: "90", MY: "60", ID: "62", SG: "65",
};

export function countryName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale === "ar" ? "ar" : "en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
