export interface RawAspspItem {
  name: string;
  country: string;
  logo?: string;
  bic?: string;
  psu_types?: string[];
}

export interface RawGetAspspsResponse {
  aspsps: RawAspspItem[];
}

export interface RawAuthResponse {
  url: string;
  authorization_id: string;
}

export interface RawAccountItem {
  uid?: string;
  name?: string | null;
  currency?: string;
  account_id?: {
    iban?: string | null;
  };
  account_servicer?: {
    name?: string | null;
  };
}

export interface RawSessionResponse {
  session_id: string;
  access?: {
    valid_until?: string;
  };
  accounts?: RawAccountItem[];
}

export interface RawGetSessionResponse {
  access?: {
    valid_until?: string;
  };
  accounts?: string[];
  accounts_data?: Array<{
    uid: string;
    identification_hash?: string;
  }>;
}

export interface RawBalanceItem {
  balance_amount: {
    amount: string;
    currency: string;
  };
  balance_type?: string;
  name?: string;
}

export interface RawBalancesResponse {
  balances?: RawBalanceItem[];
}

export interface RawTransactionItem {
  transaction_id?: string;
  entry_reference?: string;
  transaction_amount: {
    amount: string;
    currency: string;
  };
  credit_debit_indicator?: string;
  remittance_information?: string[];
  booking_date?: string;
  value_date?: string;
  transaction_date?: string;
  bank_transaction_code?: {
    description?: string;
  };
  creditor?: {
    name?: string;
  };
  debtor?: {
    name?: string;
  };
}

export interface RawTransactionsResponse {
  transactions?: RawTransactionItem[];
  continuation_key?: string;
}
