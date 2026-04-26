export type ManualTransactionModalProps = {
  visible: boolean;
  title: string;
  amountLabel: string;
  ctaLabel: string;
  accentColor: string;
  kind: "income" | "expense";
  conceptOptions?: string[];
  accountOptions?: string[];
  onClose: () => void;
  onSave: (data: {
    amount: number;
    concept: string;
    account: string;
  }) => Promise<void>;
};

export type ModalPickerTarget = "concept" | "account" | null;
