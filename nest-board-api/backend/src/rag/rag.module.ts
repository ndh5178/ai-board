import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ChromaVectorService } from "./chroma-vector.service";
import { RagController } from "./rag.controller";
import { RagService } from "./rag.service";

@Module({
  imports: [AuthModule],
  controllers: [RagController],
  exports: [RagService, ChromaVectorService],
  providers: [RagService, ChromaVectorService],
})
export class RagModule {}
