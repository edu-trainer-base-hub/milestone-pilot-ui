import { del, get, post, put } from "./ApiService";

export interface UserProfilesDto {
  items: UserProfileDto[];
}

export interface UserProfileDto {
  id: number;
  uuid: string;
  profileType: "PRIMARY" | "SECONDARY";
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  locale: string;
  primaryProfileUuid: string | null;
  verifiedEmail: boolean;
}

export interface SecondaryProfileCreateRequest {
  username: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  locale?: string;
}

export interface SecondaryProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  password?: string;
  locale?: string;
}

export const getMe = async (): Promise<UserProfileDto> => {
  return await get<UserProfileDto>("/private/profiles/me");
};

export const retrieveSecondary = async (profileUuid: string): Promise<UserProfileDto> => {
  return await get<UserProfileDto>(`private/profiles/secondaries/${profileUuid}`);
};

export const listSecondaries = async (): Promise<UserProfilesDto> => {
  return await get<UserProfilesDto>("/private/profiles/secondaries");
};

export const createSecondary = async (data: SecondaryProfileCreateRequest): Promise<UserProfileDto> => {
  return await post<UserProfileDto>("/private/profiles/secondaries", data);
};

export const updateSecondary = async (
  profileUuid: string,
  data: SecondaryProfileUpdateRequest
): Promise<UserProfileDto> => {
  return await put<UserProfileDto>(`/private/profiles/secondaries/${profileUuid}`, data);
};

export const deleteSecondary = async (profileUuid: string): Promise<void> => {
  await del(`/private/profiles/secondaries/${profileUuid}`);
};

export default {
  getMe,
  retrieveSecondary,
  listSecondaries,
  createSecondary,
  updateSecondary,
  deleteSecondary,
};
