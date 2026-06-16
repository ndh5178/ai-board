import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { MeService } from "./me.service";

@Controller("me")
@UseGuards(AuthGuard)
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get("summary")
  getSummary(@CurrentUser() user: AuthUser) {
    return this.meService.getSummary(user);
  }

  @Get("posts")
  findMyPosts(@CurrentUser() user: AuthUser) {
    return this.meService.findMyPosts(user);
  }

  @Get("comments")
  findMyComments(@CurrentUser() user: AuthUser) {
    return this.meService.findMyComments(user);
  }
}
