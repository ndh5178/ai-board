import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { JobPostingsModule } from "../job-postings/job-postings.module";
import { RagModule } from "../rag/rag.module";
import { JobRecommendationCommentService } from "./job-recommendation-comment.service";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";

@Module({
  controllers: [PostsController],
  exports: [PostsService],
  imports: [AuthModule, JobPostingsModule, RagModule],
  providers: [JobRecommendationCommentService, PostsService],
})
export class PostsModule {}
