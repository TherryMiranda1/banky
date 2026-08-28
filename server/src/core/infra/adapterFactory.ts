import { IBankingAdapter } from "../ports/IBankingAdapter.js";
import { EnableBankingAdapter } from "./enable-banking/EnableBankingAdapter.js";
import { MockBankingAdapter } from "./mock/MockBankingAdapter.js";
import { getRuntimeEnv } from "../../env.js";

let cachedAdapter: IBankingAdapter | null = null;

export function getBankingAdapter(): IBankingAdapter {
  const env = getRuntimeEnv();
  const isMock =
    (env as any).MOCK_BANKING === "true" ||
    process.env.MOCK_BANKING === "true";

  if (isMock) {
    if (!cachedAdapter || !(cachedAdapter instanceof MockBankingAdapter)) {
      cachedAdapter = new MockBankingAdapter();
    }
    return cachedAdapter;
  }

  if (!cachedAdapter || !(cachedAdapter instanceof EnableBankingAdapter)) {
    cachedAdapter = new EnableBankingAdapter();
  }
  return cachedAdapter;
}

