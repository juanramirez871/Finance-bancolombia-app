import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

type ExpoConfigExtra = {
  googleClientId?: string;
  apiBaseUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoConfigExtra;
const API_BASE_URL = extra.apiBaseUrl ?? "";
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync("authToken");
  } catch {
    return null;
  }
};

export type Transaction = {
  id: number;
  user_id: number;
  type: string;
  amount: number | string;
  account: string | null;
  account_to: string | null;
  merchant: string | null;
  person: string | null;
  date: string | null;
  time: string | null;
  debit_credit: string | null;
  created_at: string;
  updated_at: string;
};

export const api = {
  baseUrl: API_BASE_URL,

  async getTransactions(): Promise<{ transactions: Transaction[] }> {
    return this.get<{ transactions: Transaction[] }>(
      "/api/transactions",
      true,
    );
  },

  async importEmails(year?: number): Promise<{ saved: number; skipped: number }> {
    const endpoint = year ? `/email/import?year=${year}` : "/email/import";
    return this.post<{ saved: number; skipped: number }>(endpoint, {}, true);
  },

  async get<T>(endpoint: string, authenticated = false): Promise<T> {
    const token = authenticated ? await getAuthToken() : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const text = await response.text();
      console.log("API Error:", response.status, text);
      try {
        const error = JSON.parse(text);
        throw new Error(error.error ?? error.message ?? "Request failed");
      } catch {
        throw new Error(text || `Request failed (${response.status})`);
      }
    }

    return response.json();
  },

  async post<T>(endpoint: string, body: unknown, authenticated = false): Promise<T> {
    const token = authenticated ? await getAuthToken() : null;
    console.log("API_POST:", endpoint, "token:", token ? "yes" : "no");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      console.log("API Error:", response.status, text);
      throw new Error(text || "Request failed");
    }

    return response.json();
  },

  async put<T>(endpoint: string, body: unknown, authenticated = false): Promise<T> {
    const token = authenticated ? await getAuthToken() : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message ?? "Request failed");
    }

    return response.json();
  },

  async delete<T>(endpoint: string, authenticated = false): Promise<T> {
    const token = authenticated ? await getAuthToken() : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message ?? "Request failed");
    }

    return response.json();
  },
};
