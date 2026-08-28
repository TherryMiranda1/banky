import { IBankingAdapter } from "../ports/IBankingAdapter.js";
import { EnableBankingAdapter } from "./enable-banking/EnableBankingAdapter.js";
import { MockBankingAdapter } from "./mock/MockBankingAdapter.js";
import { getRuntimeEnv } from "../../env.js";

let cachedAdapter: IBankingAdapter | null = null;

export function getBankingAdapter(): IBankingAdapter {
  const env = getRuntimeEnv();
  const isMock =
    (env as any).MOCK_BANKING === "true" ||
    process.env.MOCK_BANKING === "true" ||
    !env.PRIVATE_KEY_PEM ||
    env.APP_ID === "00000000-0000-0000-0000-000000000000";

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
