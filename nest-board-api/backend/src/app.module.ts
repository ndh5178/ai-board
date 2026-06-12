import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { PostsModule } from "./posts/posts.module";

@Module({
  imports: [DatabaseModule, HealthModule, AuthModule, PostsModule],
})
export class AppModule {}
