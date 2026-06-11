import { Injectable } from "@nestjs/common";

@Injectable()
export class HealthService {
  getHealth() {
    return {
      app: "nest-board-backend",
      message: "NestJS 백엔드가 정상 실행 중입니다.",
      status: "ok" as const,
      timestamp: new Date().toISOString(),
    };
  }
}
