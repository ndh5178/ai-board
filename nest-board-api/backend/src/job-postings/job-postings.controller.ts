import { Controller, Post, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { AuthGuard } from "../auth/auth.guard";
import { JobPostingsService } from "./job-postings.service";

@Controller("job-postings")
export class JobPostingsController {
  constructor(private readonly jobPostingsService: JobPostingsService) {}

  @Post("saramin/sync")
  @UseGuards(AuthGuard, AdminGuard)
  syncSaraminJobPostings() {
    return this.jobPostingsService.syncSaraminJobPostings();
  }
}
