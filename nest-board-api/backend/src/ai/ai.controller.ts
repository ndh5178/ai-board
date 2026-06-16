import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { AiService } from "./ai.service";

@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get("me/writing-style")
  @UseGuards(AuthGuard)
  getMyWritingStyle(@CurrentUser() user: AuthUser) {
    return this.aiService.analyzeMyWritingStyle(user);
  }
}
