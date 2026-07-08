import { get, put } from "@/services/ApiService";

// 5-character locale type, e.g., en-US, uk-UA, ru-RU
export type Locale5 = "en-US" | "uk-UA" | "ru-RU";

export interface UpdateSettingsRequest {
  locale?: Locale5;
}

export interface UpdateSettingsResponse {
  locale?: Locale5;
}

class SettingsApiClient {
  static async updateSettings(req: UpdateSettingsRequest): Promise<UpdateSettingsResponse> {
    return put<UpdateSettingsResponse>("/private/settings", req);
  }

  static async getSettings(): Promise<UpdateSettingsResponse> {
    const url = `/private/settings`;
    return get<UpdateSettingsResponse>(url);
  }
}

export default SettingsApiClient;
