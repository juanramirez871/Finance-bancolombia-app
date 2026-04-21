export type Transaction = {
  id: string;
  label: string;
  amount: string;
  date: string;
  time: string;
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
