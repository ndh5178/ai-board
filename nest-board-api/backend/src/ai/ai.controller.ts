import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
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

  @Post("posts/:postId/job-match-comment")
  @UseGuards(AuthGuard)
  createJobMatchComment(@Param("postId") postId: string, @CurrentUser() user: AuthUser) {
    return this.aiService.createJobMatchComment(postId, user);
  }

  @Post("posts/:postId/research-comment")
  @UseGuards(AuthGuard)
  createResearchComment(@Param("postId") postId: string, @CurrentUser() user: AuthUser) {
    return this.aiService.createResearchComment(postId, user);
  }
}
