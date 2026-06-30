import { describe, expect, it } from "vitest";
import { Authority } from "@/contexts/AuthContext";
import {
  canCreatePlatformUser,
  canReadPlatformUsers,
  canUpdatePlatformUser,
  getCreatablePlatformRoles,
} from "./access-policy";
import { PlatformRole } from "./types";

describe("platform users access policy", () => {
  it("derives creatable platform roles from target-role authorities", () => {
    expect(getCreatablePlatformRoles([Authority.PLATFORM_MANAGERS_CREATE])).toEqual([
      PlatformRole.ROLE_PLATFORM_MANAGER,
    ]);
    expect(getCreatablePlatformRoles([Authority.PLATFORM_ADMINS_CREATE, Authority.PLATFORM_MANAGERS_CREATE])).toEqual([
      PlatformRole.ROLE_PLATFORM_ADMIN,
      PlatformRole.ROLE_PLATFORM_MANAGER,
    ]);
  });

  it("does not treat UI authorities as platform-user CRUD access", () => {
    const authorities = [Authority.UI_PLATFORM_USERS_VIEW];

    expect(canReadPlatformUsers(authorities)).toBe(false);
    expect(canCreatePlatformUser(authorities, PlatformRole.ROLE_PLATFORM_MANAGER)).toBe(false);
    expect(canUpdatePlatformUser(authorities, PlatformRole.ROLE_PLATFORM_MANAGER)).toBe(false);
  });

  it("checks update access by target platform role", () => {
    expect(canUpdatePlatformUser([Authority.PLATFORM_MANAGERS_UPDATE], PlatformRole.ROLE_PLATFORM_MANAGER)).toBe(true);
    expect(canUpdatePlatformUser([Authority.PLATFORM_MANAGERS_UPDATE], PlatformRole.ROLE_PLATFORM_ADMIN)).toBe(false);
  });
});
