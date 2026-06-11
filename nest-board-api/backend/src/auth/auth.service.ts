import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { readEmail, readPassword, readRequiredString, type LoginBody, type SignupBody } from "./auth.dto";
import type { AuthUser } from "./auth.types";
import { hashPassword, verifyPassword } from "./password";
import { createAccessToken, verifyAccessToken } from "./token";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async signup(body: SignupBody) {
    const input = this.readSignupInput(body);
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (existingUser) {
      throw new ConflictException("이미 가입된 email입니다.");
    }

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash: await hashPassword(input.password),
      },
      select: this.userSelect(),
    });

    return this.createAuthResponse(user);
  }

  async login(body: LoginBody) {
    const input = this.readLoginInput(body);
    const user = await this.prisma.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new UnauthorizedException("email 또는 비밀번호가 올바르지 않습니다.");
    }

    return this.createAuthResponse({
      email: user.email,
      id: user.id,
      name: user.name,
      role: user.role,
    });
  }

  getProfile(user: AuthUser) {
    return {
      user,
    };
  }

  verifyToken(token: string) {
    try {
      const payload = verifyAccessToken(token, this.jwtSecret());

      if (!payload) {
        throw new UnauthorizedException("로그인이 필요합니다.");
      }

      return {
        email: payload.email,
        id: payload.sub,
        name: payload.name,
        role: payload.role,
      };
    } catch {
      throw new UnauthorizedException("로그인이 필요합니다.");
    }
  }

  private createAuthResponse(user: AuthUser) {
    return {
      accessToken: createAccessToken(user, this.jwtSecret(), this.jwtExpiresInSeconds()),
      user,
    };
  }

  private jwtSecret() {
    return process.env.JWT_SECRET ?? "nest-board-local-dev-secret";
  }

  private jwtExpiresInSeconds() {
    const rawValue = Number(process.env.JWT_EXPIRES_IN_SECONDS);

    if (!Number.isFinite(rawValue) || rawValue <= 0) {
      return undefined;
    }

    return rawValue;
  }

  private readSignupInput(body: SignupBody) {
    try {
      return {
        email: readEmail(body.email),
        name: readRequiredString(body.name, "name"),
        password: readPassword(body.password),
      };
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "입력값을 확인해주세요.");
    }
  }

  private readLoginInput(body: LoginBody) {
    try {
      return {
        email: readEmail(body.email),
        password: readPassword(body.password),
      };
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "입력값을 확인해주세요.");
    }
  }

  private userSelect() {
    return {
      email: true,
      id: true,
      name: true,
      role: true,
    };
  }
}
