import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import { describe, expect, it } from "vitest";

import { CSRF_TOKEN_COOKIE } from "./auth.constants.js";
import { CsrfGuard } from "./csrf.guard.js";

function createContext(method: string, cookieHeader?: string, csrfHeader?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        headers: {
          cookie: cookieHeader,
          "x-csrf-token": csrfHeader
        }
      })
    })
  } as unknown as ExecutionContext;
}

describe("CsrfGuard", () => {
  it("allows unsafe requests when header and cookie tokens match", () => {
    const guard = new CsrfGuard();

    expect(guard.canActivate(createContext("POST", `${CSRF_TOKEN_COOKIE}=token`, "token"))).toBe(true);
  });

  it("rejects unsafe requests when the CSRF token is missing", () => {
    const guard = new CsrfGuard();

    expect(() => guard.canActivate(createContext("POST"))).toThrow(ForbiddenException);
  });

  it("allows safe requests without a CSRF token", () => {
    const guard = new CsrfGuard();

    expect(guard.canActivate(createContext("GET"))).toBe(true);
  });
});
