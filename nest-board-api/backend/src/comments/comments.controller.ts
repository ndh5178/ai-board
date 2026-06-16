import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import type { CreateCommentBody, UpdateCommentBody } from "./comments.dto";
import { CommentsService } from "./comments.service";

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post("posts/:postId/comments")
  @UseGuards(AuthGuard)
  create(
    @Param("postId") postId: string,
    @Body() body: CreateCommentBody,
    @CurrentUser() user: AuthUser,
  ) {
    return this.commentsService.create(postId, body, user);
  }

  @Delete("comments/:id")
  @UseGuards(AuthGuard)
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.commentsService.remove(id, user);
  }

  @Patch("comments/:id")
  @UseGuards(AuthGuard)
  update(@Param("id") id: string, @Body() body: UpdateCommentBody, @CurrentUser() user: AuthUser) {
    return this.commentsService.update(id, body, user);
  }
}
