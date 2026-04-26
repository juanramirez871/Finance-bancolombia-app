export type TransactionFilterContextValue = {
  startDate: string;
  endDate: string;
  setRange: (startDate: string, endDate: string) => Promise<void>;
  resetToCurrentYear: () => Promise<void>;
};
