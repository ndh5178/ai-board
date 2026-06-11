import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return {
      app: "nest-board-backend",
      message: "NestJS 백엔드가 정상 실행 중입니다.",
      status: "ok" as const,
      timestamp: new Date().toISOString(),
    };
  }

  async getDatabaseHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        database: "mariadb",
        message: "DB 연결이 정상입니다.",
        status: "ok" as const,
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        database: "mariadb",
        message: "DB 연결을 확인할 수 없습니다. DATABASE_URL과 DB 실행 상태를 확인하세요.",
        status: "error" as const,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
