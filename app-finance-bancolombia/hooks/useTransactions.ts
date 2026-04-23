import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import type { UiTransaction } from "@/interfaces/transactions";
import { api, type Transaction as ApiTransaction } from "@/utils/api";
import { TransactionFilterContext } from "@/app/_layout";

type ManualTransactionInput = {
  kind: "income" | "expense";
  amount: number;
  concept?: string;
  account?: string;
  date?: string;
  time?: string;
};

const uniqueNonEmpty = (values: Array<string | null | undefined>) => {
  const normalized = values
    .map((value) => value?.trim() ?? "")
    .filter((value) => value.length > 0);

  return Array.from(new Set(normalized));
};

function formatDate(dateStr: string | null): string {

  if (!dateStr) return "";
  const raw = dateStr.trim();
  if (!raw) return "";

  const parse = (dayStr: string, monthStr: string, yearStr: string) => {
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);
    if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
      return null;
    }

    if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return null;
    const d = new Date(year, month - 1, day);
    if (
      Number.isNaN(d.getTime()) ||
      d.getFullYear() !== year ||
      d.getMonth() !== month - 1 ||
      d.getDate() !== day
    ) {
      return null;
    }

    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  const ddmmyyyy = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (ddmmyyyy) {
    const [, dayStr, monthStr, yearStr] = ddmmyyyy;
    return parse(dayStr, monthStr, yearStr) ?? raw;
  }

  const yyyymmdd = raw.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:[T\s].*)?$/);
  if (yyyymmdd) {
    const [, yearStr, monthStr, dayStr] = yyyymmdd;
    return parse(dayStr, monthStr, yearStr) ?? raw;
  }

  return raw;
}

const toComparableDateValue = (dateStr: string | null): number | null => {
  const normalized = formatDate(dateStr);
  if (!normalized) {
    return null;
  }

  const parsed = new Date(`${normalized}T00:00:00`);
  const timestamp = parsed.getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
};

function formatLabel(t: ApiTransaction): string {
  const accountNum = t.account ?? '';
  const debitCredit = t.debit_credit ?? 'debito';
  switch (t.type) {
    case "recibido_qr":
      return `Transferencia de ${t.person}`;

    case "compra":
      return `Compra ${t.merchant}`;

    case "pago_no_exitoso":
      return `Pago fallido ${t.merchant}`;

    case "ingreso_manual":
      return t.person?.trim() || "Ingreso";

    case "egreso_manual":
      return t.merchant?.trim() || "Egreso";

    case "retiro":
      return "Retiro cajero";

    case "transferencia":
      return `Transferencia a ${t.account_to}`;

    case "paypal_recibido":
      return t.account_to ? `PayPal *${t.account_to}` : "PayPal";

    case "avance":
      return `Avance ${t.merchant}`;

    default:
      if (t.type === "compra" || t.type === "avance" || t.type === "pago_no_exitoso") {
        const cardType = debitCredit === "credito" ? "T.Cred" : "T.Deb";
        return `${cardType} *${accountNum}`;
      }
      
      return t.merchant ?? t.type;
  }
}

function mapToUiTransaction(t: ApiTransaction): UiTransaction {
  const numAmount = typeof t.amount === "string" ? parseFloat(t.amount) : Number(t.amount);
  const formattedAmount = isNaN(numAmount) ? "$0" : new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(numAmount);

  return {
    id: String(t.id),
    label: formatLabel(t),
    amount: formattedAmount,
    date: formatDate(t.date),
    time: t.time ?? "",
    type: t.type,
    merchant: t.merchant,
    person: t.person,
    account_to: t.account_to,
  };
}

export function useTransactions(enabled = true) {
  const transactionFilter = useContext(TransactionFilterContext);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    saved: number;
    skipped: number;
  } | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      setTransactions([]);
      return;
    }

    try {
      setLoading(true);
      const response = await api.getTransactions();
      setTransactions(response.transactions);
    }
    catch (error) {
      console.error("Error fetching transactions:", error);
    }
    finally {
      setLoading(false);
    }
  }, [enabled]);

  const importEmails = useCallback(async (year?: number) => {
    try {
      setImporting(true);
      const response = await api.importEmails(year);
      setImportResult(response);
      await fetchTransactions();
      return response;
    }
    catch (error) {
      console.error("Error importing emails:", error);
      throw error;
    }
    finally {
      setImporting(false);
    }
  }, [fetchTransactions]);

  const addManualTransaction = useCallback(async (input: ManualTransactionInput) => {
    const now = new Date();
    const fallbackDate = now.toISOString().slice(0, 10);
    const fallbackTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const concept = input.concept?.trim() || "Manual";
    const account = input.account?.trim() || null;

    await api.createTransaction({
      type: input.kind === "income" ? "ingreso_manual" : "egreso_manual",
      amount: input.amount,
      account,
      account_to: null,
      merchant: input.kind === "expense" ? concept : null,
      person: input.kind === "income" ? concept : null,
      date: input.date ?? fallbackDate,
      time: input.time ?? fallbackTime,
      debit_credit: "debito",
    });

    await fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const startTs = useMemo(
    () => toComparableDateValue(transactionFilter?.startDate ?? null),
    [transactionFilter?.startDate],
  );
  const endTs = useMemo(
    () => toComparableDateValue(transactionFilter?.endDate ?? null),
    [transactionFilter?.endDate],
  );

  const filteredTransactions = useMemo(() => {
    if (startTs === null || endTs === null) {
      return transactions;
    }

    return transactions.filter((transaction) => {
      const txTs = toComparableDateValue(transaction.date);
      if (txTs === null) {
        return false;
      }

      return txTs >= startTs && txTs <= endTs;
    });
  }, [endTs, startTs, transactions]);

  const incomeTxs = filteredTransactions.filter((t) =>
    ["recibido_qr", "paypal_recibido", "ingreso_manual"].includes(t.type),
  );
  const expenseTxs = filteredTransactions.filter((t) =>
    ["compra", "transferencia", "retiro", "avance", "pago_no_exitoso", "egreso_manual"].includes(t.type),
  );

  const incomeTransactions = useMemo(
    () => incomeTxs.map(mapToUiTransaction),
    [incomeTxs],
  );
  const expenseTransactions = useMemo(
    () => expenseTxs.map(mapToUiTransaction),
    [expenseTxs],
  );

  const incomeAccounts = useMemo(() => {
    const groupedByAccount = incomeTxs.reduce((acc, t) => {
      const account = t.type === "paypal_recibido" && t.account_to
        ? t.account_to
        : t.account ?? "default";
      const debitCredit = t.debit_credit ?? "debito";
      const key = `${account}_${debitCredit}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(t);
      return acc;
    }, {} as Record<string, ApiTransaction[]>);

    return Object.entries(groupedByAccount).map(([key, txs]) => {
      const account = key.split("_")[0];
      const debitCredit = key.split("_")[1] ?? "debito";
      const cardType = debitCredit === "credito" ? "Tarjeta de Credito" : "Tarjeta de Debito";
      return {
        id: key,
        label: key.includes("paypal") ? `PayPal *${account}` : `${cardType} *${account}`,
        transactions: txs.map(mapToUiTransaction),
      };
    });
  }, [incomeTxs]);

  const expenseAccounts = useMemo(() => {
    const groupedByAccount = expenseTxs.reduce((acc, t) => {
      const account = t.account ?? "default";
      const debitCredit = t.debit_credit ?? "debito";
      const key = `${account}_${debitCredit}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(t);
      return acc;
    }, {} as Record<string, ApiTransaction[]>);

    return Object.entries(groupedByAccount).map(([key, txs]) => {
      const account = key.split("_")[0];
      const debitCredit = key.split("_")[1] ?? "debito";
      const cardType = debitCredit === "credito" ? "Tarjeta de Credito" : "Tarjeta de Debito";
      return {
        id: key,
        label: `${cardType} *${account}`,
        transactions: txs.map(mapToUiTransaction),
      };
    });
  }, [expenseTxs]);

  const manualIncomeConceptOptions = useMemo(
    () => uniqueNonEmpty(incomeTxs.map((t) => t.person ?? t.merchant ?? t.account_to)),
    [incomeTxs],
  );

  const manualExpenseConceptOptions = useMemo(
    () => uniqueNonEmpty(expenseTxs.map((t) => t.merchant ?? t.person ?? t.account_to)),
    [expenseTxs],
  );

  const manualIncomeAccountOptions = useMemo(
    () => uniqueNonEmpty(incomeTxs.map((t) => (t.type === "paypal_recibido" ? t.account_to : t.account))),
    [incomeTxs],
  );

  const manualExpenseAccountOptions = useMemo(
    () => uniqueNonEmpty(expenseTxs.map((t) => t.account)),
    [expenseTxs],
  );

  return {
    transactions: filteredTransactions,
    incomeTransactions,
    expenseTransactions,
    incomeAccounts,
    expenseAccounts,
    manualIncomeConceptOptions,
    manualExpenseConceptOptions,
    manualIncomeAccountOptions,
    manualExpenseAccountOptions,
    loading,
    importing,
    importResult,
    importEmails,
    addManualTransaction,
    refresh: fetchTransactions,
  };
}
