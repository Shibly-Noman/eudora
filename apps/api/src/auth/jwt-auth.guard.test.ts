import { UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { ACCESS_TOKEN_COOKIE } from "./auth.constants.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { JwtService } from "./jwt.service.js";

function createContext(cookieHeader?: string) {
  const request = {
    headers: {
      cookie: cookieHeader
    },
    user: undefined
  };

  return {
    request,
    context: {
      switchToHttp: () => ({
        getRequest: () => request
      })
    } as unknown as ExecutionContext
  };
}

describe("JwtAuthGuard", () => {
  it("attaches the authenticated user and permissions from an access token cookie", async () => {
    const jwtService = new JwtService();
    const token = jwtService.sign(
      {
        sub: "user_1",
        email: "person@example.com",
        typ: "access"
      },
      { expiresInSeconds: 60 }
    );
    const rbacService = {
      getUserPermissions: vi.fn().mockResolvedValue(["users.read"])
    };
    const guard = new JwtAuthGuard(jwtService, rbacService as never);
    const { context, request } = createContext(`${ACCESS_TOKEN_COOKIE}=${token}`);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({
      id: "user_1",
      email: "person@example.com",
      permissions: ["users.read"]
    });
  });

  it("rejects requests without an access token cookie", async () => {
    const guard = new JwtAuthGuard(new JwtService(), { getUserPermissions: vi.fn() } as never);
    const { context } = createContext();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
