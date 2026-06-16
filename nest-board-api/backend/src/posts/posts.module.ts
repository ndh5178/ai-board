import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RagModule } from "../rag/rag.module";
import { JobRecommendationCommentService } from "./job-recommendation-comment.service";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";

@Module({
  controllers: [PostsController],
  exports: [PostsService],
  imports: [AuthModule, RagModule],
  providers: [JobRecommendationCommentService, PostsService],
})
export class PostsModule {}
