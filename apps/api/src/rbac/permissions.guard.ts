import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { type AuthenticatedUser } from "../auth/auth.types.js";
import { REQUIRE_PERMISSIONS_KEY } from "./require-permissions.decorator.js";

type RequestWithUser = {
  user?: AuthenticatedUser;
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(REQUIRE_PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass()
      ]) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userPermissions = new Set(request.user?.permissions ?? []);
    const hasEveryPermission = requiredPermissions.every((permission) => userPermissions.has(permission));

    if (!hasEveryPermission) {
      throw new ForbiddenException("Missing required permission");
    }

    return true;
  }
}
