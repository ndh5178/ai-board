import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RagModule } from "../rag/rag.module";
import { JobPostingsController } from "./job-postings.controller";
import { JobPostingsService } from "./job-postings.service";

@Module({
  imports: [AuthModule, RagModule],
  controllers: [JobPostingsController],
  providers: [JobPostingsService],
})
export class JobPostingsModule {}
