import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import {
  readEmail,
  readPassword,
  readRequiredString,
  type ChangePasswordBody,
  type DeleteAccountBody,
  type LoginBody,
  type SignupBody,
} from "./auth.dto";
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

  async changePassword(body: ChangePasswordBody, user: AuthUser) {
    const input = this.readChangePasswordInput(body);
    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        passwordHash: true,
      },
    });

    if (!currentUser || !(await verifyPassword(input.currentPassword, currentUser.passwordHash))) {
      throw new UnauthorizedException("현재 비밀번호가 올바르지 않습니다.");
    }

    await this.prisma.user.update({
      data: {
        passwordHash: await hashPassword(input.nextPassword),
      },
      where: {
        id: user.id,
      },
    });

    return {
      message: "비밀번호가 변경되었습니다. 다시 로그인해 주세요.",
      ok: true,
    };
  }

  async deleteAccount(body: DeleteAccountBody, user: AuthUser) {
    const input = this.readDeleteAccountInput(body);

    if (input.confirmEmail !== user.email) {
      throw new BadRequestException("탈퇴 확인 email이 현재 계정과 일치하지 않습니다.");
    }

    await this.prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    return {
      message: "회원 탈퇴가 완료되었습니다.",
      ok: true,
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

  private readChangePasswordInput(body: ChangePasswordBody) {
    try {
      const currentPassword = readPassword(body.currentPassword);
      const nextPassword = readPassword(body.nextPassword);

      if (currentPassword === nextPassword) {
        throw new Error("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
      }

      return {
        currentPassword,
        nextPassword,
      };
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "입력값을 확인해주세요.");
    }
  }

  private readDeleteAccountInput(body: DeleteAccountBody) {
    try {
      return {
        confirmEmail: readEmail(body.confirmEmail),
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
