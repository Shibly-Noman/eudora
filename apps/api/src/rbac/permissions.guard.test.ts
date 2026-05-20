import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { describe, expect, it, vi } from "vitest";

import { PermissionsGuard } from "./permissions.guard.js";
import { REQUIRE_PERMISSIONS_KEY } from "./require-permissions.decorator.js";

function createContext(userPermissions: string[], requiredPermissions: string[]): ExecutionContext {
  const handler = function handler() {};
  Reflect.defineMetadata(REQUIRE_PERMISSIONS_KEY, requiredPermissions, handler);

  return {
    getHandler: () => handler,
    getClass: () => class TestController {},
    switchToHttp: () => ({
      getRequest: () => ({
        user: {
          id: "user_1",
          permissions: userPermissions
        }
      })
    })
  } as unknown as ExecutionContext;
}

describe("PermissionsGuard", () => {
  it("allows requests when the authenticated user has every required permission", () => {
    const guard = new PermissionsGuard(new Reflector());

    expect(guard.canActivate(createContext(["users.read", "users.activate"], ["users.read"]))).toBe(true);
  });

  it("rejects requests when a required permission is missing", () => {
    const guard = new PermissionsGuard(new Reflector());

    expect(() => guard.canActivate(createContext(["users.read"], ["users.activate"]))).toThrow(
      ForbiddenException
    );
  });

  it("allows requests with no permission metadata", () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(undefined)
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(createContext([], []))).toBe(true);
  });
});
