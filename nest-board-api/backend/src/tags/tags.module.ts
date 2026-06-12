import { Module } from "@nestjs/common";
import { PostsModule } from "../posts/posts.module";
import { TagsController } from "./tags.controller";
import { TagsService } from "./tags.service";

@Module({
  controllers: [TagsController],
  imports: [PostsModule],
  providers: [TagsService],
})
export class TagsModule {}
