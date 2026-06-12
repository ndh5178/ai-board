import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";

@Module({
  controllers: [PostsController],
  imports: [AuthModule],
  providers: [PostsService],
})
export class PostsModule {}
