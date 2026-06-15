import { Module } from "@nestjs/common";
import { AiModule } from "./ai/ai.module";
import { AuthModule } from "./auth/auth.module";
import { CommentsModule } from "./comments/comments.module";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { JobPostingsModule } from "./job-postings/job-postings.module";
import { McpModule } from "./mcp/mcp.module";
import { PostsModule } from "./posts/posts.module";
import { RagModule } from "./rag/rag.module";
import { TagsModule } from "./tags/tags.module";

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    AuthModule,
    PostsModule,
    CommentsModule,
    TagsModule,
    RagModule,
    McpModule,
    AiModule,
    JobPostingsModule,
  ],
})
export class AppModule {}
