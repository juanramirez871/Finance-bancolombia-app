export interface UiTransaction {
  id: string;
  label: string;
  amount: string;
  date: string;
  time: string;
  type?: string;
  merchant?: string | null;
  person?: string | null;
  account_to?: string | null;
}

export interface UiAccount {
  id: string;
  label: string;
  transactions: UiTransaction[];
}

export type ManualTransactionInput = {
  kind: "income" | "expense";
  amount: number;
  concept?: string;
  account?: string;
  date?: string;
  time?: string;
};
