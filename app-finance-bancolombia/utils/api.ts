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

export const api = {
  baseUrl: API_BASE_URL,

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
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message ?? "Request failed");
    }

    return response.json();
  },

  async post<T>(endpoint: string, body: unknown, authenticated = false): Promise<T> {
    const token = authenticated ? await getAuthToken() : null;
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
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message ?? "Request failed");
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
