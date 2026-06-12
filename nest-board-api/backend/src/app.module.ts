import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { CommentsModule } from "./comments/comments.module";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { PostsModule } from "./posts/posts.module";
import { TagsModule } from "./tags/tags.module";

@Module({
  imports: [DatabaseModule, HealthModule, AuthModule, PostsModule, CommentsModule, TagsModule],
})
export class AppModule {}
