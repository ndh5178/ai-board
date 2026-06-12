import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import type { CreatePostBody, UpdatePostBody } from "./posts.dto";
import { PostsService } from "./posts.service";

@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() body: CreatePostBody, @CurrentUser() user: AuthUser) {
    return this.postsService.create(body, user);
  }

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(AuthGuard)
  update(@Param("id") id: string, @Body() body: UpdatePostBody, @CurrentUser() user: AuthUser) {
    return this.postsService.update(id, body, user);
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.postsService.remove(id, user);
  }
}
