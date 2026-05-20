import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

import { CSRF_TOKEN_COOKIE } from "./auth.constants.js";
import { parseCookieHeader } from "./cookies.js";

type RequestWithHeaders = {
  method: string;
  headers: Record<string, string | string[] | undefined>;
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithHeaders>();

    if (SAFE_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    const csrfCookie = parseCookieHeader(headerToString(request.headers.cookie))[CSRF_TOKEN_COOKIE];
    const csrfHeader = headerToString(request.headers["x-csrf-token"]);

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      throw new ForbiddenException("Invalid CSRF token");
    }

    return true;
  }
}

function headerToString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value.join(",") : value;
}
