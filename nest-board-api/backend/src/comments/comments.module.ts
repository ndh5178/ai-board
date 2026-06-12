import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CommentsController } from "./comments.controller";
import { CommentsService } from "./comments.service";

@Module({
  controllers: [CommentsController],
  imports: [AuthModule],
  providers: [CommentsService],
})
export class CommentsModule {}
