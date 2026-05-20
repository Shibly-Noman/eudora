import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";

import { RbacService } from "../rbac/rbac.service.js";
import { ACCESS_TOKEN_COOKIE } from "./auth.constants.js";
import { type AuthenticatedUser } from "./auth.types.js";
import { parseCookieHeader } from "./cookies.js";
import { JwtService } from "./jwt.service.js";

type RequestWithUser = {
  headers: {
    cookie?: string;
  };
  user?: AuthenticatedUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(RbacService) private readonly rbacService: RbacService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = parseCookieHeader(request.headers.cookie)[ACCESS_TOKEN_COOKIE];

    if (!token) {
      throw new UnauthorizedException("Access token is required");
    }

    const payload = this.jwtService.verify(token);

    if (payload.typ !== "access" || typeof payload.sub !== "string" || typeof payload.email !== "string") {
      throw new UnauthorizedException("Invalid access token");
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
      permissions: await this.rbacService.getUserPermissions(payload.sub)
    };

    return true;
  }
}
