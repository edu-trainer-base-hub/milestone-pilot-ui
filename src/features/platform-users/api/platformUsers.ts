import { get, post, put } from "@/services/ApiService";
import type { CreatePlatformUserRequest, PlatformUserResponse, UpdatePlatformUserRequest } from "../model/types";

const PLATFORM_USERS_BASE_URL = "/api/v1/platform/users";

export const createPlatformUser = (request: CreatePlatformUserRequest): Promise<PlatformUserResponse> =>
  post<PlatformUserResponse>(PLATFORM_USERS_BASE_URL, request);

export const getPlatformUsers = (): Promise<PlatformUserResponse[]> =>
  get<PlatformUserResponse[]>(PLATFORM_USERS_BASE_URL);

export const updatePlatformUser = (userId: string, request: UpdatePlatformUserRequest): Promise<PlatformUserResponse> =>
  put<PlatformUserResponse>(`${PLATFORM_USERS_BASE_URL}/${userId}`, request);
