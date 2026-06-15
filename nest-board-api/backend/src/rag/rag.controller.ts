import { BadRequestException, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { AuthGuard } from "../auth/auth.guard";
import type { SearchPostsQuery } from "./rag.dto";
import { RagService } from "./rag.service";

@Controller("rag")
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Get("posts/search")
  async searchPosts(@Query() query: SearchPostsQuery) {
    try {
      return await this.ragService.searchPosts(query);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "입력값을 확인해주세요.");
    }
  }

  @Post("posts/reindex")
  @UseGuards(AuthGuard, AdminGuard)
  reindexPosts() {
    return this.ragService.reindexPublishedPosts();
  }
}
