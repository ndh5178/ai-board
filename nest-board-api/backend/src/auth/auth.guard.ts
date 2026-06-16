import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import type { RequestWithUser } from "./auth.types";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authorization = request.headers.authorization;
    const headerValue = Array.isArray(authorization) ? authorization[0] : authorization;

    if (!headerValue?.startsWith("Bearer ")) {
      throw new UnauthorizedException("로그인이 필요합니다.");
    }

    request.user = this.authService.verifyToken(headerValue.replace("Bearer ", ""));

    return true;
  }
}
