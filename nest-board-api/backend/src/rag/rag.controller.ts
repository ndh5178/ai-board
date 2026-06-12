import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import type { SearchJobPostingsQuery } from "./rag.dto";
import { RagService } from "./rag.service";

@Controller("rag")
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Get("job-postings/search")
  searchJobPostings(@Query() query: SearchJobPostingsQuery) {
    try {
      return this.ragService.searchJobPostings(query);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "입력값을 확인해주세요.");
    }
  }
}
