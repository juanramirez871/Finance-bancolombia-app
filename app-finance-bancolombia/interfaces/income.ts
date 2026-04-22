export type Transaction = {
  id: string;
  label: string;
  amount: string;
  date: string;
  time: string;
  type?: string;
  merchant?: string | null;
  person?: string | null;
  account_to?: string | null;
};

export type Account = {
  id: string;
  label: string;
  transactions: Transaction[];
};

export type TransactionSection = {
  title: string;
  data: Transaction[];
};
