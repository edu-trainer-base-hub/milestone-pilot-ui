export interface CreatePlatformUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UpdatePlatformUserRequest {
  firstName: string;
  lastName: string;
  role: string;
}

export interface PlatformUserResponse {
  id?: string;
  uuid?: string;
  email: string;
  firstName: string;
  lastName: string;
  platformRole: string;
  createdAt?: string;
  updatedAt?: string;
}

export const PlatformRole = {
  ROLE_PLATFORM_ADMIN: "ROLE_PLATFORM_ADMIN",
  ROLE_PLATFORM_MANAGER: "ROLE_PLATFORM_MANAGER",
} as const;

export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole];

export const getPlatformUserId = (user: Pick<PlatformUserResponse, "id" | "uuid">): string =>
  user.id ?? user.uuid ?? "";
