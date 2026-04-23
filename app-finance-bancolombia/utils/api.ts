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
    const endpoint = year ? `/api/email/import?year=${year}` : "/api/email/import";
    return this.post<{ saved: number; skipped: number }>(endpoint, {}, true);
  },

  async importEmailsStream(
    year: number,
    onProgress: (progress: {
      processed: number;
      total: number;
      saved: number;
      skipped: number;
      percent: number;
    }) => void,
  ): Promise<{ saved: number; skipped: number }> {
    const token = await getAuthToken();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let lastIndex = 0;
      let buffer = "";
      let completed = false;

      const handleChunk = (chunk: string) => {
        buffer += chunk;
        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() ?? "";

        for (const block of blocks) {
          const lines = block.split(/\r?\n/);
          let eventName = "message";
          let dataText = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
            }

            if (line.startsWith("data:")) {
              dataText += line.slice(5).trim();
            }
          }

          if (!dataText) {
            continue;
          }

          let payload: Record<string, unknown>;
          try {
            payload = JSON.parse(dataText) as Record<string, unknown>;
          }
          catch {
            continue;
          }

          if (eventName === "progress") {
            onProgress({
              processed: Number(payload.processed ?? 0),
              total: Number(payload.total ?? 0),
              saved: Number(payload.saved ?? 0),
              skipped: Number(payload.skipped ?? 0),
              percent: Number(payload.percent ?? 0),
            });
          }

          if (eventName === "done") {
            completed = true;
            resolve({
              saved: Number(payload.saved ?? 0),
              skipped: Number(payload.skipped ?? 0),
            });
          }

          if (eventName === "error") {
            completed = true;
            reject(new Error(String(payload.message ?? "Import failed")));
          }
        }
      };

      xhr.open("POST", `${API_BASE_URL}/api/email/import/stream?year=${year}`);
      xhr.setRequestHeader("Accept", "text/event-stream");
      xhr.setRequestHeader("Content-Type", "application/json");
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.onprogress = () => {
        const newText = xhr.responseText.slice(lastIndex);
        lastIndex = xhr.responseText.length;
        if (newText) {
          handleChunk(newText);
        }
      };

      xhr.onerror = () => {
        if (!completed) {
          reject(new Error("Network error during import"));
        }
      };

      xhr.onload = () => {
        if (completed) {
          return;
        }

        const newText = xhr.responseText.slice(lastIndex);
        if (newText) {
          handleChunk(newText);
        }

        if (!completed) {
          reject(new Error(`Import failed (${xhr.status})`));
        }
      };

      xhr.send(JSON.stringify({}));
    });
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
